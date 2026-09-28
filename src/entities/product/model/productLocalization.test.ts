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
      'A demo catalog model. Several models share a shoe design; the image shows the selected color. Fit values and use cases are illustrative, not verified product properties.',
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
})
