import type { CatalogRepository } from './CatalogRepository'
import type { Cushioning, FitWidth, Product, Support } from '../model/product'
import { resolveProductImageAsset } from '../model/productMedia'

type ProductFixture = {
  id: string
  slug: string
  brand: string
  model: string
  title: string
  priceMinor: number
  imageNumber: number
  fit: {
    width: FitWidth
    cushioning: Cushioning
    support: Support
  }
  useCases: readonly {
    slug: string
    label: string
  }[]
}

const productFixtures = [
  {
    id: 'para-city-01',
    slug: 'sever-signal-01',
    brand: 'СЕВЕР',
    model: 'Signal 01',
    title: 'Городские кроссовки Signal 01',
    priceMinor: 1299000,
    imageNumber: 1,
    fit: { width: 'standard', cushioning: 'soft', support: 'balanced' },
    useCases: [
      { slug: 'city-walk', label: '12 000 шагов' },
      { slug: 'all-day', label: 'весь день' },
    ],
  },
  {
    id: 'para-city-02',
    slug: 'forma-metro',
    brand: 'ФОРМА',
    model: 'Metro',
    title: 'Кроссовки Metro для лёгкого офиса',
    priceMinor: 1149000,
    imageNumber: 2,
    fit: { width: 'narrow', cushioning: 'balanced', support: 'balanced' },
    useCases: [
      { slug: 'office', label: 'офис' },
      { slug: 'city-walk', label: 'город' },
    ],
  },
  {
    id: 'para-city-03',
    slug: 'volna-route',
    brand: 'ВОЛНА',
    model: 'Route',
    title: 'Мягкие кроссовки Route',
    priceMinor: 1399000,
    imageNumber: 3,
    fit: { width: 'wide', cushioning: 'soft', support: 'flexible' },
    useCases: [{ slug: 'all-day', label: 'долгая прогулка' }],
  },
  {
    id: 'para-city-04',
    slug: 'krug-rain-2',
    brand: 'КРУГ',
    model: 'Rain 2',
    title: 'Кроссовки Rain 2 для мокрого города',
    priceMinor: 1549000,
    imageNumber: 4,
    fit: { width: 'standard', cushioning: 'balanced', support: 'structured' },
    useCases: [
      { slug: 'wet-weather', label: 'дождь' },
      { slug: 'city-walk', label: 'город' },
    ],
  },
] as const satisfies readonly ProductFixture[]

function assertFixture(fixture: ProductFixture): void {
  if (!fixture.id || !fixture.slug || !fixture.title) {
    throw new Error('Product fixture requires stable id, slug and title')
  }

  if (!Number.isSafeInteger(fixture.priceMinor) || fixture.priceMinor < 0) {
    throw new Error(`Invalid price for product ${fixture.id}`)
  }
}

export function adaptProductFixture(fixture: ProductFixture): Product {
  assertFixture(fixture)

  return {
    id: fixture.id,
    slug: fixture.slug,
    brand: {
      id: `fixture-brand-${fixture.brand.toLowerCase()}`,
      slug: fixture.brand.toLowerCase(),
      name: fixture.brand,
    },
    category: { id: 'fixture-category-city', slug: 'city', name: 'Город' },
    model: fixture.model,
    title: fixture.title,
    description: fixture.title,
    price: { amountMinor: fixture.priceMinor, currency: 'RUB' },
    defaultVariant: {
      id: `fixture-variant-${fixture.id}`,
      slug: `${fixture.slug}-default`,
      color: { slug: 'default', name: 'Основной', code: '#171C26' },
    },
    image: {
      ...resolveProductImageAsset(`/img/sneakers/${fixture.imageNumber}.png`, 266, 224),
      alt: `${fixture.brand} ${fixture.model}, вид сбоку`,
    },
    fit: {
      ...fixture.fit,
      note: 'unknown',
      provenance: 'editorial_demo',
      sourceNote: 'M1 deterministic fixture',
      reviewedAt: '2026-08-28',
    },
    useCases: fixture.useCases,
    availableSizes: ['40', '42', '44'],
    availability: { inStock: true, totalStock: 8 },
  }
}

export const fixtureProducts = productFixtures.map(adaptProductFixture)

export const fixtureCatalogRepository: CatalogRepository = {
  list(params) {
    const offset = (params.page - 1) * params.pageSize
    const products = fixtureProducts.slice(offset, offset + params.pageSize)

    return Promise.resolve({
      products,
      page: params.page,
      pageSize: params.pageSize,
      total: fixtureProducts.length,
      totalPages: Math.max(1, Math.ceil(fixtureProducts.length / params.pageSize)),
    })
  },
}
