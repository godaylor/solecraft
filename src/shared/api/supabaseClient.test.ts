import { describe, expect, it, vi } from 'vitest'

import {
  createRequestFetch,
  requestTimeoutMs,
  type PublicSupabaseConfig,
} from './supabaseClient'

const localConfig: PublicSupabaseConfig = {
  url: 'http://127.0.0.1:32621',
  publishableKey: 'local-test-anon',
}

describe('Supabase request transport', () => {
  it('adds a bounded timeout, composes caller cancellation, and strips local placeholders', async () => {
    const fetchImplementation = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    )
    const controller = new AbortController()
    const requestFetch = createRequestFetch(localConfig, fetchImplementation)

    await requestFetch('http://127.0.0.1:32621/rest/v1/catalog_products', {
      headers: {
        apikey: 'local-test-anon',
        authorization: 'Bearer local-test-anon',
        accept: 'application/json',
      },
      signal: controller.signal,
    })

    const init = fetchImplementation.mock.calls[0]?.[1]
    const headers = new Headers(init?.headers)
    expect(requestTimeoutMs).toBe(8_000)
    expect(headers.get('apikey')).toBeNull()
    expect(headers.get('authorization')).toBeNull()
    expect(headers.get('accept')).toBe('application/json')
    expect(init?.signal).toBeInstanceOf(AbortSignal)

    controller.abort()
    expect(init?.signal?.aborted).toBe(true)
  })

  it('preserves real publishable authorization outside the local test stack', async () => {
    const fetchImplementation = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    )
    const requestFetch = createRequestFetch(
      {
        url: 'https://project.supabase.co',
        publishableKey: 'sb_publishable_example',
      },
      fetchImplementation,
    )

    await requestFetch('https://project.supabase.co/rest/v1/catalog_products', {
      headers: {
        apikey: 'sb_publishable_example',
        authorization: 'Bearer user-jwt',
      },
    })

    const headers = new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers)
    expect(headers.get('apikey')).toBe('sb_publishable_example')
    expect(headers.get('authorization')).toBe('Bearer user-jwt')
  })
})
