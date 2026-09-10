import type { OwnerCommerceRepository } from '../../entities/account/api/OwnerCommerceRepository'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import type { CheckoutRepository } from '../../entities/checkout/api/CheckoutRepository'
import type { OrderRepository } from '../../entities/order/api/OrderRepository'
import type { CatalogRepository } from '../../entities/product/api/CatalogRepository'
import type { ProductRepository } from '../../entities/product/api/ProductRepository'
import type { PublicSupabaseClient } from '../../shared/api/supabaseClient'

type CommerceRuntime = {
  client: PublicSupabaseClient
  catalogRepository: CatalogRepository
  productRepository: ProductRepository
  cartRepository: CartRepository
  ownerCommerceRepository: OwnerCommerceRepository
  checkoutRepository: CheckoutRepository
  orderRepository: OrderRepository
}

let runtimePromise: Promise<CommerceRuntime> | undefined

function loadRuntime(): Promise<CommerceRuntime> {
  runtimePromise ??= import('./supabaseRuntime').then(
    ({ supabaseRuntime }) => supabaseRuntime,
  )
  return runtimePromise
}

function deferredRepository<T extends object>(
  select: (runtime: CommerceRuntime) => T,
): T {
  return new Proxy(
    {},
    {
      get(_target, property) {
        return (...args: unknown[]) =>
          loadRuntime().then((runtime) => {
            const repository = select(runtime)
            const method: unknown = Reflect.get(repository, property)

            if (typeof method !== 'function') {
              throw new Error('Deferred repository method is unavailable')
            }

            return (method as (...parameters: unknown[]) => unknown).apply(
              repository,
              args,
            )
          })
      },
    },
  ) as T
}

export const loadSupabaseClient = () => loadRuntime().then(({ client }) => client)
export const catalogRepository = deferredRepository(
  (runtime) => runtime.catalogRepository,
)
export const productRepository = deferredRepository(
  (runtime) => runtime.productRepository,
)
export const cartRepository = deferredRepository((runtime) => runtime.cartRepository)
export const ownerCommerceRepository = deferredRepository(
  (runtime) => runtime.ownerCommerceRepository,
)
export const checkoutRepository = deferredRepository(
  (runtime) => runtime.checkoutRepository,
)
export const orderRepository = deferredRepository((runtime) => runtime.orderRepository)
