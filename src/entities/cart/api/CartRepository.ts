import type { Money } from '../../product/model/product'

export type CartInventoryRecord = {
  inventoryId: string
  sku: string
  stock: number
  inventoryUpdatedAt: string
  sizeId: string
  sizeLabel: string
  variantId: string
  variantSlug: string
  colorSlug: string
  colorName: string
  price: Money
  compareAtPrice?: Money
  productId: string
  productSlug: string
  model: string
  title: string
  brandName: string
  image?: {
    src: string
    srcSet?: string
    alt: string
    width: number
    height: number
  }
}

export interface CartRepository {
  getInventory(
    inventoryIds: readonly string[],
    options?: { signal?: AbortSignal },
  ): Promise<readonly CartInventoryRecord[]>
}
