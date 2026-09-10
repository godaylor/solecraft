import type { Metric } from 'web-vitals'

export type RouteFamily =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'auth'
  | 'account'
  | 'orders'
  | 'not-found'

export type ObservabilityEvent =
  | {
      type: 'client-error'
      kind: 'window-error' | 'unhandled-rejection' | 'route-error'
      route: RouteFamily
      requestId?: string
    }
  | {
      type: 'web-vital'
      name: 'CLS' | 'INP' | 'LCP'
      value: number
      rating: Metric['rating']
      navigationType: Metric['navigationType']
    }

export type ObservabilitySink = (event: ObservabilityEvent) => void

const browserEventName = 'solecraft:observability'
let sink: ObservabilitySink = (event) => {
  window.dispatchEvent(new CustomEvent(browserEventName, { detail: event }))
}

export function classifyRouteFamily(pathname: string): RouteFamily {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/catalog')) return 'catalog'
  if (pathname.startsWith('/products/')) return 'product'
  if (pathname.startsWith('/cart')) return 'cart'
  if (pathname.startsWith('/wishlist')) return 'wishlist'
  if (pathname.startsWith('/checkout')) return 'checkout'
  if (pathname.startsWith('/auth')) return 'auth'
  if (pathname === '/account') return 'account'
  if (pathname.startsWith('/account/orders')) return 'orders'
  return 'not-found'
}

export function configureObservabilitySink(nextSink: ObservabilitySink) {
  const previousSink = sink
  sink = nextSink
  return () => {
    sink = previousSink
  }
}

function emit(event: ObservabilityEvent) {
  try {
    sink(event)
  } catch {
    // Observability must never break the commerce journey.
  }
}

export function reportClientError(
  kind: Extract<ObservabilityEvent, { type: 'client-error' }>['kind'],
  requestId?: string,
) {
  const safeRequestId =
    requestId && /^[a-zA-Z0-9-]{1,64}$/.test(requestId) ? requestId : undefined
  emit({
    type: 'client-error',
    kind,
    route: classifyRouteFamily(window.location.pathname),
    ...(safeRequestId ? { requestId: safeRequestId } : {}),
  })
}

function reportMetric(metric: Metric) {
  if (metric.name !== 'CLS' && metric.name !== 'INP' && metric.name !== 'LCP') return
  emit({
    type: 'web-vital',
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  })
}

async function startWebVitals() {
  const { onCLS, onINP, onLCP } = await import('web-vitals')
  onCLS(reportMetric)
  onINP(reportMetric)
  onLCP(reportMetric)
}

export function installObservability() {
  window.addEventListener('error', () => reportClientError('window-error'))
  window.addEventListener('unhandledrejection', () =>
    reportClientError('unhandled-rejection'),
  )

  const schedule = () => void startWebVitals()
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(schedule, { timeout: 2_000 })
  } else {
    globalThis.setTimeout(schedule, 0)
  }
}
