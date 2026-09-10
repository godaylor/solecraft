import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext } from '@playwright/test'

async function magicLink(request: APIRequestContext, email: string): Promise<string> {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const list = await request.get(
      `${process.env.MAILPIT_BASE_URL ?? 'http://127.0.0.1:32624'}/api/v1/messages`,
    )
    const body = (await list.json()) as { messages?: Array<Record<string, unknown>> }
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
        /https?:\/\/[^"'\\s<>()]+\/auth\/v1\/verify[^"'\\s<>()]+/,
      )?.[0]
      if (link) return link
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Magic link was not captured for ${email}`)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('guest wishlist persists and remains a real route/action', async ({ page }) => {
  await page.goto('/products/sever-signal-01')
  await page.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
  await expect(page.getByRole('link', { name: 'Избранное 1' })).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Убрать из избранного: Signal 01' }),
  ).toBeVisible()
  await page.goto('/wishlist')
  await expect(page.getByRole('heading', { level: 1, name: 'Избранное' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Signal 01 — открыть карточку товара/ }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('magic-link merges guest state once, sign-out clears private UI, and next user is isolated', async ({
  page,
  request,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Two-user mail flow runs once; cross-browser shell is covered separately.',
  )
  const firstEmail = `owner-${Date.now()}@example.test`
  const secondEmail = `other-${Date.now()}@example.test`

  await page.goto('/products/sever-signal-01')
  await page.getByRole('button', { name: 'Добавить в избранное: Signal 01' }).click()
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()

  await page.goto('/auth/sign-in?returnTo=%2Faccount')
  await page.getByRole('textbox', { name: 'Email' }).fill(firstEmail)
  await page.getByRole('button', { name: 'Отправить ссылку' }).click()
  await expect(page.getByRole('status')).toContainText('Ссылка отправлена')
  await page.goto(await magicLink(request, firstEmail))
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:32601\/auth\/callback(?:\?.*)?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Аккаунт' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    /Гостевые данные (объединены|объединяем)/,
  )
  await expect(page.getByRole('link', { name: 'Избранное · 1' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Корзина · 1' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Избранное · 1' })).toBeVisible()

  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('heading', { name: 'Войдите в аккаунт' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Избранное 0' })).toBeVisible()

  await page.goto('/auth/sign-in?returnTo=%2Faccount')
  await page.getByRole('textbox', { name: 'Email' }).fill(secondEmail)
  await page.getByRole('button', { name: 'Отправить ссылку' }).click()
  await new Promise((resolve) => setTimeout(resolve, 1100))
  await page.goto(await magicLink(request, secondEmail))
  await expect(page.getByRole('heading', { level: 1, name: 'Аккаунт' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Избранное · 0' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Корзина · 0' })).toBeVisible()
})

test('auth form is keyboard/autofill friendly and reflows on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/auth/sign-in?returnTo=https%3A%2F%2Fevil.example')
  const email = page.getByRole('textbox', { name: 'Email' })
  await expect(email).toHaveAttribute('autocomplete', 'email')
  await expect(email).toHaveAttribute('inputmode', 'email')
  await email.focus()
  await page.keyboard.type('mobile@example.test')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false)
})
