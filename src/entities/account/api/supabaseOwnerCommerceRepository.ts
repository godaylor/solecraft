import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import { adaptCatalogRow } from '../../product/api/supabaseCatalogRepository'
import type { OwnerCommerceRepository } from './OwnerCommerceRepository'

function requireUserId(id: string | undefined): string {
  if (!id) throw new Error('Authenticated user is required')
  return id
}

export function createSupabaseOwnerCommerceRepository(
  client: PublicSupabaseClient,
): OwnerCommerceRepository {
  async function userId() {
    const { data, error } = await client.auth.getUser()
    if (error) throw new Error('Auth session is unavailable')
    return requireUserId(data.user?.id)
  }

  async function cartId(): Promise<string | undefined> {
    const { data, error } = await client.from('carts').select('id').maybeSingle()
    if (error) throw new Error(`Owner cart failed (${error.code})`)
    return data?.id
  }

  return {
    async mergeGuest(cart, wishlistProductIds) {
      const { data, error } = await client.rpc('merge_guest_commerce', {
        p_cart: cart.map((line) => ({
          inventoryId: line.inventoryId,
          quantity: line.quantity,
        })),
        p_wishlist: [...wishlistProductIds],
      })
      if (error) throw new Error(`Commerce merge failed (${error.code})`)
      const result = data as Record<string, unknown>
      return {
        cartMerged: Number(result.cartMerged ?? 0),
        wishlistMerged: Number(result.wishlistMerged ?? 0),
        unavailableInventoryIds: Array.isArray(result.unavailableInventoryIds)
          ? result.unavailableInventoryIds.filter(
              (id): id is string => typeof id === 'string',
            )
          : [],
      }
    },
    async getCart() {
      const id = await cartId()
      if (!id) return []
      const { data, error } = await client
        .from('cart_items')
        .select('inventory_id,quantity,updated_at')
        .eq('cart_id', id)
        .order('created_at')
      if (error) throw new Error(`Owner cart lines failed (${error.code})`)
      return data.map((line) => ({
        inventoryId: line.inventory_id,
        quantity: line.quantity,
        updatedAt: line.updated_at,
      }))
    },
    async setCartQuantity(inventoryId, quantity) {
      const id = await cartId()
      if (!id) throw new Error('Owner cart is unavailable')
      const { error } = await client
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('cart_id', id)
        .eq('inventory_id', inventoryId)
      if (error) throw new Error(`Owner cart update failed (${error.code})`)
    },
    async removeCartLine(inventoryId) {
      const id = await cartId()
      if (!id) return
      const { error } = await client
        .from('cart_items')
        .delete()
        .eq('cart_id', id)
        .eq('inventory_id', inventoryId)
      if (error) throw new Error(`Owner cart remove failed (${error.code})`)
    },
    async clearCart() {
      const id = await cartId()
      if (!id) return
      const { error } = await client.from('cart_items').delete().eq('cart_id', id)
      if (error) throw new Error(`Owner cart clear failed (${error.code})`)
    },
    async getWishlistIds() {
      const { data, error } = await client
        .from('wishlist_items')
        .select('product_id')
        .order('created_at')
      if (error) throw new Error(`Owner wishlist failed (${error.code})`)
      return data.map((item) => item.product_id)
    },
    async addWishlist(productId) {
      const id = await userId()
      const { error } = await client
        .from('wishlist_items')
        .insert({ user_id: id, product_id: productId })
      if (error && error.code !== '23505')
        throw new Error(`Wishlist add failed (${error.code})`)
    },
    async removeWishlist(productId) {
      const { error } = await client
        .from('wishlist_items')
        .delete()
        .eq('product_id', productId)
      if (error) throw new Error(`Wishlist remove failed (${error.code})`)
    },
    async getWishlistProducts(productIds) {
      if (!productIds.length) return []
      const { data, error } = await client
        .from('catalog_products')
        .select('*')
        .in('id', [...productIds])
      if (error) throw new Error(`Wishlist products failed (${error.code})`)
      return data.map(adaptCatalogRow)
    },
  }
}
