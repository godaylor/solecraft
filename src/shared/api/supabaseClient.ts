import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

export type PublicSupabaseClient = SupabaseClient<Database>

export type PublicSupabaseConfig = {
  url: string
  publishableKey: string
}

const localTestKey = 'local-test-anon'
export const requestTimeoutMs = 8_000

export function createRequestFetch(
  config: PublicSupabaseConfig,
  fetchImplementation: typeof fetch = globalThis.fetch,
): typeof fetch {
  const hostname = new URL(config.url).hostname
  const isLoopback = hostname === '127.0.0.1' || hostname === 'localhost'

  return (input, init) => {
    const headers = new Headers(init?.headers)
    if (isLoopback && config.publishableKey === localTestKey) {
      headers.delete('apikey')
      if (headers.get('authorization') === `Bearer ${localTestKey}`) {
        headers.delete('authorization')
      }
    }

    const signals = [AbortSignal.timeout(requestTimeoutMs)]
    if (init?.signal) signals.push(init.signal)
    if (input instanceof Request) signals.push(input.signal)

    return fetchImplementation(input, {
      ...init,
      headers,
      signal: AbortSignal.any(signals),
    })
  }
}

function requireConfigValue(value: string | undefined, name: string): string {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local for local development.`,
    )
  }

  return normalized
}

export function readPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = requireConfigValue(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
  const publishableKey = requireConfigValue(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  )

  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid absolute URL')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('VITE_SUPABASE_URL must use http or https')
  }

  return { url: parsedUrl.toString().replace(/\/$/, ''), publishableKey }
}

export function createPublicSupabaseClient(
  config: PublicSupabaseConfig,
): PublicSupabaseClient {
  const requestFetch = createRequestFetch(config)

  return createClient<Database>(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'solecraft/0.2',
      },
      fetch: requestFetch,
    },
  })
}
