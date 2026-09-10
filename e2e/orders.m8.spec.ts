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

async function signIn(
  page: Page,
  request: APIRequestContext,
  email: string,
  returnTo: string,
) {
  await page.goto(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('button', { name: 'Отправить ссылку' }).click()
  await expect(page.getByRole('status')).toContainText('Ссылка отправлена')
  await page.goto(await magicLink(request, email))
  await expect(page).toHaveURL(new RegExp(`${returnTo.replaceAll('/', '\\/')}$`))
}

async function addAndCheckout(page: Page) {
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  await expect(page.getByRole('button', { name: 'Корзина 1 товаров' })).toBeVisible()
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Перейти к оформлению' }).click()
  await page.getByRole('textbox', { name: 'Email' }).fill('history@example.test')
  await page.getByRole('button', { name: 'К доставке' }).click()
  await page.getByRole('textbox', { name: 'Получатель' }).fill('Анна Пара')
  await page.getByRole('textbox', { name: 'Город' }).fill('Москва')
  await page
    .getByRole('textbox', { name: 'Адрес' })
    .fill('Очень длинная тестовая улица, дом 7, квартира 42')
  await page.getByRole('button', { name: 'К демо-оплате' }).click()
  await page.getByRole('radio', { name: 'Успешная демо-оплата' }).check()
  await page.getByRole('button', { name: 'Проверить заказ' }).click()
  await page.getByRole('button', { name: 'Создать демо-заказ' }).click()
  await expect(page).toHaveURL(/\/checkout\/success\/PARA-/)
}

async function freshSession(browser: Browser, url: string): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  return page
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('checkout → owner history → immutable detail denies other user and anon', async ({
  page,
  request,
  browser,
}) => {
  const errors = runtimeErrors(page)
  const ownerEmail = `history-owner-${Date.now()}@example.test`
  await signIn(page, request, ownerEmail, '/catalog')
  await addAndCheckout(page)

  const successUrl = page.url()
  const orderNumber = decodeURIComponent(
    new URL(successUrl).pathname.split('/').at(-1)!,
  )
  await page.route('**/rest/v1/orders*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.continue()
  })
  await page.getByRole('link', { name: 'Открыть историю заказов' }).click()
  await expect(page.getByRole('status', { name: 'Загружаем заказы' })).toBeVisible()

  await expect(page).toHaveURL(/\/account\/orders$/)
  await expect(
    page.getByText(orderNumber.replace(/^PARA-/, 'SOLECRAFT-')),
  ).toBeVisible()
  await page.unroute('**/rest/v1/orders*')
  await expect(page.getByText('Принят', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 360, height: 800 })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)

  await page.getByRole('link', { name: /Заказ от/ }).click()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(
    page.getByRole('heading', { level: 1, name: 'Детали заказа' }),
  ).toBeVisible()
  await expect(page.getByText(/^SKU SOLECRAFT-/)).toBeVisible()
  await expect(page.getByText(/Очень длинная тестовая улица/)).toBeVisible()
  const detailUrl = page.url()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Детали заказа' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Детали заказа' })).toBeVisible()

  await page.goto('/account')
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('heading', { name: 'Войдите в аккаунт' })).toBeVisible()

  const otherEmail = `history-other-${Date.now()}@example.test`
  const detailPath = new URL(detailUrl).pathname
  await signIn(page, request, otherEmail, detailPath)
  await expect(page.getByRole('heading', { name: 'Заказ недоступен' })).toBeVisible()
  await expect(page.getByText(/неизвестный и чужой номер/)).toBeVisible()

  const anon = await freshSession(browser, detailUrl)
  await expect(anon.getByRole('heading', { name: 'Заказ недоступен' })).toBeVisible()
  await expect(
    anon.getByText(/Номер заказа сам по себе не раскрывает детали/),
  ).toBeVisible()
  await anon.context().close()
  expect(errors).toEqual([])
})
