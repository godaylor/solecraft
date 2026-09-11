import type { PostgrestError } from '@supabase/supabase-js'

import type { Database } from '../../../shared/api/database.types'
import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import {
  CatalogRepositoryError,
  type CatalogPage,
  type CatalogPageParams,
  type CatalogRepository,
} from './CatalogRepository'
import type {
  Cushioning,
  DataProvenance,
  FitNote,
  FitWidth,
  Product,
  Support,
} from '../model/product'
import { resolveProductImageAsset } from '../model/productMedia'

type CatalogRow = Database['public']['Views']['catalog_products']['Row']

export type CatalogFilterPlan =
  | { kind: 'search'; value: string }
  | { kind: 'brands'; values: readonly string[] }
  | { kind: 'uses'; values: readonly string[] }
  | { kind: 'size'; value: string }
  | { kind: 'width'; value: NonNullable<CatalogPageParams['width']> }
  | { kind: 'colors'; values: readonly string[] }
  | { kind: 'price-min'; value: number }
  | { kind: 'price-max'; value: number }
  | { kind: 'in-stock'; value: true }

type CatalogOrderColumn = 'merch_rank' | 'published_at' | 'price_minor' | 'id'

export type CatalogRequestPlan = {
  filters: readonly CatalogFilterPlan[]
  orders: readonly { column: CatalogOrderColumn; ascending: boolean }[]
  range: readonly [from: number, to: number]
}

export function createCatalogRequestPlan(
  params: CatalogPageParams,
): CatalogRequestPlan {
  const filters: CatalogFilterPlan[] = []

  if (params.q) filters.push({ kind: 'search', value: params.q })
  if (params.brands.length) filters.push({ kind: 'brands', values: params.brands })
  if (params.uses.length) filters.push({ kind: 'uses', values: params.uses })
  if (params.size) filters.push({ kind: 'size', value: params.size })
  if (params.width) filters.push({ kind: 'width', value: params.width })
  if (params.colors.length) filters.push({ kind: 'colors', values: params.colors })
  if (params.priceMin !== undefined) {
    filters.push({ kind: 'price-min', value: params.priceMin })
  }
  if (params.priceMax !== undefined) {
    filters.push({ kind: 'price-max', value: params.priceMax })
  }
  if (params.inStock) filters.push({ kind: 'in-stock', value: true })

  const primaryOrder =
    params.sort === 'newest'
      ? { column: 'published_at' as const, ascending: false }
      : params.sort === 'price-asc'
        ? { column: 'price_minor' as const, ascending: true }
        : params.sort === 'price-desc'
          ? { column: 'price_minor' as const, ascending: false }
          : { column: 'merch_rank' as const, ascending: true }
  const offset = (params.page - 1) * params.pageSize

  return {
    filters,
    orders: [primaryOrder, { column: 'id', ascending: true }],
    range: [offset, offset + params.pageSize - 1],
  }
}

const fitWidths = new Set<FitWidth>([
  'narrow',
  'standard',
  'wide',
  'extra_wide',
  'unknown',
])
const cushioningValues = new Set<Cushioning>(['firm', 'balanced', 'soft', 'unknown'])
const supportValues = new Set<Support>([
  'flexible',
  'balanced',
  'structured',
  'unknown',
])
const fitNotes = new Set<FitNote>([
  'runs_small',
  'true_to_size',
  'runs_large',
  'unknown',
])
const provenances = new Set<DataProvenance>([
  'manufacturer',
  'editorial_demo',
  'unknown',
])

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CatalogRepositoryError(
      'malformed',
      `Catalog field ${field} is invalid`,
      false,
    )
  }

  return value
}

function requireInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new CatalogRepositoryError(
      'malformed',
      `Catalog field ${field} is invalid`,
      false,
    )
  }

  return Number(value)
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new CatalogRepositoryError(
      'malformed',
      `Catalog field ${field} is invalid`,
      false,
    )
  }

  return value as string[]
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  field: string,
): T {
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    throw new CatalogRepositoryError(
      'malformed',
      `Catalog field ${field} is invalid`,
      false,
    )
  }

  return value as T
}

function optionalInteger(value: unknown, field: string): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return requireInteger(value, field)
}

function mapUseCases(row: CatalogRow): Product['useCases'] {
  const slugs = requireStringArray(row.use_case_slugs, 'use_case_slugs')
  const labels = requireStringArray(row.use_case_labels, 'use_case_labels')

  if (slugs.length !== labels.length) {
    throw new CatalogRepositoryError(
      'malformed',
      'Catalog use-case labels do not match slugs',
      false,
    )
  }

  return slugs.map((slug, index) => ({
    slug,
    label: requireString(labels[index], `use_case_labels[${index}]`),
  }))
}

export function adaptCatalogRow(row: CatalogRow): Product {
  const compareAtMinor = optionalInteger(row.compare_at_minor, 'compare_at_minor')
  const sourceNote =
    row.fit_source_note === null
      ? undefined
      : requireString(row.fit_source_note, 'fit_source_note')
  const reviewedAt =
    row.fit_reviewed_at === null
      ? undefined
      : requireString(row.fit_reviewed_at, 'fit_reviewed_at')

  const image = resolveProductImageAsset(
    requireString(row.image_path, 'image_path'),
    requireInteger(row.image_width, 'image_width'),
    requireInteger(row.image_height, 'image_height'),
  )

  return {
    id: requireString(row.id, 'id'),
    slug: requireString(row.slug, 'slug'),
    brand: {
      id: requireString(row.brand_id, 'brand_id'),
      slug: requireString(row.brand_slug, 'brand_slug'),
      name: requireString(row.brand_name, 'brand_name'),
    },
    category: {
      id: requireString(row.category_id, 'category_id'),
      slug: requireString(row.category_slug, 'category_slug'),
      name: requireString(row.category_name, 'category_name'),
    },
    model: requireString(row.model, 'model'),
    title: requireString(row.title, 'title'),
    description: requireString(row.description, 'description'),
    price: {
      amountMinor: requireInteger(row.price_minor, 'price_minor'),
      currency: requireString(row.currency, 'currency') as 'RUB',
    },
    ...(compareAtMinor === undefined
      ? {}
      : {
          compareAtPrice: {
            amountMinor: compareAtMinor,
            currency: requireString(row.currency, 'currency') as 'RUB',
          },
        }),
    defaultVariant: {
      id: requireString(row.default_variant_id, 'default_variant_id'),
      slug: requireString(row.default_variant_slug, 'default_variant_slug'),
      color: {
        slug: requireString(row.default_color_slug, 'default_color_slug'),
        name: requireString(row.default_color_name, 'default_color_name'),
        code: requireString(row.default_color_code, 'default_color_code'),
      },
    },
    image: {
      ...image,
      alt: requireString(row.image_alt, 'image_alt'),
    },
    fit: {
      width: requireEnum(row.fit_width, fitWidths, 'fit_width'),
      cushioning: requireEnum(row.cushioning, cushioningValues, 'cushioning'),
      support: requireEnum(row.support_level, supportValues, 'support_level'),
      note: requireEnum(row.fit_note, fitNotes, 'fit_note'),
      provenance: requireEnum(row.fit_provenance, provenances, 'fit_provenance'),
      ...(sourceNote === undefined ? {} : { sourceNote }),
      ...(reviewedAt === undefined ? {} : { reviewedAt }),
    },
    useCases: mapUseCases(row),
    availableSizes: requireStringArray(row.available_sizes, 'available_sizes'),
    availability: {
      inStock: row.in_stock === true,
      totalStock: requireInteger(row.total_stock, 'total_stock'),
    },
  }
}

function mapPostgrestError(error: PostgrestError): CatalogRepositoryError {
  const nonRetryableCodes = new Set(['22P02', '42501', 'PGRST100', 'PGRST204'])
  return new CatalogRepositoryError(
    'backend',
    `Catalog request failed (${error.code})`,
    !nonRetryableCodes.has(error.code),
  )
}

export function createSupabaseCatalogRepository(
  client: PublicSupabaseClient,
): CatalogRepository {
  return {
    async list(params, options): Promise<CatalogPage> {
      const plan = createCatalogRequestPlan(params)
      let request = client.from('catalog_products').select('*', { count: 'exact' })

      for (const filter of plan.filters) {
        switch (filter.kind) {
          case 'search':
            request = request.textSearch('search_document', filter.value, {
              config: 'simple',
              type: 'websearch',
            })
            break
          case 'brands':
            request = request.in('brand_slug', [...filter.values])
            break
          case 'uses':
            request = request.overlaps('use_case_slugs', [...filter.values])
            break
          case 'size':
            request = request.overlaps('available_sizes', [filter.value])
            break
          case 'width':
            request = request.eq('fit_width', filter.value)
            break
          case 'colors':
            request = request.overlaps('color_slugs', [...filter.values])
            break
          case 'price-min':
            request = request.gte('price_minor', filter.value)
            break
          case 'price-max':
            request = request.lte('price_minor', filter.value)
            break
          case 'in-stock':
            request = request.eq('in_stock', filter.value)
            break
        }
      }

      for (const order of plan.orders) {
        request = request.order(order.column, { ascending: order.ascending })
      }

      request = request.range(plan.range[0], plan.range[1])

      if (options?.signal) {
        request = request.abortSignal(options.signal)
      }

      const { data, error, count } = await request

      if (error) {
        throw mapPostgrestError(error)
      }

      if (!Array.isArray(data) || count === null) {
        throw new CatalogRepositoryError(
          'malformed',
          'Catalog response is incomplete',
          false,
        )
      }

      const products = data.map(adaptCatalogRow)
      const totalPages = Math.max(1, Math.ceil(count / params.pageSize))

      return {
        products,
        page: params.page,
        pageSize: params.pageSize,
        total: count,
        totalPages,
      }
    },
  }
}
