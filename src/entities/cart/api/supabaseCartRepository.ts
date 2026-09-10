import type { Database } from '../../../shared/api/database.types'
import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import type { CartInventoryRecord, CartRepository } from './CartRepository'

type CartRow = Database['public']['Views']['cart_inventory_items']['Row']

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Invalid cart field ${field}`)
  return value
}

function requiredInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new Error(`Invalid cart field ${field}`)
  return Number(value)
}

function mapCartRow(row: CartRow): CartInventoryRecord {
  const currency = requiredString(row.currency, 'currency')
  if (currency !== 'RUB') throw new Error('Invalid cart field currency')
  const compareAtMinor =
    row.compare_at_minor === null
      ? undefined
      : requiredInteger(row.compare_at_minor, 'compare_at_minor')
  const hasImage =
    row.image_path !== null &&
    row.image_alt !== null &&
    row.image_width !== null &&
    row.image_height !== null
  return {
    inventoryId: requiredString(row.inventory_id, 'inventory_id'),
    sku: requiredString(row.sku, 'sku'),
    stock: requiredInteger(row.stock_on_hand, 'stock_on_hand'),
    inventoryUpdatedAt: requiredString(
      row.inventory_updated_at,
      'inventory_updated_at',
    ),
    sizeId: requiredString(row.size_id, 'size_id'),
    sizeLabel: requiredString(row.size_label, 'size_label'),
    variantId: requiredString(row.variant_id, 'variant_id'),
    variantSlug: requiredString(row.variant_slug, 'variant_slug'),
    colorSlug: requiredString(row.color_slug, 'color_slug'),
    colorName: requiredString(row.color_name, 'color_name'),
    price: { amountMinor: requiredInteger(row.price_minor, 'price_minor'), currency },
    ...(compareAtMinor === undefined
      ? {}
      : { compareAtPrice: { amountMinor: compareAtMinor, currency } }),
    productId: requiredString(row.product_id, 'product_id'),
    productSlug: requiredString(row.product_slug, 'product_slug'),
    model: requiredString(row.model, 'model'),
    title: requiredString(row.title, 'title'),
    brandName: requiredString(row.brand_name, 'brand_name'),
    ...(hasImage
      ? {
          image: {
            src: row.image_path!,
            alt: row.image_alt!,
            width: row.image_width!,
            height: row.image_height!,
          },
        }
      : {}),
  }
}

export function createSupabaseCartRepository(
  client: PublicSupabaseClient,
): CartRepository {
  return {
    async getInventory(inventoryIds, options) {
      if (!inventoryIds.length) return []
      let request = client
        .from('cart_inventory_items')
        .select('*')
        .in('inventory_id', [...new Set(inventoryIds)])
      if (options?.signal) request = request.abortSignal(options.signal)
      const { data, error } = await request
      if (error) throw new Error(`Cart reconciliation failed (${error.code})`)
      return data.map(mapCartRow)
    },
  }
}
