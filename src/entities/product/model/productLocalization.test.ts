import { describe, expect, it } from 'vitest'

import { fixtureProducts } from '../api/fixtureCatalogRepository'
import { localizeProduct } from './productLocalization'

describe('localizeProduct', () => {
  it('translates editorial catalog content without translating brand or model', () => {
    const original = fixtureProducts[0]!
    const product = localizeProduct(original, 'en')

    expect(product.brand.name).toBe(original.brand.name)
    expect(product.model).toBe(original.model)
    expect(product.title).toBe(`${original.brand.name} ${original.model} sneakers`)
    expect(product.category.name).toBe('City')
    expect(product.description).toBe(
      'A calm city sneaker for long routes and an everyday pace.',
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
    expect(product.fit.sourceNote).toBe('Детерминированный демо-каталог Solecraft')
  })
})
