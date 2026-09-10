import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const catalogRequestPattern = /\/rest\/v1\/catalog_products(?:\?|$)/

test('real catalog paginates and survives reload and browser history', async ({
  page,
}) => {
  let catalogRequests = 0

  page.on('request', (request) => {
    if (catalogRequestPattern.test(request.url())) {
      catalogRequests += 1
    }
  })

  await page.goto('/catalog')
  await expect(page.getByText('Найдено: 32. Страница 1 из 3.')).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(12)
  expect(catalogRequests).toBe(1)

  await page.getByRole('link', { name: 'Страница 2' }).click()
  await expect(page).toHaveURL('/catalog?page=2')
  await expect(page.getByText('Найдено: 32. Страница 2 из 3.')).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(12)
  const firstProductOnPageTwo = await page
    .getByRole('article')
    .first()
    .getAttribute('id')

  await page.reload()
  await expect(page.getByText('Найдено: 32. Страница 2 из 3.')).toBeVisible()
  await expect(page.getByRole('article').first()).toHaveAttribute(
    'id',
    firstProductOnPageTwo ?? '',
  )

  await page.goBack()
  await expect(page).toHaveURL('/catalog')
  await expect(page.getByText('Найдено: 32. Страница 1 из 3.')).toBeVisible()

  await page.goForward()
  await expect(page).toHaveURL('/catalog?page=2')
  await expect(page.getByText('Найдено: 32. Страница 2 из 3.')).toBeVisible()
})

test('slow catalog request shows a stable skeleton and is not duplicated', async ({
  page,
}) => {
  let catalogRequests = 0

  await page.route(catalogRequestPattern, async (route) => {
    catalogRequests += 1
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.continue()
  })

  await page.goto('/catalog', { waitUntil: 'domcontentloaded' })
  const loadingGrid = page.locator('[aria-label="Загрузка товаров"]')
  await expect(loadingGrid).toBeVisible()
  const loadingBox = await loadingGrid.boundingBox()

  await expect(page.getByRole('article')).toHaveCount(12)
  const loadedGrid = page.getByRole('article').first().locator('..')
  const loadedBox = await loadedGrid.boundingBox()

  expect(catalogRequests).toBe(1)
  expect(loadingBox?.width).toBe(loadedBox?.width)
  expect(loadingBox?.height ?? 0).toBeGreaterThan(0)
  expect(loadedBox?.height ?? 0).toBeGreaterThan(0)
})

test('catalog grid exposes one through four responsive columns', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/catalog')
  await expect(page.getByRole('article')).toHaveCount(12)

  const grid = page.getByRole('article').first().locator('..')
  const columnCount = () =>
    grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length,
    )

  await expect.poll(columnCount).toBe(1)
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect.poll(columnCount).toBe(2)
  await page.setViewportSize({ width: 1000, height: 900 })
  await expect.poll(columnCount).toBe(3)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect.poll(columnCount).toBe(4)
})

test('catalog result semantics have no detectable axe violations', async ({ page }) => {
  await page.goto('/catalog')
  await expect(page.getByText('Найдено: 32. Страница 1 из 3.')).toBeVisible()
  await expect(
    page
      .getByRole('article')
      .first()
      .getByText(/В наличии/),
  ).toBeVisible()
  await expect(
    page.getByRole('article').first().getByText('Линия посадки'),
  ).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
