import { createSupabaseOwnerCommerceRepository } from '../../entities/account/api/supabaseOwnerCommerceRepository'
import { createSupabaseCartRepository } from '../../entities/cart/api/supabaseCartRepository'
import { createSupabaseCheckoutRepository } from '../../entities/checkout/api/supabaseCheckoutRepository'
import { createSupabaseOrderRepository } from '../../entities/order/api/supabaseOrderRepository'
import { createSupabaseCatalogRepository } from '../../entities/product/api/supabaseCatalogRepository'
import { createSupabaseProductRepository } from '../../entities/product/api/supabaseProductRepository'
import {
  createPublicSupabaseClient,
  readPublicSupabaseConfig,
} from '../../shared/api/supabaseClient'

const client = createPublicSupabaseClient(readPublicSupabaseConfig())

export const supabaseRuntime = {
  client,
  catalogRepository: createSupabaseCatalogRepository(client),
  productRepository: createSupabaseProductRepository(client),
  cartRepository: createSupabaseCartRepository(client),
  ownerCommerceRepository: createSupabaseOwnerCommerceRepository(client),
  checkoutRepository: createSupabaseCheckoutRepository(client),
  orderRepository: createSupabaseOrderRepository(client),
}
