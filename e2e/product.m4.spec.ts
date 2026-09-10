import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

test('catalog → PDP preserves color URL and adds an exact available SKU', async ({
  page,
}) => {
  const errors = runtimeErrors(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/catalog')

  await page.getByRole('link', { name: /Signal 01 — открыть карточку/ }).click()
  await expect(page).toHaveURL(/\/products\/sever-signal-01$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Signal 01' })).toBeVisible()

  const colorways = page.getByRole('group', { name: /Цвет:/ })
  const alternate = colorways.getByRole('button').nth(1)
  await alternate.click()
  await expect(page).toHaveURL(/\?color=[a-z0-9-]+$/)
  const selectedColorUrl = page.url()
  await page.reload()
  await expect(page).toHaveURL(selectedColorUrl)
  await expect(alternate).toHaveAttribute('aria-pressed', 'true')

  const sizes = page.getByRole('group', { name: 'Размер EU' })
  const availableSize = sizes.locator('button:not(:disabled)').first()
  await availableSize.click()
  await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await expect(page.getByRole('status')).toContainText('добавлен в корзину')

  await page.goBack()
  await expect(page).toHaveURL(/\/products\/sever-signal-01$/)
  expect(errors).toEqual([])
})

test('PDP invalid color/404 fail safely and the valid page has no axe violations', async ({
  page,
}) => {
  await page.goto('/products/sever-signal-01?color=missing')
  await expect(page).toHaveURL(/\/products\/sever-signal-01$/)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  await page.goto('/products/no-such-product')
  await expect(
    page.getByRole('heading', { name: 'Такая пара не найдена' }),
  ).toBeVisible()
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`PDP has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/products/sever-signal-01')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Signal 01' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false)
  })
}
