import { describe, expect, it } from 'vitest'

import {
  classifyRouteFamily,
  configureObservabilitySink,
  reportClientError,
  type ObservabilityEvent,
} from './observability'

describe('privacy-safe observability', () => {
  it('maps identifier-bearing URLs to stable route families', () => {
    expect(classifyRouteFamily('/products/private-product-id')).toBe('product')
    expect(classifyRouteFamily('/account/orders/PARA-PRIVATE')).toBe('orders')
    expect(classifyRouteFamily('/missing')).toBe('not-found')
  })

  it('emits only the allowed error dimensions and sanitizes request IDs', () => {
    const events: ObservabilityEvent[] = []
    const restore = configureObservabilitySink((event) => events.push(event))
    window.history.replaceState({}, '', '/checkout/success/PARA-PRIVATE')

    reportClientError('route-error', 'unsafe request id with spaces')

    expect(events).toEqual([
      {
        type: 'client-error',
        kind: 'route-error',
        route: 'checkout',
      },
    ])
    expect(JSON.stringify(events)).not.toContain('PARA-PRIVATE')
    restore()
  })
})
