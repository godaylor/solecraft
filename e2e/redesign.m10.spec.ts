import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('hero selects real catalog models and curated routes preserve filters', async ({
  page,
}) => {
  await page.goto('/')
  const spotlight = page.getByRole('group', { name: 'Пара на главной' })
  await spotlight.getByRole('button', { name: 'Metro', exact: true }).click()
  await expect(
    spotlight.getByRole('button', { name: 'Metro', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  const hero = page.locator('section[aria-labelledby="home-title"]')
  await expect(hero.locator('img')).toHaveAttribute('src', /solecraft-02.webp/)
  await expect(
    hero.getByRole('link', { name: /Metro — открыть карточку/ }),
  ).toHaveAttribute('href', '/products/forma-metro')
  const collection = page.getByRole('link', { name: /Город \/ каждый день/ })
  await collection.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
  await collection.click()
  await expect(page).toHaveURL(/catalog\?use=all-day$/)
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
})

test('reduced motion keeps hero and colorway interactions usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const spotlight = page.getByRole('group', { name: 'Пара на главной' })
  await spotlight.getByRole('button', { name: 'Route', exact: true }).click()
  await expect(page.locator('main section').first().locator('img')).toHaveAttribute(
    'src',
    /solecraft-03.webp/,
  )
  await page
    .getByRole('link', { name: /ВОЛНА Route — открыть карточку товара/ })
    .first()
    .click()
  await page.getByRole('group', { name: /Цвет:/ }).getByRole('button').nth(1).click()
  await expect(
    page.getByLabel('Галерея товара').locator('img').first(),
  ).toHaveAttribute('src', /solecraft-03-blue.webp/)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('an unavailable hero image preserves product navigation and model switching', async ({
  page,
}) => {
  await page.route('**/media/products/solecraft-01*', (route) => route.abort())
  await page.goto('/')
  const hero = page.locator('section[aria-labelledby="home-title"]')
  await expect(hero.getByText('Фото временно недоступно. Открыть модель')).toBeVisible()
  await expect(
    hero.getByRole('link', { name: /Signal 01 — открыть карточку/ }),
  ).toHaveAttribute('href', '/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Пара на главной' })
    .getByRole('button', { name: 'Metro', exact: true })
    .click()
  await expect(hero.locator('img')).toHaveJSProperty('complete', true)
  await expect(
    hero.getByRole('link', { name: /Metro — открыть карточку/ }),
  ).toHaveAttribute('href', '/products/forma-metro')
})

test('mobile product keyboard focus clears the fixed purchase action', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/products/sever-signal-01')
  const sizes = page.getByRole('group', { name: 'Размер EU' })
  const enabledSizes = sizes.locator('button:not(:disabled)')
  await expect(enabledSizes.first()).toBeVisible()
  await enabledSizes.first().focus()
  for (const direction of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(direction)
    const geometry = await page.evaluate(() => {
      const focused = document.activeElement!
      const control = focused.getBoundingClientRect()
      const action = Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('Добавить точный размер'))!
        .getBoundingClientRect()
      const hit = document.elementFromPoint(
        control.left + control.width / 2,
        control.top + control.height / 2,
      )
      return {
        top: control.top,
        bottom: control.bottom,
        actionTop: action.top,
        clear: hit === focused || focused.contains(hit),
      }
    })
    expect(geometry.top).toBeGreaterThanOrEqual(112)
    expect(geometry.bottom).toBeLessThan(geometry.actionTop - 4)
    expect(geometry.clear).toBe(true)
  }
})

test('size guide identifies illustrative mappings in both languages', async ({
  page,
}) => {
  await page.goto('/products/sever-signal-01')
  await page.getByText('Как выбрать размер', { exact: true }).click()
  const guide = page.locator('details:has(table)')
  await expect(guide).toContainText('Это демонстрационная таблица')
  await expect(guide).toContainText('Пример размерной таблицы, не данные производителя')
  await expect(guide).not.toContainText('Это справочник бренда')
  await page.getByLabel('Английский язык').click()
  await expect(guide).toContainText('This is a demonstration size guide')
  await expect(guide).toContainText('Example size guide, not manufacturer data')
  await expect(guide).not.toContainText('This is a brand guide')
})

test('checkout review wraps a long valid email without hiding totals or submit', async ({
  page,
}) => {
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await page.goto('/checkout/contact')
  await page
    .getByRole('textbox', { name: 'Email' })
    .fill(`audit${'a'.repeat(50)}@${'b'.repeat(60)}.test`)
  await page.getByRole('button', { name: 'К доставке' }).click()
  await page.getByRole('textbox', { name: 'Получатель' }).fill('Демо Покупатель')
  await page.getByRole('textbox', { name: 'Город' }).fill('Демо-город')
  await page
    .getByRole('textbox', { name: 'Адрес', exact: true })
    .fill('Тестовая улица, 1')
  await page.getByRole('button', { name: 'К демо-оплате' }).click()
  await page.getByRole('radio', { name: 'Успешная демо-оплата' }).check()
  await page.getByRole('button', { name: 'Проверить заказ' }).click()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const submit = page.getByRole('button', { name: 'Создать демо-заказ' })
    await expect(submit).toBeVisible()
    const positions = await page.locator('#main-content').evaluate((main) => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      content: Array.from(main.querySelectorAll('p,aside,button')).map((element) => ({
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      })),
    }))
    expect(positions.documentWidth).toBeLessThanOrEqual(width)
    for (const rect of positions.content) {
      expect(rect.left).toBeGreaterThanOrEqual(0)
      expect(rect.right).toBeLessThanOrEqual(width)
    }
  }
})
