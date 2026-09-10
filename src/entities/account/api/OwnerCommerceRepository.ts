import type { GuestCartLine } from '../../cart/model/guestCartStore'
import type { Product } from '../../product/model/product'

export type MergeGuestResult = {
  cartMerged: number
  wishlistMerged: number
  unavailableInventoryIds: string[]
}

export interface OwnerCommerceRepository {
  mergeGuest(
    cart: readonly GuestCartLine[],
    wishlistProductIds: readonly string[],
  ): Promise<MergeGuestResult>
  getCart(): Promise<GuestCartLine[]>
  setCartQuantity(inventoryId: string, quantity: number): Promise<void>
  removeCartLine(inventoryId: string): Promise<void>
  clearCart(): Promise<void>
  getWishlistIds(): Promise<string[]>
  addWishlist(productId: string): Promise<void>
  removeWishlist(productId: string): Promise<void>
  getWishlistProducts(productIds: readonly string[]): Promise<Product[]>
}
