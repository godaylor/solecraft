import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

function guardRuntime(page: Page) {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`)
  })

  return errors
}

test('home to catalog, direct reload, history and unknown route', async ({ page }) => {
  const errors = guardRuntime(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Твой город')

  await page.getByRole('link', { name: 'Подобрать пару' }).click()
  await expect(page).toHaveURL(/\/catalog$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Городские пары' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Signal 01 — открыть карточку товара/ }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Городские пары' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Signal 01 — открыть карточку товара/ }),
  ).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Твой город')
  await page.goForward()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Городские пары' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Signal 01 — открыть карточку товара/ }),
  ).toBeVisible()

  await page.goto('/missing-route')
  await expect(page.getByRole('heading', { name: 'Такой страницы нет' })).toBeVisible()
  expect(errors).toEqual([])
})

test('home and shell have no detectable axe violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})

test('home recommendations use canonical product routes', async ({ page }) => {
  await page.goto('/')

  const recommendations = page.getByRole('link', { name: 'К подходящей паре' })
  await expect(recommendations.nth(0)).toHaveAttribute(
    'href',
    '/products/sever-signal-01',
  )
  await expect(recommendations.nth(1)).toHaveAttribute('href', '/products/forma-metro')
  await expect(recommendations.nth(2)).toHaveAttribute('href', '/products/krug-rain-2')
  await expect(
    page.getByRole('link', { name: /Signal 01 — открыть карточку товара/ }),
  ).toHaveAttribute('href', '/products/sever-signal-01')

  await recommendations.nth(2).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Rain 2' })).toBeVisible()
})

test('skip link and header navigation work with keyboard only', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'webkit',
    'Headless WebKit does not enable system Full Keyboard Access for links.',
  )
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: 'К основному содержанию' })
  await expect(skipLink).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Каталог', exact: true })
    .focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/catalog$/)
})

test('mobile navigation traps the route in a dialog and returns focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Открыть меню' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Куда идём?' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('#main-content')).toHaveAttribute('inert', '')
  await expect(page.getByRole('button', { name: 'Закрыть меню' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('header controls keep 44px targets on mobile and desktop', async ({ page }) => {
  async function expectMinimumTarget(locator: ReturnType<Page['getByRole']>) {
    const box = await locator.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expectMinimumTarget(page.getByRole('link', { name: 'Solecraft — на главную' }))
  await expectMinimumTarget(page.getByRole('button', { name: 'Открыть меню' }))

  await page.setViewportSize({ width: 1440, height: 900 })
  const primaryNavigation = page.getByRole('navigation', { name: 'Основная навигация' })
  for (const label of ['Главная', 'Каталог', 'Как выбрать']) {
    await expectMinimumTarget(primaryNavigation.getByRole('link', { name: label }))
  }
})

test('reduced motion and forced colors preserve the home meaning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Твоя посадка')
  await expect(page.getByLabel('Линия посадки').first()).toContainText('Ширина')

  const motionDuration = await page
    .locator('aside')
    .first()
    .evaluate((element) => getComputedStyle(element, '::before').animationDuration)
  const durationMs = motionDuration.endsWith('ms')
    ? Number.parseFloat(motionDuration)
    : Number.parseFloat(motionDuration) * 1000
  expect(durationMs).toBeLessThanOrEqual(0.01)
})

test('ProductCard keeps a named fallback when media fails', async ({ page }) => {
  await page.route('**/media/products/solecraft-01*', (route) => route.abort())
  await page.goto('/catalog')

  await expect(page.getByText('Изображение временно недоступно').first()).toBeVisible()
  await expect(page.getByRole('img', { name: /Signal 01/i })).toBeVisible()
})

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`shell has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/catalog')

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasOverflow).toBe(false)
  })
}

test('200% desktop zoom equivalent reflows without horizontal overflow', async ({
  page,
}) => {
  // A 720 CSS px viewport is the layout viewport produced by 200% zoom on 1440 px.
  await page.setViewportSize({ width: 720, height: 450 })
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Твоя посадка')
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasOverflow).toBe(false)
})

test('shell remains usable while self-hosted fonts load slowly', async ({ page }) => {
  await page.route(/\.woff2$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    await route.continue()
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Подобрать пару' })).toBeVisible()
})
