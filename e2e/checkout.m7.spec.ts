import AxeBuilder from '@axe-core/playwright'
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
} from '@playwright/test'

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function addExactSku(page: Page) {
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'добавлен в корзину' }),
  ).toBeVisible()
}

async function reachPayment(page: Page) {
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
  await page.getByRole('textbox', { name: 'Email' }).fill('guest@example.test')
  await page
    .getByRole('textbox', { name: 'Телефон, необязательно' })
    .fill('+79990000000')
  await page.getByRole('button', { name: 'К доставке' }).click()
  await page.getByRole('textbox', { name: 'Получатель' }).fill('Анна Пара')
  await page.getByRole('textbox', { name: 'Город' }).fill('Москва')
  await page.getByRole('textbox', { name: 'Адрес' }).fill('Тестовая улица, 7')
  await page.getByRole('textbox', { name: 'Индекс, необязательно' }).fill('101000')
  await page.getByRole('button', { name: 'К демо-оплате' }).click()
}

async function chooseScenario(
  page: Page,
  name:
    | 'Успешная демо-оплата'
    | 'Отклонение для проверки ошибки'
    | 'Таймаут для проверки повтора',
) {
  await page.getByRole('radio', { name }).check()
  await page.getByRole('button', { name: 'Проверить заказ' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('guest checkout is atomic, refresh-safe, and denied in a fresh session', async ({
  page,
  browser,
}) => {
  const errors = runtimeErrors(page)
  let createRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/rpc/create_order')) createRequests += 1
  })

  await addExactSku(page)
  await reachPayment(page)
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveCount(0)
  await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0)
  await chooseScenario(page, 'Успешная демо-оплата')

  const submit = page.getByRole('button', { name: 'Создать демо-заказ' })
  await submit.dblclick()
  await expect(page).toHaveURL(/\/checkout\/success\/PARA-/)
  await expect(page.getByRole('heading', { level: 1, name: 'Готово' })).toBeVisible()
  expect(createRequests).toBe(1)

  const successUrl = page.url()
  const storage = await page.evaluate(() => ({
    local: Object.values(localStorage),
    session: Object.entries(sessionStorage),
  }))
  const receiptEntry = storage.session.find(([key]) =>
    key.startsWith('solecraft:guest-receipt:'),
  )
  expect(receiptEntry?.[1]).toMatch(/^[0-9a-f]{64}$/)
  expect(successUrl).not.toContain(receiptEntry?.[1] ?? 'unreachable-token')
  expect(JSON.stringify(storage.local)).not.toContain(receiptEntry?.[1] ?? '')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Готово' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  await expect(page.getByRole('button', { name: 'Корзина 0 товаров' })).toBeVisible()
  const fresh = await freshSession(browser, successUrl)
  await expect(
    fresh.getByRole('heading', { level: 1, name: 'Подтверждение недоступно' }),
  ).toBeVisible()
  await fresh.context().close()
  expect(errors).toEqual([])
})

async function freshSession(browser: Browser, url: string): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  return page
}

async function magicLink(request: APIRequestContext, email: string): Promise<string> {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const list = await request.get(
      `${process.env.MAILPIT_BASE_URL ?? 'http://127.0.0.1:32624'}/api/v1/messages`,
    )
    const body = (await list.json()) as {
      messages?: Array<Record<string, unknown>>
    }
    const message = body.messages?.find((item) => JSON.stringify(item).includes(email))
    const id = message?.ID ?? message?.Id ?? message?.id
    if (typeof id === 'string') {
      const detail = await request.get(
        `${process.env.MAILPIT_BASE_URL ?? 'http://127.0.0.1:32624'}/api/v1/message/${id}`,
      )
      const messageBody = (await detail.json()) as { Text?: string; HTML?: string }
      const source = (messageBody.Text ?? messageBody.HTML ?? '').replaceAll(
        '&amp;',
        '&',
      )
      const link = source.match(
        /https?:\/\/[^"'\s<>()]+\/auth\/v1\/verify[^"'\s<>()]+/,
      )?.[0]
      if (link) return link
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Magic link was not captured for ${email}`)
}

test('signed-in checkout writes owner cart and reads success through owner RLS', async ({
  page,
  request,
}) => {
  const email = `checkout-owner-${Date.now()}@example.test`
  await page.goto('/auth/sign-in?returnTo=%2Fcatalog')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('button', { name: 'Отправить ссылку' }).click()
  await expect(page.getByRole('status')).toContainText('Ссылка отправлена')
  await page.goto(await magicLink(request, email))
  await expect(page).toHaveURL(/\/catalog$/)

  await addExactSku(page)
  await expect(page.getByRole('button', { name: 'Корзина 1 товаров' })).toBeVisible()
  await reachPayment(page)
  await chooseScenario(page, 'Успешная демо-оплата')
  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()

  await expect(page).toHaveURL(/\/checkout\/success\/PARA-/)
  await expect(page.getByRole('heading', { level: 1, name: 'Готово' })).toBeVisible()
  await expect(
    page.getByText('Заказ сохранён в owner-only истории аккаунта.'),
  ).toBeVisible()
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).some((key) =>
        key.startsWith('solecraft:guest-receipt:'),
      ),
    ),
  ).toBe(false)
})

test('decline, timeout, and stock conflict preserve the cart and allow retry', async ({
  page,
}) => {
  await addExactSku(page)
  await reachPayment(page)

  await chooseScenario(page, 'Отклонение для проверки ошибки')
  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()
  await expect(page.getByRole('alert')).toContainText('отклонён')
  await expect(page.getByRole('button', { name: 'Корзина 1 товаров' })).toBeVisible()

  await page.getByRole('link', { name: 'Изменить' }).first().click()
  await page.getByRole('button', { name: 'К доставке' }).click()
  await page.getByRole('button', { name: 'К демо-оплате' }).click()
  await chooseScenario(page, 'Таймаут для проверки повтора')
  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()
  await expect(page.getByRole('alert')).toContainText('не ответил')

  await page.getByRole('link', { name: 'Изменить' }).first().click()
  await page.getByRole('button', { name: 'К доставке' }).click()
  await page.getByRole('button', { name: 'К демо-оплате' }).click()
  await chooseScenario(page, 'Успешная демо-оплата')
  await page.route('**/rest/v1/rpc/create_order', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'P0001', message: 'stock_conflict:test-inventory' }),
    })
  })
  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()
  await expect(page.getByRole('alert')).toContainText('Остаток изменился')
  await expect(page.getByRole('button', { name: 'Корзина 1 товаров' })).toBeVisible()
  await page.unroute('**/rest/v1/rpc/create_order')

  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()
  await expect(page).toHaveURL(/\/checkout\/success\/PARA-/)
})

test('step guards, validation focus, and mobile form semantics fail safely', async ({
  page,
}) => {
  await page.goto('/checkout/review')
  await expect(page).toHaveURL(/\/cart$/)

  await addExactSku(page)
  await page.goto('/checkout/not-a-step')
  await expect(page).toHaveURL(/\/checkout\/contact$/)
  await page.setViewportSize({ width: 360, height: 800 })
  await page.getByRole('button', { name: 'К доставке' }).click()
  const summary = page.getByRole('alert')
  await expect(summary).toContainText('Введите корректный email')
  await expect(summary).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
    'autocomplete',
    'email',
  )
  await expect(
    page.getByRole('textbox', { name: 'Телефон, необязательно' }),
  ).toHaveAttribute('inputmode', 'tel')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)

  await page.goto('/checkout/success/PR-UNKNOWN')
  await expect(
    page.getByRole('heading', { name: 'Подтверждение недоступно' }),
  ).toBeVisible()
})
