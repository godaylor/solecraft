import { describe, expect, it } from 'vitest'

import { formatOrderDate, parseOrderPage, presentOrderStatus } from './order'

describe('order presentation', () => {
  it('maps status to a textual and visual tone without relying on color alone', () => {
    expect(presentOrderStatus('placed')).toEqual({ label: 'Принят', tone: 'new' })
    expect(presentOrderStatus('future_status')).toEqual({
      label: 'Статус уточняется',
      tone: 'muted',
    })
  })

  it('formats a locale-aware order timestamp and fails safely', () => {
    expect(formatOrderDate('2026-08-28T08:15:00Z')).toContain('2026')
    expect(formatOrderDate('bad')).toBe('Дата недоступна')
  })

  it('normalizes pagination input', () => {
    expect(parseOrderPage(null)).toBe(1)
    expect(parseOrderPage('2')).toBe(2)
    expect(parseOrderPage('0')).toBe(1)
    expect(parseOrderPage('2.5')).toBe(1)
    expect(parseOrderPage('bad')).toBe(1)
  })
})
