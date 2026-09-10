import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('exact PDP line persists, quick sheet returns focus, and cart supports edit/undo/clear', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/products/sever-signal-01')
  const sizes = page.getByRole('group', { name: 'Размер EU' })
  await sizes.locator('button:not(:disabled)').first().click()
  const skuText = await page.getByText(/^SKU SOLECRAFT-/).textContent()
  const sku = skuText?.match(/SOLECRAFT-[A-Z0-9-]+/)?.[0]
  expect(sku).toBeTruthy()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await expect(page.getByRole('button', { name: /Корзина 1 товар/ })).toBeVisible()

  await page.reload()
  const cartTrigger = page.getByRole('button', { name: /Корзина 1 товар/ })
  await expect(cartTrigger).toBeVisible()
  await cartTrigger.click()
  const dialog = page.getByRole('dialog', { name: 'Корзина' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(`SKU ${sku}`)).toBeVisible()
  await expect(page.locator('#main-content')).toHaveAttribute('inert', '')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(cartTrigger).toBeFocused()

  await page.goto('/cart')
  await expect(page.getByRole('heading', { level: 1, name: 'Корзина' })).toBeVisible()
  await page.getByRole('button', { name: 'Увеличить количество' }).click()
  await expect(page.getByLabel('Количество товара')).toHaveText('2')
  await page.getByRole('button', { name: /Удалить позицию/ }).click()
  await page.getByRole('button', { name: 'Отменить' }).click()
  await expect(page.getByText(`SKU ${sku}`)).toBeVisible()
  await page.getByRole('button', { name: 'Очистить корзину' }).click()
  await page.getByRole('button', { name: 'Да, очистить' }).click()
  await expect(page.getByText('Корзина пока пуста.')).toBeVisible()
  expect(errors).toEqual([])
})

test('cart route and quick sheet have no detectable axe violations', async ({
  page,
}) => {
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await page.goto('/cart')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: /Корзина 1 товар/ }).click()
  expect(
    (await new AxeBuilder({ page }).include('dialog').analyze()).violations,
  ).toEqual([])
})

test('rapid add is capped by stock and a newer tab update wins predictably', async ({
  page,
  context,
}) => {
  await page.goto('/products/sever-signal-01')
  const sizes = page.getByRole('group', { name: 'Размер EU' })
  await sizes.locator('button:not(:disabled)').first().click()
  const stockText = await page.getByText(/^SKU SOLECRAFT-/).textContent()
  const stock = Number(stockText?.match(/в наличии (\d+)/)?.[1] ?? 1)
  const add = page.getByRole('button', { name: 'Добавить точный размер' })
  for (let index = 0; index < stock + 2; index += 1) await add.click()
  await expect(
    page.getByRole('button', { name: new RegExp(`Корзина ${stock} товар`) }),
  ).toBeVisible()

  const secondPage = await context.newPage()
  await secondPage.goto('/cart')
  await secondPage.getByRole('button', { name: 'Очистить корзину' }).click()
  await secondPage.getByRole('button', { name: 'Да, очистить' }).click()
  await expect(page.getByRole('button', { name: /Корзина 0 товаров/ })).toBeVisible()
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`cart route reflows without horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Корзина' })).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false)
  })
}
