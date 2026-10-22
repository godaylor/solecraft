import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function accessibility(page: Page) {
  // WebKit may expose fallback text colors while local variable fonts load.
  await page.evaluate(() => document.fonts.ready)
  return new AxeBuilder({ page }).analyze()
}

test('appearance follows the device until an explicit choice, and survives reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const appearance = page.getByRole('combobox', { name: 'Тема оформления' })
  await expect(appearance).toHaveValue('system')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await appearance.selectOption('light')
  await page.reload()
  await expect(appearance).toHaveValue('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await appearance.selectOption('system')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByLabel('Английский язык').click()
  await expect(page.getByRole('combobox', { name: 'Appearance' })).toHaveValue('system')
})

test('saved night appearance is applied before the app bundle loads', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(() => localStorage.setItem('solecraft:theme:v1', 'dark'))
  await page.route(/\/assets\/.*\.js(?:\?.*)?$/, (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('#solecraft-boot')).toBeVisible()
  await expect(page.locator('#app-root')).toBeEmpty()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('#solecraft-boot')).toHaveCSS(
    'background-color',
    'rgb(17, 26, 40)',
  )
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#111a28',
  )
})

test('mobile theme choices stay in the menu focus trap and return focus on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Открыть меню' })
  await trigger.click()
  const menu = page.getByRole('dialog', { name: 'Куда идём?' })
  await menu.getByRole('button', { name: 'Тёмная', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    menu.getByRole('button', { name: 'Тёмная', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await menu.getByRole('button', { name: 'Системная', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(menu.getByRole('button', { name: 'Закрыть меню' })).toBeFocused()
  expect((await accessibility(page)).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('night appearance keeps unavailable media and empty states readable', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.route('**/media/products/*', (route) => route.abort())
  await page.goto('/products/sever-signal-01')
  await expect(page.getByText('Изображение временно недоступно').first()).toBeVisible()
  expect((await accessibility(page)).violations).toEqual([])
  await page.goto('/wishlist')
  await expect(page.locator('#main-content h1')).toBeVisible()
  expect((await accessibility(page)).violations).toEqual([])
})

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`night shopping surfaces remain readable at ${viewport.width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize(viewport)
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    for (const path of ['/', '/catalog', '/products/sever-signal-01']) {
      await page.goto(path)
      await expect(page.locator('#main-content h1')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      if (path === '/catalog')
        await expect(page.locator('#sever-signal-01')).toBeVisible()
      if (path.includes('/products/'))
        await expect(page.getByRole('group', { name: 'Размер EU' })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('#main-content h1')).toHaveCSS(
        'color',
        'rgb(233, 238, 247)',
      )
      expect((await accessibility(page)).violations, path).toEqual([])
    }
    const colors = page.getByRole('group', { name: /Цвет:/ }).getByRole('button')
    await colors.nth(1).click()
    await expect(colors.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
    const available = page
      .getByRole('group', { name: 'Размер EU' })
      .locator('button:not(:disabled)')
    if ((await available.count()) === 0) await colors.first().click()
    await available.first().click()
    await page.getByRole('button', { name: 'Добавить точный размер' }).click()
    const cartTrigger = page.getByRole('button', { name: /Корзина 1 товаров/ })
    await cartTrigger.click()
    const drawer = page.getByRole('dialog', { name: 'Корзина', exact: true })
    await expect(drawer.getByRole('link', { name: 'Signal 01' })).toBeVisible()
    expect((await accessibility(page)).violations).toEqual([])
    await page.keyboard.press('Escape')
    await expect(cartTrigger).toBeFocused()
    await page.goto('/wishlist')
    await expect(page.locator('#sever-signal-01')).toBeVisible()
    await page.goto('/cart')
    await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
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
    await expect(page.getByRole('button', { name: 'Создать демо-заказ' })).toBeEnabled()
    expect((await accessibility(page)).violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    )
    expect(errors).toEqual([])
  })
}

test('both appearances reflow across narrow, landscape, tablet and wide screens', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const path of [
      '/',
      '/catalog',
      '/products/sever-signal-01',
      '/auth/sign-in',
    ]) {
      await page.goto(path)
      await expect(page.locator('#main-content h1')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      for (const [width, height] of [
        [320, 800],
        [360, 800],
        [768, 1024],
        [844, 390],
        [1024, 768],
        [1440, 900],
        [2560, 1440],
      ]) {
        await page.setViewportSize({ width, height })
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
            message: `${colorScheme} ${path} ${width}`,
          })
          .toBe(width)
        const controls = await page
          .locator('header a:visible, header button:visible, header select:visible')
          .evaluateAll((elements) =>
            elements.map((element) => {
              const rect = element.getBoundingClientRect()
              return { left: rect.left, right: rect.right }
            }),
          )
        for (const rect of controls) {
          expect(rect.left).toBeGreaterThanOrEqual(0)
          expect(rect.right).toBeLessThanOrEqual(width + 1)
        }
      }
    }
  }
})
