import { expect, test } from '@playwright/test'

test('key pages reflow in RU and EN from 320 to 7680 CSS pixels', async ({ page }) => {
  test.setTimeout(180000)
  await page.goto('/products/sever-signal-01')
  await page
    .getByRole('group', { name: 'Размер EU' })
    .locator('button:not(:disabled)')
    .first()
    .click()
  await page.getByRole('button', { name: 'Добавить точный размер' }).click()
  for (const language of ['ru', 'en']) {
    if (language === 'en')
      await page.getByRole('button', { name: 'Английский язык' }).click()
    for (const path of [
      '/',
      '/catalog',
      '/products/sever-signal-01',
      '/cart',
      '/checkout/contact',
    ]) {
      await page.goto(path)
      await expect(page.locator('#main-content')).toBeVisible()
      for (const width of [
        320, 360, 390, 430, 607, 608, 609, 768, 895, 896, 897, 1024, 1199, 1200, 1201,
        1280, 1440, 1920, 2560, 3840, 5120, 7680,
      ]) {
        await page.setViewportSize({ width, height: 900 })
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${path} ${language} ${width}`,
        ).toBe(true)
      }
    }
  }
})

test('price bounds retain their role, other filters, history and invalid input', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/catalog?brand=sever')
  const min = page.getByRole('combobox', { name: 'Цена от', exact: true })
  const max = page.getByRole('combobox', { name: 'Цена до', exact: true })
  await max.selectOption('1000000')
  await expect(min).toHaveValue('')
  await expect(page).toHaveURL(/brand=sever&priceMax=1000000$/)
  await expect(page.getByText('По этим условиям пар нет')).toBeVisible()
  await page.reload()
  await expect(max).toHaveValue('1000000')
  await max.selectOption('1800000')
  await min.selectOption('1100000')
  await expect(page.locator('main article').first()).toBeVisible()
  for (const price of await page
    .locator('main article p')
    .filter({ hasText: /Цена:/ })
    .allTextContents()) {
    const amount = Number(price.replace(/[^0-9]/g, ''))
    expect(amount).toBeGreaterThanOrEqual(11000)
    expect(amount).toBeLessThanOrEqual(18000)
  }
  await max.selectOption('1000000')
  await expect(page.getByText('Проверьте диапазон цены')).toBeVisible()
  await expect(min).toHaveValue('1100000')
  await expect(max).toHaveValue('1000000')
  await page.goBack()
  await expect(max).toHaveValue('1800000')
  await page.goForward()
  await expect(max).toHaveValue('1000000')
  await min.selectOption('1000000')
  await expect(page.getByText('По этим условиям пар нет')).toBeVisible()
  await max.selectOption('')
  await expect(min).toHaveValue('1000000')
  await min.scrollIntoViewIfNeeded()
  await min.focus()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: info.outputPath('price-panel.png') })
  const rail = page.getByRole('complementary', { name: 'Фильтры каталога' })
  expect(await rail.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  const geometry = await min.evaluate((el) => {
    const a = el.getBoundingClientRect()
    const b = el.closest('aside')!.getBoundingClientRect()
    return { a: a.left, b: b.left, right: a.right, end: b.right }
  })
  expect(geometry.a - geometry.b).toBeGreaterThanOrEqual(4)
  expect(geometry.end - geometry.right).toBeGreaterThanOrEqual(4)
  await page.getByRole('button', { name: 'Сбросить всё' }).click()
  await expect(page).toHaveURL('/catalog')
})

test('wishlist stays bounded for zero, one, two, three and many products across widths', async ({
  page,
}, info) => {
  test.setTimeout(180000)
  await page.goto('/wishlist')
  await expect(page.locator('main article')).toHaveCount(0)
  for (const count of [1, 2, 3, 6]) {
    await page.goto('/catalog')
    await expect(page.locator('main article').first()).toBeVisible()
    for (const button of (
      await page.getByRole('button', { name: /Добавить в избранное:/ }).all()
    ).slice(0, count - (count === 6 ? 3 : count - 1)))
      await button.click()
    await page.goto('/wishlist')
    await expect(page.locator('main article')).toHaveCount(count)
    await page.reload()
    await expect(page.locator('main article')).toHaveCount(count)
    for (const width of [
      320, 360, 390, 430, 607, 608, 609, 768, 895, 896, 897, 1024, 1199, 1200, 1201,
      1280, 1440, 1920, 2560, 3840, 5120, 7680,
    ]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${count} items at ${width}`,
      ).toBe(true)
      for (const card of await page.locator('main article').all())
        expect((await card.boundingBox())!.width).toBeLessThanOrEqual(417)
    }
    if (count === 1 || count === 3) {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.locator('main article').first().scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath(`wishlist-${count}.png`) })
    }
  }
})

test('mobile filters apply, disclose changes, preserve English and return focus', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/catalog')
  const trigger = page.getByRole('button', { name: 'Фильтры', exact: true })
  await trigger.click()
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Цена до', exact: true })
    .selectOption('1000000')
  await page.getByRole('button', { name: 'Показать результаты' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Убрать: До/ })).toBeVisible()
  await expect(page.getByText('По этим условиям пар нет')).toBeVisible()
  await page.getByRole('button', { name: /Фильтры/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Фильтры/ })).toBeFocused()
  await page.getByRole('button', { name: 'Английский язык' }).click()
  await expect(page.getByText('No sneakers match these conditions')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('City sneakers')
  await page.screenshot({ path: info.outputPath('mobile-filter.png') })
})
