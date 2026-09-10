import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const catalogRequestPattern = /\/rest\/v1\/catalog_products(?:\?|$)/

test('invalid URL normalizes canonically and direct facet state survives reload', async ({
  page,
}) => {
  await page.goto('/catalog?junk=1&brand=sever&brand=bad&brand=sever&sort=bad&page=1')

  await expect(page).toHaveURL('/catalog?brand=sever')
  await expect(page.getByText('Найдено: 6. Страница 1 из 1.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Убрать: СЕВЕР' })).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL('/catalog?brand=sever')
  await expect(page.getByText('Найдено: 6. Страница 1 из 1.')).toBeVisible()
})

test('search covers title, brand, model and typed use-case tags', async ({ page }) => {
  const cases = [
    ['Городские кроссовки Signal 01', 'sever-signal-01'],
    ['СЕВЕР', 'sever-signal-01'],
    ['Metro', 'forma-metro'],
    ['офис', 'forma-metro'],
  ] as const

  for (const [query, expectedProduct] of cases) {
    await page.goto(`/catalog?q=${encodeURIComponent(query)}`)
    await expect(page.locator(`article#${expectedProduct}`)).toBeVisible()
  }
})

test('latest URL search wins when an older request is slow', async ({ page }) => {
  let delayedMetro = false

  await page.route(catalogRequestPattern, async (route) => {
    const requestUrl = decodeURIComponent(route.request().url())
    if (!delayedMetro && requestUrl.includes('Metro')) {
      delayedMetro = true
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
    await route.continue()
  })

  await page.goto('/catalog')
  await expect(page.getByText('Найдено: 32. Страница 1 из 3.')).toBeVisible()
  const search = page.getByLabel('Поиск по названию, бренду и сценарию')

  await search.fill('Metro')
  await expect(page).toHaveURL('/catalog?q=Metro')
  await expect(page.getByText(/Обновляем выдачу/)).toBeVisible()

  await search.fill('Outline')
  await expect(page).toHaveURL('/catalog?q=Outline')
  await expect(page.locator('article#forma-outline')).toBeVisible()
  await expect(page.locator('article#forma-metro')).toHaveCount(0)
})

test('desktop rail search and sort reproduce through Back and Forward', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/catalog')

  const rail = page.getByRole('complementary', { name: 'Фильтры каталога' })
  await expect(rail).toBeVisible()
  await rail.getByLabel('ФОРМА').click()
  await expect(page).toHaveURL('/catalog?brand=forma')
  await expect(page.getByText('Найдено: 6. Страница 1 из 1.')).toBeVisible()

  await page.getByLabel('Сортировка').selectOption('price-desc')
  await expect(page).toHaveURL('/catalog?brand=forma&sort=price-desc')
  await expect(page.getByRole('article').first()).toHaveAttribute('id', 'forma-outline')

  await page.getByLabel('Поиск по названию, бренду и сценарию').fill('офис')
  await expect(page).toHaveURL(
    '/catalog?q=%D0%BE%D1%84%D0%B8%D1%81&brand=forma&sort=price-desc',
  )
  await expect(page.getByRole('article').first()).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Сортировка')).toHaveValue('price-desc')
  await expect(page.getByLabel('Поиск по названию, бренду и сценарию')).toHaveValue(
    'офис',
  )

  await page.goBack()
  await expect(page).toHaveURL('/catalog?brand=forma')
  await page.goForward()
  await expect(page).toHaveURL(
    '/catalog?q=%D0%BE%D1%84%D0%B8%D1%81&brand=forma&sort=price-desc',
  )

  await page
    .getByLabel('Поиск по названию, бренду и сценарию')
    .fill('такой модели точно нет')
  await expect(
    page.getByRole('heading', { name: 'По этим условиям пар нет' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Сбросить условия' }).click()
  await expect(page).toHaveURL('/catalog')
  await expect(page.getByText('Найдено: 32. Страница 1 из 3.')).toBeVisible()
})

test('mobile filter sheet keeps draft changes until Apply and returns focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/catalog?brand=sever')

  const trigger = page.getByRole('button', { name: /^Фильтры/ })
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44)
  expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44)

  await trigger.click()
  let dialog = page.getByRole('dialog', { name: 'Фильтры каталога' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('СЕВЕР')).toBeChecked()
  await dialog.getByLabel('Белый').check()
  await dialog.getByRole('button', { name: 'Отмена' }).click()
  await expect(page).toHaveURL('/catalog?brand=sever')
  await expect(trigger).toBeFocused()

  await trigger.click()
  dialog = page.getByRole('dialog', { name: 'Фильтры каталога' })
  await dialog.getByLabel('Белый').check()
  await dialog.getByRole('button', { name: 'Показать результаты' }).click()
  await expect(page).toHaveURL('/catalog?brand=sever&color=white')
  await expect(page.getByRole('button', { name: 'Убрать: Белый' })).toBeVisible()

  await trigger.click()
  const results = await new AxeBuilder({ page }).include('dialog').analyze()
  expect(results.violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('all required facets reach Data API and price sort is deterministic', async ({
  page,
}) => {
  const catalogResponses: number[] = []
  page.on('response', (response) => {
    if (response.url().includes('/rest/v1/catalog_products?')) {
      catalogResponses.push(response.status())
    }
  })

  await page.goto(
    '/catalog?use=office&size=42&width=standard&color=black' +
      '&priceMin=1000000&priceMax=1800000&inStock=true&sort=newest',
  )
  await expect(
    page.getByRole('heading', { level: 1, name: 'Городские пары' }),
  ).toBeVisible()
  await expect.poll(() => catalogResponses.at(-1)).toBe(200)
  await expect(page.getByRole('button', { name: 'Убрать: Офис' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Убрать: EU 42' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Убрать: Стандартная' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Убрать: Чёрный' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Убрать: В наличии' })).toBeVisible()

  await page.goto('/catalog?sort=price-desc')
  await expect(page.getByRole('article')).toHaveCount(12)
  const prices = await page
    .getByRole('article')
    .locator('p', { hasText: '₽' })
    .allTextContents()
  const numericPrices = prices
    .slice(0, 2)
    .map((price) => Number(price.replace(/\D/g, '')))
  expect(numericPrices[0]).toBeGreaterThanOrEqual(numericPrices[1] ?? 0)
})
