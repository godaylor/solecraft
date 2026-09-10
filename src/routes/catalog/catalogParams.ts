import type {
  CatalogPageParams,
  CatalogSort,
} from '../../entities/product/api/CatalogRepository'
import type { FitWidth } from '../../entities/product/model/product'
import {
  brandOptions,
  colorOptions,
  sizeOptions,
  useCaseOptions,
  widthOptions,
} from './catalogOptions'

export type CatalogUrlState = Omit<CatalogPageParams, 'pageSize'>

const defaultSort: CatalogSort = 'recommended'
const catalogSorts = new Set<CatalogSort>([
  'recommended',
  'newest',
  'price-asc',
  'price-desc',
])
const knownBrands = new Set(brandOptions.map((option) => option.value))
const knownUses = new Set(useCaseOptions.map((option) => option.value))
const knownSizes = new Set<string>(sizeOptions)
const knownWidths = new Set<FitWidth>(widthOptions.map((option) => option.value))
const knownColors = new Set(colorOptions.map((option) => option.value))

export const emptyCatalogState: CatalogUrlState = {
  brands: [],
  uses: [],
  colors: [],
  sort: defaultSort,
  page: 1,
}

function normalizeQuery(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ').slice(0, 120)
  return normalized ? normalized : undefined
}

function normalizeMultiValue(
  values: readonly string[],
  allowed: ReadonlySet<string>,
): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()))]
    .filter((value) => allowed.has(value))
    .sort((left, right) => left.localeCompare(right, 'en'))
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined
}

export function normalizeCatalogState(state: CatalogUrlState): CatalogUrlState {
  const priceValues = [state.priceMin, state.priceMax].filter(
    (value): value is number =>
      value !== undefined && Number.isSafeInteger(value) && value >= 0,
  )
  const priceMin = priceValues.length > 0 ? Math.min(...priceValues) : undefined
  const priceMax = priceValues.length > 1 ? Math.max(...priceValues) : undefined
  const q = normalizeQuery(state.q)
  const size = state.size && knownSizes.has(state.size) ? state.size : undefined
  const width = state.width && knownWidths.has(state.width) ? state.width : undefined

  return {
    ...(q ? { q } : {}),
    brands: normalizeMultiValue(state.brands, knownBrands),
    uses: normalizeMultiValue(state.uses, knownUses),
    ...(size ? { size } : {}),
    ...(width ? { width } : {}),
    colors: normalizeMultiValue(state.colors, knownColors),
    ...(priceMin === undefined ? {} : { priceMin }),
    ...(priceMax === undefined ? {} : { priceMax }),
    ...(state.inStock === true ? { inStock: true } : {}),
    sort: catalogSorts.has(state.sort) ? state.sort : defaultSort,
    page: Number.isSafeInteger(state.page) && state.page > 0 ? state.page : 1,
  }
}

export function parseCatalogParams(searchParams: URLSearchParams): CatalogUrlState {
  const rawSort = searchParams.get('sort')
  const rawWidth = searchParams.get('width')
  const rawPriceMin = parsePositiveInteger(searchParams.get('priceMin'))
  const rawPriceMax = parsePositiveInteger(searchParams.get('priceMax'))
  const q = searchParams.get('q')
  const size = searchParams.get('size')

  return normalizeCatalogState({
    ...(q === null ? {} : { q }),
    brands: searchParams.getAll('brand'),
    uses: searchParams.getAll('use'),
    ...(size === null ? {} : { size }),
    ...(rawWidth === null ? {} : { width: rawWidth as FitWidth }),
    colors: searchParams.getAll('color'),
    ...(rawPriceMin === undefined ? {} : { priceMin: rawPriceMin }),
    ...(rawPriceMax === undefined ? {} : { priceMax: rawPriceMax }),
    inStock: searchParams.get('inStock') === 'true',
    sort: catalogSorts.has(rawSort as CatalogSort)
      ? (rawSort as CatalogSort)
      : defaultSort,
    page: parsePositiveInteger(searchParams.get('page')) ?? 1,
  })
}

export function serializeCatalogParams(state: CatalogUrlState): URLSearchParams {
  const normalized = normalizeCatalogState(state)
  const searchParams = new URLSearchParams()

  if (normalized.q) searchParams.set('q', normalized.q)
  normalized.brands.forEach((value) => searchParams.append('brand', value))
  normalized.uses.forEach((value) => searchParams.append('use', value))
  if (normalized.size) searchParams.set('size', normalized.size)
  if (normalized.width) searchParams.set('width', normalized.width)
  normalized.colors.forEach((value) => searchParams.append('color', value))
  if (normalized.priceMin !== undefined) {
    searchParams.set('priceMin', String(normalized.priceMin))
  }
  if (normalized.priceMax !== undefined) {
    searchParams.set('priceMax', String(normalized.priceMax))
  }
  if (normalized.inStock) searchParams.set('inStock', 'true')
  if (normalized.sort !== defaultSort) searchParams.set('sort', normalized.sort)
  if (normalized.page > 1) searchParams.set('page', String(normalized.page))

  return searchParams
}

export function hasCatalogDiscoveryState(state: CatalogUrlState): boolean {
  return Boolean(
    state.q ||
    state.brands.length ||
    state.uses.length ||
    state.size ||
    state.width ||
    state.colors.length ||
    state.priceMin !== undefined ||
    state.priceMax !== undefined ||
    state.inStock,
  )
}
