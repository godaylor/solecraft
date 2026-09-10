import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { PublicSupabaseClient } from '../../shared/api/supabaseClient'
import { AuthProvider, useAuth } from './AuthProvider'

const ownerSession = {
  user: { id: 'owner-1', email: 'owner@example.test' },
} as Session

function Probe() {
  const auth = useAuth()
  return (
    <>
      <output aria-label="Статус сессии">{auth.status}</output>
      <span>{auth.error}</span>
      <button type="button" onClick={() => void auth.refreshSession()}>
        Повторить сессию
      </button>
    </>
  )
}

function createAuthClient(
  getSession: ReturnType<typeof vi.fn>,
  onListener: (
    listener: (event: AuthChangeEvent, session: Session | null) => void,
  ) => void,
) {
  return {
    auth: {
      getSession,
      onAuthStateChange: vi.fn(
        (listener: (event: AuthChangeEvent, session: Session | null) => void) => {
          onListener(listener)
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        },
      ),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
    },
  } as unknown as PublicSupabaseClient
}

describe('AuthProvider session recovery', () => {
  it('fails closed and removes owner cache when an authenticated session expires', async () => {
    let listener:
      ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    const client = createAuthClient(
      vi.fn().mockResolvedValue({ data: { session: ownerSession }, error: null }),
      (nextListener) => {
        listener = nextListener
      },
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(['owner', 'owner-1', 'orders'], ['private'])
    queryClient.setQueryData(['catalog'], ['public'])
    sessionStorage.setItem('para:checkout-draft', '{"email":"private@example.test"}')

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={client}>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('authenticated')).toBeVisible()
    act(() => listener?.('SIGNED_OUT', null))

    expect(await screen.findByText('guest')).toBeVisible()
    expect(queryClient.getQueryData(['owner', 'owner-1', 'orders'])).toBeUndefined()
    expect(queryClient.getQueryData(['catalog'])).toEqual(['public'])
    expect(sessionStorage.getItem('para:checkout-draft')).toBeNull()
  })

  it('keeps private data hidden until a failed session check is retried successfully', async () => {
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({
        data: { session: null },
        error: new Error('offline'),
      })
      .mockResolvedValueOnce({ data: { session: ownerSession }, error: null })
    const client = createAuthClient(getSession, () => undefined)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={client}>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('error')).toBeVisible()
    expect(screen.getByText('Не удалось проверить сессию.')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Повторить сессию' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Статус сессии')).toHaveTextContent('authenticated'),
    )
  })
})
