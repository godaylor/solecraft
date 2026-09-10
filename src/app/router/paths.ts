export const paths = {
  home: '/',
  catalog: '/catalog',
  cart: '/cart',
  wishlist: '/wishlist',
  signIn: '/auth/sign-in',
  authCallback: '/auth/callback',
  account: '/account',
  accountOrders: '/account/orders',
  checkoutContact: '/checkout/contact',
} as const

export function checkoutStepPath(
  step: 'contact' | 'delivery' | 'payment' | 'review',
): string {
  return `/checkout/${step}`
}

export function checkoutSuccessPath(orderNumber: string): string {
  return `/checkout/success/${encodeURIComponent(orderNumber)}`
}

export function orderHistoryPath(page = 1): string {
  return page > 1 ? `${paths.accountOrders}?page=${page}` : paths.accountOrders
}

export function orderDetailPath(orderNumber: string): string {
  return `${paths.accountOrders}/${encodeURIComponent(orderNumber)}`
}

export function productPath(slug: string, colorSlug?: string): string {
  const pathname = `/products/${encodeURIComponent(slug)}`
  return colorSlug
    ? `${pathname}?${new URLSearchParams({ color: colorSlug }).toString()}`
    : pathname
}

export function catalogProductAnchor(slug: string): string {
  return productPath(slug)
}
