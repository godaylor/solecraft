import { describe, expect, it } from 'vitest'

import { adaptProductFixture, fixtureProducts } from './fixtureCatalogRepository'

describe('fixture catalog adapter', () => {
  it('maps deterministic fixtures to stable domain products', () => {
    expect(fixtureProducts).toHaveLength(4)
    expect(fixtureProducts[0]).toMatchObject({
      id: 'para-city-01',
      slug: 'sever-signal',
      price: { amountMinor: 1299000, currency: 'RUB' },
    })
  })

  it('rejects invalid money at the fixture boundary', () => {
    expect(() =>
      adaptProductFixture({
        id: 'broken',
        slug: 'broken',
        brand: 'TEST',
        model: 'Broken',
        title: 'Broken product',
        priceMinor: 1.5,
        imageNumber: 1,
        fit: { width: 'unknown', cushioning: 'unknown', support: 'unknown' },
        useCases: [],
      }),
    ).toThrow('Invalid price')
  })
})
