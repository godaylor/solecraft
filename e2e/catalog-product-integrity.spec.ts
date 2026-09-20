import { expect, test, type Locator, type Page } from '@playwright/test'

const catalogPages = [1, 2, 3]

function shoeAssetFamily(src: string | null) {
  if (!src) return undefined
  return new URL(src, 'http://solecraft.test').pathname.match(
    /\/solecraft-(\d{2})(?:-[a-z-]+)?\.webp$/,
  )?.[1]
}

function overlaps(
  first: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>,
  second: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>,
) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  )
}

async function collectProductLinks(page: Page) {
  const links = new Set<string>()

  for (const catalogPage of catalogPages) {
    await page.goto(`/catalog${catalogPage === 1 ? '' : `?page=${catalogPage}`}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const productLinks = page.locator('main article[id] h3 a')
    await expect(productLinks.first()).toBeVisible()
    for (const href of await productLinks.evaluateAll((items) =>
      items.map((item) => item.getAttribute('href')),
    )) {
      if (href) links.add(href)
    }
  }

  return [...links]
}

test('all catalog products keep their model, copy and media family across colorways', async ({
  page,
}) => {
  test.setTimeout(180_000)
  const links = await collectProductLinks(page)
  expect(links).toHaveLength(32)

  for (const href of links) {
    await page.goto(href)
    const heading = page.getByRole('heading', { level: 1 })
    const description = page
      .locator('main article section')
      .filter({ has: heading })
      .locator('p')
      .nth(1)
    const gallery = page.getByLabel('Галерея товара')
    const primaryImage = gallery.locator('img').first()
    await expect(primaryImage).toBeVisible()
    await expect(primaryImage).toHaveJSProperty('complete', true)

    const initialHeading = await heading.textContent()
    const initialDescription = await description.textContent()
    const initialFamily = shoeAssetFamily(await primaryImage.getAttribute('src'))
    expect(initialFamily, `missing reviewed media family for ${href}`).toBeTruthy()

    const colorGroup = page.getByRole('group', { name: /Цвет:/ })
    const colorButtons = colorGroup.getByRole('button')
    expect(await colorButtons.count()).toBeGreaterThanOrEqual(2)

    for (let index = 0; index < (await colorButtons.count()); index += 1) {
      const button = colorButtons.nth(index)
      const colorName = (await button.innerText()).trim()
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(primaryImage).toBeVisible()
      await expect(primaryImage).toHaveAttribute(
        'alt',
        new RegExp(`цвет «${colorName}»`, 'i'),
      )
      expect(shoeAssetFamily(await primaryImage.getAttribute('src'))).toBe(
        initialFamily,
      )
      await expect(heading).toHaveText(initialHeading ?? '')
      await expect(description).toHaveText(initialDescription ?? '')
    }
  }
})

for (const viewport of [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`wishlist control stays fixed and clear of use-case badges on ${viewport.name}`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize(viewport)

    for (const catalogPage of catalogPages) {
      await page.goto(`/catalog${catalogPage === 1 ? '' : `?page=${catalogPage}`}`)
      const cards = page.locator('main article[id]')
      await expect(cards.first()).toBeVisible()

      for (let index = 0; index < (await cards.count()); index += 1) {
        const card = cards.nth(index)
        const button = card.getByRole('button', { name: /избранн/i })
        const tags = card.getByLabel('Сценарии использования')
        const buttonBox = await button.boundingBox()
        const tagsBox = await tags.boundingBox()
        expect(buttonBox).not.toBeNull()
        expect(tagsBox).not.toBeNull()
        expect(
          overlaps(buttonBox!, tagsBox!),
          `${await card.getAttribute('id')}: overlap`,
        ).toBe(false)
      }
    }

    await page.goto('/catalog')
    const firstCard = page.locator('main article[id]').first()
    const firstButton = firstCard.getByRole('button', { name: /избранн/i })
    const cardBefore = await firstCard.boundingBox()
    const before = await firstButton.boundingBox()
    await firstButton.click()
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true')
    const cardAfter = await firstCard.boundingBox()
    const after = await firstButton.boundingBox()
    expect(cardBefore).not.toBeNull()
    expect(before).not.toBeNull()
    expect(cardAfter).not.toBeNull()
    expect(after).not.toBeNull()
    expect(
      Math.abs(after!.x - cardAfter!.x - (before!.x - cardBefore!.x)),
    ).toBeLessThan(0.5)
    expect(
      Math.abs(after!.y - cardAfter!.y - (before!.y - cardBefore!.y)),
    ).toBeLessThan(0.5)
    expect(after!.width).toBe(before!.width)
    expect(after!.height).toBe(before!.height)
  })
}
