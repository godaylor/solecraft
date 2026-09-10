import { describe, expect, it } from 'vitest'

import { safeReturnTo } from './AuthProvider'

describe('safe auth return URL', () => {
  it.each([
    ['/cart?from=auth', '/cart?from=auth'],
    ['/products/pair#size', '/products/pair#size'],
    ['https://evil.example/path', '/'],
    ['//evil.example/path', '/'],
    ['/\\evil.example', '/'],
    [null, '/'],
  ])('normalizes %s without open redirect', (value, expected) => {
    expect(safeReturnTo(value)).toBe(expected)
  })
})
