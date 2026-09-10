import { createBrowserRouter, type RouteObject } from 'react-router'

import type { CatalogRepository } from '../../entities/product/api/CatalogRepository'
import {
  ProductRepositoryError,
  type ProductRepository,
} from '../../entities/product/api/ProductRepository'
import type { CartHandoff } from '../../entities/cart/model/cartHandoff'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import type { OwnerCommerceRepository } from '../../entities/account/api/OwnerCommerceRepository'
import type { CheckoutRepository } from '../../entities/checkout/api/CheckoutRepository'
import type { OrderRepository } from '../../entities/order/api/OrderRepository'
import { HomeRoute } from '../../routes/home/HomeRoute'
import { NotFoundRoute } from '../../routes/not-found/NotFoundRoute'
import { RootLayout } from '../layouts/RootLayout'
import { RouteErrorBoundary, RouteHydrateFallback } from './RouteErrorBoundary'

export type AppRouterDependencies = {
  catalogRepository: CatalogRepository
  productRepository?: ProductRepository
  cartHandoff?: CartHandoff
  cartRepository?: CartRepository
  ownerCommerceRepository?: OwnerCommerceRepository
  checkoutRepository?: CheckoutRepository
  orderRepository?: OrderRepository
}

export function createAppRoutes({
  catalogRepository,
  productRepository,
  cartHandoff,
  cartRepository,
  ownerCommerceRepository,
  checkoutRepository,
  orderRepository,
}: AppRouterDependencies): RouteObject[] {
  const resolvedProductRepository = productRepository ?? {
    getBySlug() {
      return Promise.reject(
        new ProductRepositoryError('not-found', 'Product was not found', false),
      )
    },
  }
  const resolvedCartHandoff = cartHandoff ?? { add() {} }
  const resolvedCartRepository = cartRepository ?? {
    getInventory() {
      return Promise.resolve([])
    },
  }
  const resolvedOwnerCommerceRepository: OwnerCommerceRepository =
    ownerCommerceRepository ?? {
      mergeGuest: () =>
        Promise.resolve({
          cartMerged: 0,
          wishlistMerged: 0,
          unavailableInventoryIds: [],
        }),
      getCart: () => Promise.resolve([]),
      setCartQuantity: () => Promise.resolve(),
      removeCartLine: () => Promise.resolve(),
      clearCart: () => Promise.resolve(),
      getWishlistIds: () => Promise.resolve([]),
      addWishlist: () => Promise.resolve(),
      removeWishlist: () => Promise.resolve(),
      getWishlistProducts: () => Promise.resolve([]),
    }
  const resolvedCheckoutRepository: CheckoutRepository = checkoutRepository ?? {
    createOrder: () => Promise.reject(new Error('Checkout repository is unavailable')),
    readGuestReceipt: () => Promise.resolve(null),
    readOwnerReceipt: () => Promise.resolve(null),
  }
  const resolvedOrderRepository: OrderRepository = orderRepository ?? {
    getOrders: (page, pageSize) =>
      Promise.resolve({ orders: [], total: 0, page, pageSize }),
    getOrder: () => Promise.resolve(null),
  }

  return [
    {
      path: '/',
      element: <RootLayout cartRepository={resolvedCartRepository} />,
      ErrorBoundary: RouteErrorBoundary,
      HydrateFallback: RouteHydrateFallback,
      children: [
        { index: true, Component: HomeRoute },
        {
          path: 'catalog',
          lazy: async () => {
            const { CatalogRoute } = await import('../../routes/catalog/CatalogRoute')
            return { element: <CatalogRoute catalogRepository={catalogRepository} /> }
          },
        },
        {
          path: 'products/:slug',
          lazy: async () => {
            const { ProductRoute } = await import('../../routes/product/ProductRoute')
            return {
              element: (
                <ProductRoute
                  productRepository={resolvedProductRepository}
                  cartHandoff={resolvedCartHandoff}
                />
              ),
            }
          },
        },
        {
          path: 'cart',
          lazy: async () => {
            const { CartRoute } = await import('../../routes/cart/CartRoute')
            return { element: <CartRoute cartRepository={resolvedCartRepository} /> }
          },
        },
        {
          path: 'wishlist',
          lazy: async () => {
            const { WishlistRoute } =
              await import('../../routes/wishlist/WishlistRoute')
            return {
              element: <WishlistRoute repository={resolvedOwnerCommerceRepository} />,
            }
          },
        },
        {
          path: 'auth/sign-in',
          lazy: async () => ({
            Component: (await import('../../routes/auth/SignInRoute')).SignInRoute,
          }),
        },
        {
          path: 'auth/callback',
          lazy: async () => ({
            Component: (await import('../../routes/auth/AuthCallbackRoute'))
              .AuthCallbackRoute,
          }),
        },
        {
          path: 'account',
          lazy: async () => ({
            Component: (await import('../../routes/auth/AccountRoute')).AccountRoute,
          }),
        },
        {
          path: 'account/orders',
          lazy: async () => {
            const { OrderHistoryRoute } =
              await import('../../routes/orders/OrderHistoryRoute')
            return {
              element: <OrderHistoryRoute repository={resolvedOrderRepository} />,
            }
          },
        },
        {
          path: 'account/orders/:orderNumber',
          lazy: async () => {
            const { OrderDetailRoute } =
              await import('../../routes/orders/OrderDetailRoute')
            return {
              element: <OrderDetailRoute repository={resolvedOrderRepository} />,
            }
          },
        },
        {
          path: 'checkout/success/:orderNumber',
          lazy: async () => {
            const { CheckoutSuccessRoute } =
              await import('../../routes/checkout/CheckoutSuccessRoute')
            return {
              element: <CheckoutSuccessRoute repository={resolvedCheckoutRepository} />,
            }
          },
        },
        {
          path: 'checkout/:step',
          lazy: async () => {
            const { CheckoutRoute } =
              await import('../../routes/checkout/CheckoutRoute')
            return {
              element: (
                <CheckoutRoute
                  checkoutRepository={resolvedCheckoutRepository}
                  cartRepository={resolvedCartRepository}
                />
              ),
            }
          },
        },
        { path: '*', Component: NotFoundRoute },
      ],
    },
  ]
}

export function createAppRouter(dependencies: AppRouterDependencies) {
  return createBrowserRouter(createAppRoutes(dependencies))
}
