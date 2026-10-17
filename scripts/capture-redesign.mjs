import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// Capture only a local build. This script fills illustrative checkout data but
// never submits an order or sends an authentication email.
const baseURL = process.env.SOLECRAFT_CAPTURE_BASE_URL ?? 'http://127.0.0.1:32601'
if (!/^http:\/\/127\.0\.0\.1:3260[01]$/.test(baseURL)) {
  throw new Error('Capture requires the local Solecraft dev or isolated preview build')
}
const output = 'docs/screenshots/redesign'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 768, 1024],
    ['mobile', 360, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, baseURL })
    async function capture(surface, fullPage = true) {
      await page.evaluate(() => globalThis.document.fonts.ready)
      if (fullPage)
        await page.evaluate(() =>
          globalThis.window.scrollTo({ top: 0, behavior: 'instant' }),
        )
      await page.evaluate(() =>
        Promise.all(
          globalThis.document
            .getAnimations()
            .filter(
              (animation) => animation.effect?.getTiming().iterations !== Infinity,
            )
            .map((animation) => animation.finished.catch(() => {})),
        ),
      )
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            globalThis.requestAnimationFrame(() =>
              globalThis.requestAnimationFrame(resolve),
            ),
          ),
      )
      // Stabilize the visible raster before Chromium expands a full-page capture.
      if (fullPage) await page.screenshot({ animations: 'allow' })
      await page.screenshot({
        path: `${output}/after-${surface}-${name}.png`,
        fullPage,
        animations: 'allow',
      })
    }
    async function loadImages() {
      for (const img of await page.locator('main img').all()) {
        await img.scrollIntoViewIfNeeded()
        await img.evaluate((element) => element.decode().catch(() => {}))
      }
      await page.evaluate(() =>
        globalThis.window.scrollTo({ top: 0, behavior: 'instant' }),
      )
    }
    await page.goto('/')
    await page.locator('#sever-signal-01 img').waitFor()
    await loadImages()
    await capture('home')
    await capture('hero', false)
    await page.goto('/catalog')
    await page.locator('#sever-signal-01 img').waitFor()
    await loadImages()
    await capture('catalog')
    await page.goto('/products/sever-signal-01')
    await page.getByRole('group', { name: 'Размер EU' }).waitFor()
    await loadImages()
    await capture('product')
    if (name === 'tablet') {
      await page.close()
      continue
    }
    await page.getByRole('group', { name: /Цвет:/ }).getByRole('button').nth(1).click()
    await page
      .getByLabel('Галерея товара')
      .locator('img')
      .first()
      .evaluate((img) => img.decode())
    await capture('colorway')
    await page.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
    await page.goto('/wishlist')
    await page.locator('#sever-signal-01 img').waitFor()
    await capture('wishlist')
    await page.locator('#sever-signal-01').getByRole('link').click()
    await page.getByRole('group', { name: /Цвет:/ }).getByRole('button').nth(1).click()
    await page
      .getByRole('group', { name: 'Размер EU' })
      .locator('button:not(:disabled)')
      .first()
      .click()
    await page.getByRole('button', { name: 'Добавить точный размер' }).click()
    await page.goto('/cart')
    await page.getByLabel('Количество товара').waitFor()
    await capture('cart')
    await page.getByRole('button', { name: /Корзина 1 товаров/ }).click()
    await page.getByRole('dialog', { name: 'Корзина' }).waitFor()
    await capture('cart-sheet', false)
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
    await capture('checkout-contact')
    await page.getByRole('textbox', { name: 'Email' }).fill('guest@example.test')
    await page.getByRole('button', { name: 'К доставке' }).click()
    await page.getByRole('textbox', { name: 'Получатель' }).fill('Демо Покупатель')
    await page.getByRole('textbox', { name: 'Город' }).fill('Демо-город')
    await page
      .getByRole('textbox', { name: 'Адрес', exact: true })
      .fill('Тестовая улица, 1')
    await page.getByRole('button', { name: 'К демо-оплате' }).click()
    await page.getByRole('radio', { name: 'Успешная демо-оплата' }).check()
    await page.getByRole('button', { name: 'Проверить заказ' }).click()
    await capture('checkout-review')
    await page.goto('/auth/sign-in')
    await capture('sign-in')
    await page.close()
  }
  console.log(`Reviewed capture set saved to ${output}`)
} finally {
  await browser.close()
}
