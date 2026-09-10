import { expect, test } from '@playwright/test'

const deployedBaseUrl = process.env.PLAYWRIGHT_BASE_URL

test.describe('deployed release smoke', () => {
  test.skip(!deployedBaseUrl, 'PLAYWRIGHT_BASE_URL is required for deployed smoke')

  test('direct routes load the SPA shell without server errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    for (const route of [
      '/',
      '/catalog',
      '/products/sever-signal-01',
      '/wishlist',
      '/cart',
      '/checkout/contact',
      '/auth/sign-in',
      '/account/orders',
      '/account/orders/PARA-UNKNOWN',
      '/auth/callback?code=invalid',
      '/missing-release-route',
    ]) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), route).toBeLessThan(500)
      await expect(page.locator('main h1').first(), route).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('metadata and cache policy separate HTML from hashed assets', async ({
    page,
    request,
  }) => {
    const documentResponse = await page.goto('/', { waitUntil: 'domcontentloaded' })
    const documentCache = documentResponse?.headers()['cache-control'] ?? ''
    expect(documentCache).not.toContain('immutable')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /social-card\.png$/,
    )

    const scriptSource = await page
      .locator('script[type="module"][src]')
      .getAttribute('src')
    expect(scriptSource).toBeTruthy()
    const assetResponse = await request.get(
      new URL(scriptSource ?? '', deployedBaseUrl).href,
    )
    expect(assetResponse.status()).toBe(200)
    expect(assetResponse.headers()['cache-control'] ?? '').toMatch(
      /public.*max-age=31536000.*immutable/i,
    )
  })
})
