import { describe, expect, it } from 'vitest'

import { formatMoney } from './formatMoney'

describe('formatMoney', () => {
  it('formats integer minor units as Russian rubles', () => {
    expect(formatMoney({ amountMinor: 1299000, currency: 'RUB' })).toBe('12 990 ₽')
  })

  it('rejects non-integer minor units', () => {
    expect(() => formatMoney({ amountMinor: 12.5, currency: 'RUB' })).toThrow(
      'integer in minor units',
    )
  })
})
