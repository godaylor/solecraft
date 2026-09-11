import type { PostgrestError } from '@supabase/supabase-js'

import type { Database } from '../../../shared/api/database.types'
import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import type {
  Cushioning,
  DataProvenance,
  FitNote,
  FitWidth,
  InventoryItem,
  ProductDetails,
  ProductMedia,
  ProductVariant,
  SizeGuideEntry,
  Support,
} from '../model/product'
import { ProductRepositoryError, type ProductRepository } from './ProductRepository'
import { resolveProductImageAsset } from '../model/productMedia'

type ProductDetailsRow = Database['public']['Views']['product_details']['Row']

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

function malformed(field: string): never {
  throw new ProductRepositoryError(
    'malformed',
    `Product field ${field} is invalid`,
    false,
  )
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) malformed(field)
  return value as Record<string, unknown>
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) malformed(field)
  return value
}

function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) malformed(field)
  return value
}

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) malformed(field)
  return Number(value)
}

function number(value: unknown, field: string): number {
  const result = Number(value)
  if (!Number.isFinite(result)) malformed(field)
  return result
}

function optionalInteger(value: unknown, field: string): number | undefined {
  return value === null || value === undefined ? undefined : integer(value, field)
}

function optionalString(value: unknown, field: string): string | undefined {
  return value === null || value === undefined ? undefined : string(value, field)
}

function enumValue<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  field: string,
): T {
  if (typeof value !== 'string' || !allowed.has(value as T)) malformed(field)
  return value as T
}

function mapMedia(value: unknown): ProductMedia[] {
  return array(value, 'variants.media').map((entry, index) => {
    const item = object(entry, `variants.media[${index}]`)
    const kind = string(item.kind, 'media.kind')
    if (kind !== 'catalog' && kind !== 'gallery') malformed('media.kind')
    const image = resolveProductImageAsset(
      string(item.src, 'media.src'),
      integer(item.width, 'media.width'),
      integer(item.height, 'media.height'),
    )
    return {
      id: string(item.id, 'media.id'),
      kind,
      ...image,
      alt: string(item.alt, 'media.alt'),
      position: integer(item.position, 'media.position'),
    }
  })
}

function mapInventory(value: unknown): InventoryItem[] {
  return array(value, 'variants.inventory').map((entry, index) => {
    const item = object(entry, `variants.inventory[${index}]`)
    return {
      inventoryId: string(item.inventoryId, 'inventory.inventoryId'),
      sku: string(item.sku, 'inventory.sku'),
      stock: integer(item.stock, 'inventory.stock'),
      sizeId: string(item.sizeId, 'inventory.sizeId'),
      sizeLabel: string(item.sizeLabel, 'inventory.sizeLabel'),
      sizeValue: number(item.sizeValue, 'inventory.sizeValue'),
      sortOrder: integer(item.sortOrder, 'inventory.sortOrder'),
    }
  })
}

function mapVariants(value: unknown): ProductVariant[] {
  const variants = array(value, 'variants').map((entry, index) => {
    const item = object(entry, `variants[${index}]`)
    const currency = string(item.currency, 'variant.currency')
    if (currency !== 'RUB') malformed('variant.currency')
    const compareAtMinor = optionalInteger(
      item.compareAtMinor,
      'variant.compareAtMinor',
    )
    return {
      id: string(item.id, 'variant.id'),
      slug: string(item.slug, 'variant.slug'),
      color: {
        slug: string(item.colorSlug, 'variant.colorSlug'),
        name: string(item.colorName, 'variant.colorName'),
        code: string(item.colorCode, 'variant.colorCode'),
      },
      price: { amountMinor: integer(item.priceMinor, 'variant.priceMinor'), currency },
      ...(compareAtMinor === undefined
        ? {}
        : { compareAtPrice: { amountMinor: compareAtMinor, currency } }),
      isDefault: item.isDefault === true,
      media: mapMedia(item.media),
      inventory: mapInventory(item.inventory),
    } satisfies ProductVariant
  })

  if (
    !variants.length ||
    variants.filter((variant) => variant.isDefault).length !== 1
  ) {
    malformed('variants')
  }
  return variants
}

function mapSizeGuide(value: unknown): SizeGuideEntry[] {
  return array(value, 'sizeGuide').map((entry, index) => {
    const item = object(entry, `sizeGuide[${index}]`)
    return {
      sizeId: string(item.sizeId, 'sizeGuide.sizeId'),
      sizeLabel: string(item.sizeLabel, 'sizeGuide.sizeLabel'),
      sizeValue: number(item.sizeValue, 'sizeGuide.sizeValue'),
      sortOrder: integer(item.sortOrder, 'sizeGuide.sortOrder'),
      ...(optionalInteger(item.footLengthMinMm, 'sizeGuide.footLengthMinMm') ===
      undefined
        ? {}
        : {
            footLengthMinMm: integer(item.footLengthMinMm, 'sizeGuide.footLengthMinMm'),
          }),
      ...(optionalInteger(item.footLengthMaxMm, 'sizeGuide.footLengthMaxMm') ===
      undefined
        ? {}
        : {
            footLengthMaxMm: integer(item.footLengthMaxMm, 'sizeGuide.footLengthMaxMm'),
          }),
      provenance: enumValue(item.provenance, provenances, 'sizeGuide.provenance'),
      ...(optionalString(item.sourceNote, 'sizeGuide.sourceNote') === undefined
        ? {}
        : { sourceNote: string(item.sourceNote, 'sizeGuide.sourceNote') }),
      ...(optionalString(item.reviewedAt, 'sizeGuide.reviewedAt') === undefined
        ? {}
        : { reviewedAt: string(item.reviewedAt, 'sizeGuide.reviewedAt') }),
    }
  })
}

export function adaptProductDetailsRow(row: ProductDetailsRow): ProductDetails {
  const sourceNote = optionalString(row.fit_source_note, 'fit_source_note')
  const reviewedAt = optionalString(row.fit_reviewed_at, 'fit_reviewed_at')
  const useCases = array(row.use_cases, 'use_cases').map((entry, index) => {
    const item = object(entry, `use_cases[${index}]`)
    return {
      slug: string(item.slug, 'use_case.slug'),
      label: string(item.label, 'use_case.label'),
    }
  })

  return {
    id: string(row.id, 'id'),
    slug: string(row.slug, 'slug'),
    brand: {
      id: string(row.brand_id, 'brand_id'),
      slug: string(row.brand_slug, 'brand_slug'),
      name: string(row.brand_name, 'brand_name'),
    },
    category: {
      id: string(row.category_id, 'category_id'),
      slug: string(row.category_slug, 'category_slug'),
      name: string(row.category_name, 'category_name'),
    },
    model: string(row.model, 'model'),
    title: string(row.title, 'title'),
    description: string(row.description, 'description'),
    fit: {
      width: enumValue(row.fit_width, fitWidths, 'fit_width'),
      cushioning: enumValue(row.cushioning, cushioningValues, 'cushioning'),
      support: enumValue(row.support_level, supportValues, 'support_level'),
      note: enumValue(row.fit_note, fitNotes, 'fit_note'),
      provenance: enumValue(row.fit_provenance, provenances, 'fit_provenance'),
      ...(sourceNote ? { sourceNote } : {}),
      ...(reviewedAt ? { reviewedAt } : {}),
    },
    useCases,
    variants: mapVariants(row.variants),
    sizeGuide: mapSizeGuide(row.size_guide),
  }
}

function mapError(error: PostgrestError): ProductRepositoryError {
  return new ProductRepositoryError(
    'backend',
    `Product request failed (${error.code})`,
    !new Set(['22P02', '42501', 'PGRST100', 'PGRST204']).has(error.code),
  )
}

export function createSupabaseProductRepository(
  client: PublicSupabaseClient,
): ProductRepository {
  return {
    async getBySlug(slug, options) {
      let request = client.from('product_details').select('*').eq('slug', slug)
      if (options?.signal) request = request.abortSignal(options.signal)
      const singleRequest = request.maybeSingle()
      const { data, error } = await singleRequest
      if (error) throw mapError(error)
      if (!data)
        throw new ProductRepositoryError('not-found', 'Product was not found', false)
      return adaptProductDetailsRow(data)
    },
  }
}
