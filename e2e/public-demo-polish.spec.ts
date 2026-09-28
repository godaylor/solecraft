import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home recommendation uses the current catalog identity and price', async ({
  page,
}) => {
  await page.goto('/catalog')
  const card = page.locator('#sever-signal-01')
  await expect(card).toBeVisible()
  const catalogContent = await card.innerText()
  await page.goto('/')
  await expect(card).toBeVisible()
  await expect(card).toHaveText(catalogContent, { useInnerText: true })
  await card.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
  await page.goto('/wishlist')
  await expect(card).toBeVisible()
  await card.getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signal 01')
})

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`public guest journey on ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(
      Boolean(process.env.PLAYWRIGHT_BASE_URL) &&
        process.env.SOLECRAFT_ALLOW_DEMO_ORDER !== '1' &&
        process.env.SOLECRAFT_PRODUCTION_READ_ONLY !== '1',
      'Explicit opt-in is required to create a deployed demo order',
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.setViewportSize(viewport)
    await page.goto('/catalog?brand=sever&priceMax=1800000')
    const card = page.locator('#sever-signal-01')
    await expect(card.locator('img')).toBeVisible()
    await expect(card.locator('img')).toHaveJSProperty('complete', true)
    await card.screenshot({ path: testInfo.outputPath(`card-${viewport.name}.png`) })
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await card.getByRole('link').click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signal 01')
    const colors = page.getByRole('group', { name: /Цвет:/ }).getByRole('button')
    await colors.nth(1).click()
    const color = (await colors.nth(1).innerText()).trim()
    await expect(page).toHaveURL(/color=/)
    await page.reload()
    await expect(colors.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await page.goBack()
    await expect(colors.first()).toHaveAttribute('aria-pressed', 'true')
    await page.goForward()
    await expect(colors.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
    await page.goto('/wishlist')
    await expect(page.locator('#sever-signal-01')).toBeVisible()
    await page.reload()
    await page.locator('#sever-signal-01').getByRole('link').click()
    await colors.nth(1).click()
    const sizes = page.getByRole('group', { name: 'Размер EU' })
    let selectedStock = 0
    for (const size of await sizes.locator('button:not(:disabled)').all()) {
      await size.click()
      selectedStock = Number(
        (await page.locator('p').filter({ hasText: /^SKU / }).innerText()).match(
          /(\d+)\s*$/,
        )?.[1],
      )
      if (selectedStock >= 2) break
    }
    expect(
      selectedStock,
      'Quantity journey needs two units in the existing isolated catalog',
    ).toBeGreaterThanOrEqual(2)
    const sku = (
      await page.locator('p').filter({ hasText: /^SKU / }).innerText()
    ).split(' · ')[0]
    await page.getByRole('button', { name: 'Добавить точный размер' }).click()
    await page.goto('/cart')
    await expect(page.getByText(sku, { exact: true })).toBeVisible()
    await expect(page.getByText(new RegExp(color))).toBeVisible()
    await page.getByRole('button', { name: 'Увеличить количество' }).click()
    await expect(page.getByLabel('Количество товара')).toHaveText('2')
    await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
    await expect(page.getByText(/Демо-заказ без регистрации/)).toBeVisible()
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
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    let submissions = 0
    if (process.env.SOLECRAFT_PRODUCTION_READ_ONLY === '1') {
      await expect(
        page.getByRole('button', { name: 'Создать демо-заказ' }),
      ).toBeEnabled()
      await page.screenshot({
        path: testInfo.outputPath(`review-${viewport.name}.png`),
        fullPage: true,
      })
      return
    }
    page.on('request', (request) => {
      if (request.url().includes('/rpc/create_order')) submissions += 1
    })
    await page.getByRole('button', { name: 'Создать демо-заказ' }).dblclick()
    await expect(
      page.getByRole('heading', { name: 'Готово', exact: true }),
    ).toBeVisible()
    expect(submissions).toBe(1)
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Готово', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false)
    await page.screenshot({
      path: testInfo.outputPath(`receipt-${viewport.name}.png`),
      fullPage: true,
    })
    expect(errors).toEqual([])
  })
}
