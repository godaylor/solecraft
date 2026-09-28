import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const cartRequestPattern = /\/rest\/v1\/cart_inventory_items(?:\?|$)/

const cartRows = Array.from({ length: 8 }, (_, index) => ({
  inventory_id: `drawer-inventory-${index + 1}`,
  sku: `DRAWER-${String(index + 1).padStart(2, '0')}`,
  stock_on_hand: 8,
  inventory_updated_at: '2026-09-28T00:00:00.000Z',
  size_id: `drawer-size-${index + 1}`,
  size_label: index === 1 ? '42.5' : String(37 + index),
  variant_id: `drawer-variant-${index + 1}`,
  variant_slug: index % 2 ? 'black' : 'white',
  color_slug: index % 2 ? 'black' : 'white',
  color_name: index % 2 ? 'Чёрный' : 'Белый',
  price_minor: 10_000_00 + index * 10_000,
  compare_at_minor: null,
  currency: 'RUB',
  product_id: `drawer-product-${index + 1}`,
  product_slug: `drawer-product-${index + 1}`,
  model:
    index === 7
      ? 'Very Long Demonstration Model Name That Wraps Without Hiding Actions'
      : `Drawer ${index + 1}`,
  title: `Drawer product ${index + 1}`,
  brand_name: index % 2 ? 'ФОРМА' : 'СЕВЕР',
  image_path:
    index % 2
      ? '/media/products/solecraft-02-black.webp'
      : '/media/products/solecraft-01.webp',
  image_alt: '',
  image_width: 1200,
  image_height: 900,
}))

async function seedDrawerCart(page: Page, count: number) {
  const updatedAt = '2026-09-28T00:00:00.000Z'
  await page.evaluate(
    ({ lines, timestamp }) => {
      localStorage.setItem(
        'solecraft:guest-cart',
        JSON.stringify({
          state: {
            lines: lines.map((inventoryId) => ({
              inventoryId,
              quantity: 1,
              updatedAt: timestamp,
            })),
            updatedAt: timestamp,
          },
          version: 1,
        }),
      )
    },
    {
      lines: cartRows.slice(0, count).map((row) => row.inventory_id),
      timestamp: updatedAt,
    },
  )
  await page.reload()
}

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
  // Quantity editing needs more than one item; checkout smoke may consume the
  // first available size in an existing local demo database.
  await sizes
    .locator('button:not(:disabled)')
    .filter({ hasNotText: 'мало' })
    .first()
    .click()
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

test('quick cart keeps one, two, three and eight variants compact and scrollable', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000)
  await page.route(cartRequestPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cartRows),
    }),
  )

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'zoom-200', width: 720, height: 450 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    for (const count of [1, 2, 3, 8]) {
      await seedDrawerCart(page, count)
      const trigger = page.getByRole('button', {
        name: new RegExp(`Корзина ${count} товар`),
      })
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Корзина' })
      await expect(dialog).toBeVisible()
      const list = dialog.locator('ul')
      const lines = list.locator('li')
      await expect(lines).toHaveCount(count)
      await expect(dialog.getByRole('link', { name: 'Открыть корзину' })).toBeVisible()

      if (viewport.name === 'desktop' && count === 1)
        await dialog.screenshot({
          path: testInfo.outputPath('cart-drawer-desktop.png'),
        })
      if (viewport.name === 'mobile' && count === 8)
        await dialog.screenshot({
          path: testInfo.outputPath('cart-drawer-mobile-eight.png'),
        })

      for (let index = 0; index < count; index += 1) {
        const line = lines.nth(index)
        const image = line.locator('img')
        const imageBox = await image.boundingBox()
        const lineBox = await line.boundingBox()
        expect(imageBox).not.toBeNull()
        expect(lineBox).not.toBeNull()
        expect(imageBox!.width).toBeGreaterThanOrEqual(64)
        expect(imageBox!.width).toBeLessThanOrEqual(88)
        expect(imageBox!.height).toBeLessThanOrEqual(88)
        expect(
          lineBox!.height,
          `${viewport.name} line ${index + 1} should grow only with its content`,
        ).toBeLessThan(index === 7 ? 300 : 170)
        await expect(
          line.getByRole('button', { name: /Удалить позицию/ }),
        ).toBeVisible()
      }

      const content = list.locator('..')
      const scroll = await content.evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }))
      if (count === 8) {
        expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight)
        await content.evaluate((element) => {
          element.scrollTop = element.scrollHeight
        })
        const lastBox = await lines.last().boundingBox()
        const contentBox = await content.boundingBox()
        expect(lastBox).not.toBeNull()
        expect(contentBox).not.toBeNull()
        expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(
          contentBox!.y + contentBox!.height + 1,
        )
      }

      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
    }
  }

  await seedDrawerCart(page, 8)
  await page.getByLabel('Английский язык').click()
  await page.getByRole('button', { name: /Cart 8 items/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Cart' })
  await expect(dialog.getByText('Very Long Demonstration Model Name')).toBeVisible()
  await dialog
    .getByRole('button', {
      name: /Remove item Very Long Demonstration Model Name/,
    })
    .click()
  await expect(page.getByRole('button', { name: /Cart 7 items/ })).toBeVisible()
  await expect(dialog.getByText('SKU DRAWER-01')).toBeVisible()
  const subtotalText = await dialog.locator('strong').last().textContent()
  expect(Number(subtotalText?.replace(/[^0-9]/g, ''))).toBe(72_100)
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.getByRole('button', { name: /Cart 7 items/ })).toBeVisible()
})
