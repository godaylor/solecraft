import { expect, test } from '@playwright/test'

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(
    'release RU/EN and branded SKU journey at ' + viewport.width,
    async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await page.setViewportSize(viewport)
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Твой город')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: '.codex-temp/release-home-' + viewport.width + '.jpg',
        type: 'jpeg',
        quality: 75,
        fullPage: true,
      })
      await page.getByRole('button', { name: 'Английский язык' }).click()
      await page.goto('/catalog')
      await expect(page.getByRole('article')).toHaveCount(12)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: '.codex-temp/release-catalog-en-' + viewport.width + '.jpg',
        type: 'jpeg',
        quality: 75,
        fullPage: true,
      })
      await page.goto('/products/sever-signal-01')
      await page
        .getByRole('group', { name: 'EU size' })
        .locator('button:not(:disabled)')
        .first()
        .click()
      await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
      await page.getByRole('button', { name: 'Add selected size' }).click()
      await page.goto('/cart')
      await expect(page.getByRole('heading', { level: 1, name: 'Cart' })).toBeVisible()
      await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
      expect(await page.locator('body').innerText()).not.toMatch(/PARA-|react-sneakers/)
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false)
      await page.screenshot({
        path: '.codex-temp/release-cart-en-' + viewport.width + '.jpg',
        type: 'jpeg',
        quality: 75,
        fullPage: true,
      })
      expect(errors).toEqual([])
    },
  )
}
