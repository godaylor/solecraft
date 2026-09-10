import { describe, expect, it } from 'vitest'

import { calculateCartTotals } from './cartTotals'

describe('cart estimate totals', () => {
  it.each([
    [0, 0, 0],
    [1_000_000, 49_000, 1_049_000],
    [1_500_000, 0, 1_500_000],
  ])('calculates delivery for subtotal %i', (subtotal, delivery, total) => {
    expect(calculateCartTotals(subtotal)).toEqual({
      subtotalMinor: subtotal,
      deliveryMinor: delivery,
      estimatedTotalMinor: total,
    })
  })
})
