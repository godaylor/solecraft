import { describe, expect, it } from 'vitest'

import { catalogProductAnchor, paths } from './paths'

describe('route paths', () => {
  it('keeps root and catalog routes stable', () => {
    expect(paths).toEqual({
      home: '/',
      catalog: '/catalog',
      cart: '/cart',
      wishlist: '/wishlist',
      signIn: '/auth/sign-in',
      authCallback: '/auth/callback',
      account: '/account',
      accountOrders: '/account/orders',
      checkoutContact: '/checkout/contact',
    })
  })

  it('encodes product detail paths', () => {
    expect(catalogProductAnchor('пара 01')).toBe(
      '/products/%D0%BF%D0%B0%D1%80%D0%B0%2001',
    )
  })
})
