import { describe, expect, it } from 'vitest'

import type { CatalogPageParams, CatalogSort } from './CatalogRepository'
import { createCatalogRequestPlan } from './supabaseCatalogRepository'

function params(overrides: Partial<CatalogPageParams> = {}): CatalogPageParams {
  return {
    brands: [],
    uses: [],
    colors: [],
    sort: 'recommended',
    page: 1,
    pageSize: 12,
    ...overrides,
  }
}

describe('Supabase catalog query plan', () => {
  it('maps every discovery facet to an AND filter plan', () => {
    expect(
      createCatalogRequestPlan(
        params({
          q: 'офис Metro',
          brands: ['forma', 'sever'],
          uses: ['office'],
          size: '42',
          width: 'wide',
          colors: ['black'],
          priceMin: 1_000_000,
          priceMax: 1_600_000,
          inStock: true,
          page: 2,
        }),
      ),
    ).toEqual({
      filters: [
        { kind: 'search', value: 'офис Metro' },
        { kind: 'brands', values: ['forma', 'sever'] },
        { kind: 'uses', values: ['office'] },
        { kind: 'size', value: '42' },
        { kind: 'width', value: 'wide' },
        { kind: 'colors', values: ['black'] },
        { kind: 'price-min', value: 1_000_000 },
        { kind: 'price-max', value: 1_600_000 },
        { kind: 'in-stock', value: true },
      ],
      orders: [
        { column: 'merch_rank', ascending: true },
        { column: 'id', ascending: true },
      ],
      range: [12, 23],
    })
  })

  it.each<[CatalogSort, string, boolean]>([
    ['recommended', 'merch_rank', true],
    ['newest', 'published_at', false],
    ['price-asc', 'price_minor', true],
    ['price-desc', 'price_minor', false],
  ])('maps %s to a stable primary + id sort', (sort, column, ascending) => {
    const plan = createCatalogRequestPlan(params({ sort }))

    expect(plan.orders).toEqual([
      { column, ascending },
      { column: 'id', ascending: true },
    ])
  })
})
