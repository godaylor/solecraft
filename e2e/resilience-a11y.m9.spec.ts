import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const catalogRequestPattern = /\/rest\/v1\/catalog_products(?:\?|$)/
const cartRequestPattern = /\/rest\/v1\/cart_inventory_items(?:\?|$)/

function guardUnexpectedRuntime(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`response: ${response.status()} ${response.url()}`)
  })
  return errors
}

async function expectAxeClean(page: Page, include?: string) {
  const builder = new AxeBuilder({ page })
  const results = await (include ? builder.include(include) : builder).analyze()
  expect(results.violations).toEqual([])
}

async function typeWithKeyboard(page: Page, label: string, value: string) {
  const input = page.getByRole('textbox', { name: label })
  await input.focus()
  await page.keyboard.type(value)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('keyboard-only critical journey keeps dynamic regions named and axe-clean', async ({
  page,
}, testInfo) => {
  const errors = guardUnexpectedRuntime(page)
  const cardIndex =
    {
      chromium: 1,
      firefox: 2,
      webkit: 3,
    }[testInfo.project.name] ?? 4

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/catalog')
  await expect(page.getByText(/Найдено:/)).toBeVisible()
  await expectAxeClean(page)

  const search = page.getByLabel('Поиск по названию, бренду и сценарию')
  await search.focus()
  await page.keyboard.type('Signal')
  await expect(page).toHaveURL(/q=/)
  await expect(page.locator('article#sever-signal-01')).toBeVisible()
  await search.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await search.press('Backspace')
  await expect(page).toHaveURL('/catalog')

  const productLink = page
    .getByRole('link', { name: /открыть карточку товара/ })
    .nth(cardIndex)
  await productLink.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/products\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectAxeClean(page)

  const availableSize = page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
  await availableSize.focus()
  await page.keyboard.press('Enter')
  const add = page.getByRole('button', { name: 'Добавить точный размер' })
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('добавлен в корзину')

  const cartTrigger = page.getByRole('button', { name: /Корзина 1 товар/ })
  await cartTrigger.focus()
  await page.keyboard.press('Enter')
  const cartDialog = page.getByRole('dialog', { name: 'Корзина' })
  await expect(cartDialog).toBeVisible()
  await expectAxeClean(page, 'dialog')
  await page.keyboard.press('Escape')
  await expect(cartTrigger).toBeFocused()

  await cartTrigger.press('Enter')
  await cartDialog.getByRole('link', { name: 'Открыть корзину' }).press('Enter')
  const checkoutLink = page.getByRole('link', { name: 'Перейти к оформлению' })
  await checkoutLink.press('Enter')

  await typeWithKeyboard(page, 'Email', 'keyboard@example.test')
  await typeWithKeyboard(page, 'Телефон, необязательно', '+79990000000')
  await page.getByRole('button', { name: 'К доставке' }).press('Enter')
  await typeWithKeyboard(page, 'Получатель', 'Анна Пара')
  await typeWithKeyboard(page, 'Город', 'Москва')
  await typeWithKeyboard(page, 'Адрес', 'Тестовая улица, 7')
  await typeWithKeyboard(page, 'Индекс, необязательно', '101000')
  await page.getByRole('button', { name: 'К демо-оплате' }).press('Enter')
  await page.getByRole('radio', { name: 'Успешная демо-оплата' }).press('Space')
  await page.getByRole('button', { name: 'Проверить заказ' }).press('Enter')
  await expectAxeClean(page)
  await page.getByRole('button', { name: 'Создать демо-заказ' }).press('Enter')

  await expect(page).toHaveURL(/\/checkout\/success\/PARA-/)
  await expect(page.getByRole('heading', { level: 1, name: 'Готово' })).toBeVisible()
  await expectAxeClean(page)
  expect(errors).toEqual([])
})

test('mobile discovery and navigation sheets trap and restore keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/catalog')

  const filterTrigger = page.getByRole('button', { name: /^Фильтры/ })
  await filterTrigger.focus()
  await page.keyboard.press('Enter')
  const filterDialog = page.getByRole('dialog', { name: 'Фильтры каталога' })
  await expect(filterDialog).toBeVisible()
  await expectAxeClean(page, 'dialog')
  await page.keyboard.press('Escape')
  await expect(filterTrigger).toBeFocused()

  const menuTrigger = page.getByRole('button', { name: 'Открыть меню' })
  await menuTrigger.press('Enter')
  const menuDialog = page.getByRole('dialog', { name: 'Куда идём?' })
  await expect(menuDialog.getByRole('link', { name: /Избранное/ })).toBeVisible()
  await expect(menuDialog.getByRole('link', { name: 'Войти' })).toBeVisible()
  await expectAxeClean(page, 'dialog')
  await page.keyboard.press('Escape')
  await expect(menuTrigger).toBeFocused()
})

test('slow catalog response keeps a stable loading state before recovery', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'One deterministic throttled-response run is sufficient.',
  )
  await page.route(catalogRequestPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_200))
    await route.continue()
  })

  await page.goto('/catalog')
  await expect(page.getByLabel('Загрузка товаров')).toBeVisible()
  await expect(page.getByRole('article').first()).toBeVisible()
})

test('500, network-unavailable response, and broken media recover without losing user state', async ({
  page,
}) => {
  test.setTimeout(90_000)
  test.skip(
    test.info().project.name !== 'chromium',
    'One deterministic resilience run is sufficient; engines use the critical flow.',
  )
  let failedCatalogRequests = 0
  await page.route(catalogRequestPattern, async (route) => {
    failedCatalogRequests += 1
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'planned_m9_failure' }),
    })
  })
  await page.goto('/catalog')
  await expect
    .poll(() => failedCatalogRequests, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(2)
  await expect(page.getByText('Не удалось загрузить каталог')).toBeVisible({
    timeout: 30_000,
  })
  expect(failedCatalogRequests).toBeGreaterThanOrEqual(1)
  await page.unroute(catalogRequestPattern)
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(page.getByRole('article').first()).toBeVisible()

  await page.route(catalogRequestPattern, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'planned_network_unavailable' }),
    }),
  )
  await page.getByLabel('Поиск по названию, бренду и сценарию').fill('offline')
  await expect(page.getByText('Не удалось обновить данные')).toBeVisible({
    timeout: 30_000,
  })
  await page.unroute(catalogRequestPattern)
  await page.getByRole('button', { name: 'Обновить' }).click()
  await expect(
    page.getByRole('heading', { name: 'По этим условиям пар нет' }),
  ).toBeVisible()

  await page.route('**/img/sneakers/*', (route) => route.abort('failed'))
  await page.goto('/products/sever-signal-01')
  await expect(page.getByText('Изображение временно недоступно').first()).toBeVisible()
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()

  await page.route(cartRequestPattern, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'planned_cart_failure' }),
    }),
  )
  await page.goto('/cart')
  await expect(page.getByText('Не удалось сверить корзину')).toBeVisible({
    timeout: 30_000,
  })
  await page.unroute(cartRequestPattern)
  await page.getByRole('button', { name: 'Повторить сверку' }).click()
  await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
})

test('checkout validation exposes summary links and inline field relationships', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'Semantic assertion is engine-neutral.',
  )
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await page.goto('/checkout/contact')
  await page.getByRole('button', { name: 'К доставке' }).click()

  const email = page.getByRole('textbox', { name: 'Email' })
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('aria-describedby', 'checkout-email-error')
  await expect(page.getByRole('alert').getByRole('link')).toHaveAttribute(
    'href',
    '#checkout-email',
  )
  await expectAxeClean(page)
})

test('forced colors and reduced motion preserve discovery controls and meaning', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'Playwright forced-colors emulation is verified in Chromium.',
  )
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/catalog')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Городские пары' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /^Фильтры/ }).click()
  await expect(page.getByRole('dialog', { name: 'Фильтры каталога' })).toBeVisible()
  await expectAxeClean(page, 'dialog')
  const durations = await page.locator('body').evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .slice(0, 100)
      .flatMap((element) =>
        getComputedStyle(element)
          .transitionDuration.split(',')
          .map((duration) => duration.trim()),
      ),
  )
  expect(
    durations.every((duration) => {
      const milliseconds = duration.endsWith('ms')
        ? Number.parseFloat(duration)
        : Number.parseFloat(duration) * 1000
      return milliseconds <= 0.01
    }),
  ).toBe(true)
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`critical surfaces have no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== 'chromium',
      'Viewport matrix is engine-neutral.',
    )
    await page.setViewportSize(viewport)
    for (const path of ['/catalog', '/products/sever-signal-01', '/cart']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const overflow = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth
        return Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              element: `${element.tagName.toLowerCase()}.${element.className}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
            }
          })
          .filter(({ left, right }) => left < -1 || right > viewportWidth + 1)
          .slice(0, 10)
      })
      expect(overflow, `${path} at ${viewport.width}px`).toEqual([])
    }
  })
}

test('200% and 400% layout equivalents retain content and controls', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium', 'Zoom reflow is engine-neutral.')
  for (const viewport of [
    { width: 720, height: 450 },
    { width: 360, height: 225 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/products/sever-signal-01')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Signal 01' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Добавить точный размер' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false)
  }
})

test('stable home and catalog states match reviewed visual baselines', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'chromium' ||
      process.env.SKIP_VISUAL_REGRESSION === '1',
    'Reviewed visual baselines are intentionally maintained in local Windows Chromium.',
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('m9-home-mobile.png', {
    fullPage: true,
    animations: 'disabled',
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/catalog')
  await expect(page.getByRole('article').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page).toHaveScreenshot('m9-catalog-desktop.png', {
    fullPage: true,
    animations: 'disabled',
  })
})
