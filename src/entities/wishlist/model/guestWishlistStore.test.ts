import { beforeEach, describe, expect, it } from 'vitest'

import { guestWishlistStorageKey, useGuestWishlistStore } from './guestWishlistStore'

beforeEach(() => {
  localStorage.clear()
  useGuestWishlistStore.setState({ productIds: [], updatedAt: '2026-08-28T00:00:00Z' })
})

describe('guest wishlist', () => {
  it('deduplicates, removes and persists only product IDs/timestamp', () => {
    useGuestWishlistStore.getState().toggle('product-1')
    useGuestWishlistStore.getState().toggle('product-1')
    useGuestWishlistStore.getState().toggle('product-1')
    expect(useGuestWishlistStore.getState().productIds).toEqual(['product-1'])
    expect(localStorage.getItem(guestWishlistStorageKey)).not.toContain('price')
  })

  it('clears merged snapshot without deleting additions made during merge', () => {
    useGuestWishlistStore.getState().toggle('product-1')
    const snapshot = [...useGuestWishlistStore.getState().productIds]
    useGuestWishlistStore.getState().toggle('product-2')
    useGuestWishlistStore.getState().consumeMerged(snapshot)
    expect(useGuestWishlistStore.getState().productIds).toEqual(['product-2'])
  })
})
