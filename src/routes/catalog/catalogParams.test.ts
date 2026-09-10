import { describe, expect, it } from 'vitest'

import {
  emptyCatalogState,
  normalizeCatalogState,
  parseCatalogParams,
  serializeCatalogParams,
  type CatalogUrlState,
} from './catalogParams'
import { catalogPageHref } from './readCatalogPage'

describe('catalog URL codec', () => {
  it('omits defaults and removes unknown or duplicate values canonically', () => {
    const parsed = parseCatalogParams(
      new URLSearchParams(
        'junk=1&page=0&brand=sever&brand=forma&brand=sever&brand=bad' +
          '&use=office&size=99&width=wide&color=black&color=bad' +
          '&priceMin=1800000&priceMax=1000000&inStock=false&sort=nope' +
          '&q=%20Metro%20%20office%20',
      ),
    )

    expect(serializeCatalogParams(parsed).toString()).toBe(
      'q=Metro+office&brand=forma&brand=sever&use=office&width=wide' +
        '&color=black&priceMin=1000000&priceMax=1800000',
    )
  })

  it('serializes an empty default state as the canonical catalog URL', () => {
    expect(serializeCatalogParams(emptyCatalogState).toString()).toBe('')
    expect(catalogPageHref(1)).toBe('/catalog')
  })

  it.each<CatalogUrlState>([
    {
      q: 'офис',
      brands: ['forma'],
      uses: [],
      colors: [],
      sort: 'newest',
      page: 1,
    },
    {
      brands: ['volna', 'sever'],
      uses: ['all-day', 'city-walk'],
      size: '42.5',
      width: 'wide',
      colors: ['white', 'black'],
      priceMin: 1_100_000,
      priceMax: 1_600_000,
      inStock: true,
      sort: 'price-desc',
      page: 3,
    },
  ])('round-trips normalized state %#', (state) => {
    const normalized = normalizeCatalogState(state)
    const roundTrip = parseCatalogParams(serializeCatalogParams(normalized))

    expect(roundTrip).toEqual(normalized)
  })

  it('preserves discovery state while changing pagination', () => {
    expect(
      catalogPageHref(2, {
        brands: ['sever'],
        uses: [],
        colors: [],
        sort: 'price-asc',
        page: 1,
      }),
    ).toBe('/catalog?brand=sever&sort=price-asc&page=2')
  })
})
