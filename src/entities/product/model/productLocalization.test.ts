import { describe, expect, it } from 'vitest'

import { fixtureProducts } from '../api/fixtureCatalogRepository'
import { localizeProduct, localizeProductDetails } from './productLocalization'
import type { ProductDetails } from './product'

describe('localizeProduct', () => {
  it('translates editorial catalog content without translating brand or model', () => {
    const original = fixtureProducts[0]!
    const product = localizeProduct(original, 'en')

    expect(product.brand.name).toBe(original.brand.name)
    expect(product.model).toBe(original.model)
    expect(product.title).toBe(`${original.brand.name} ${original.model} sneakers`)
    expect(product.category.name).toBe('City')
    expect(product.description).toBe(
      'Mesh textures, contrasting panels and a sculpted sole. An expressive silhouette for everyday outfits.',
    )
    expect(product.useCases.map(({ label }) => label)).toEqual(['city walk', 'all day'])
    expect(product.defaultVariant.color.name).toBe('Main')
  })

  it('rebrands Russian editorial provenance without changing product identity', () => {
    const original = fixtureProducts[0]!
    const product = localizeProduct(original, 'ru')

    expect(product.id).toBe(original.id)
    expect(product.slug).toBe(original.slug)
    expect(product.brand.name).toBe(original.brand.name)
    expect(product.model).toBe(original.model)
    expect(product.fit.sourceNote).toBe(
      'Условные показатели для знакомства с подбором; свойства обуви не подтверждены',
    )
  })

  it('keeps silhouette copy consistent across card and all PDP colorways', () => {
    const original = fixtureProducts[0]!
    const details: ProductDetails = {
      id: original.id,
      slug: original.slug,
      brand: original.brand,
      category: original.category,
      model: original.model,
      title: original.title,
      description: original.description,
      fit: original.fit,
      useCases: original.useCases,
      variants: ['white', 'black'].map((color, index) => ({
        id: color,
        slug: color,
        color: {
          slug: color,
          name: color === 'white' ? 'Белый' : 'Чёрный',
          code: '#000000',
        },
        price: original.price,
        isDefault: index === 0,
        media: [
          {
            ...original.image,
            id: color,
            kind: 'catalog',
            position: 0,
            src: `/media/products/solecraft-01${index ? '-black' : ''}.webp`,
          },
        ],
        inventory: [],
      })),
      sizeGuide: [],
    }
    for (const locale of ['ru', 'en'] as const) {
      const localized = localizeProductDetails(details, locale)
      expect(localized.description).toBe(localizeProduct(original, locale).description)
      expect(localized.variants.map(({ id }) => id)).toEqual(['white', 'black'])
    }
    expect(localizeProductDetails(details, 'en').variants[1]?.media[0]?.alt).toContain(
      'Black',
    )
  })
})
