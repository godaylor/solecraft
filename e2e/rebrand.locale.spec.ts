import { expect, test } from '@playwright/test'

test('Solecraft switches RU to EN and persists the localized experience', async ({
  page,
}) => {
  const runtimeErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page).toHaveTitle('Solecraft — городские кроссовки')
  await expect(page.getByRole('link', { name: 'Solecraft — на главную' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Твой город')

  await page.getByRole('button', { name: 'Английский язык' }).click()

  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle('Solecraft — city sneakers')
  await expect(page.getByRole('link', { name: 'Solecraft — home' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your city')
  await expect(
    page.getByRole('heading', {
      level: 3,
      name: /^СЕВЕР Signal 01 sneakers/,
    }),
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('solecraft:locale:v1')))
    .toBe('en')

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your city')
  expect(runtimeErrors).toEqual([])
})
