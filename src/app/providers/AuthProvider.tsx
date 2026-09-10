/* eslint-disable react-refresh/only-export-components */
import type { Session, User } from '@supabase/supabase-js'
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { PublicSupabaseClient } from '../../shared/api/supabaseClient'
import {
  authReturnStorageKey,
  checkoutDraftStorageKey,
  legacyAuthReturnStorageKey,
  legacyCheckoutDraftStorageKey,
} from '../../shared/config/storageKeys'
import { useLocale } from '../../shared/i18n/locale'

type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error'

type AuthContextValue = {
  status: AuthStatus
  user?: User
  error?: string
  refreshSession: () => Promise<void>
  signInWithEmail: (email: string, returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/'
  try {
    const parsed = new URL(value, window.location.origin)
    return parsed.origin === window.location.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : '/'
  } catch {
    return '/'
  }
}

export function AuthProvider({
  client,
  loadClient,
  children,
}: {
  client?: PublicSupabaseClient
  loadClient?: () => Promise<PublicSupabaseClient>
  children: ReactNode
}) {
  const { text } = useLocale()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string>()
  const queryClient = useQueryClient()
  const currentUserId = useRef<string | undefined>(undefined)
  const resolveClient = useCallback(() => {
    if (client) return Promise.resolve(client)
    if (loadClient) return loadClient()
    return Promise.reject(new Error('Auth client is unavailable'))
  }, [client, loadClient])

  const clearPrivateClientState = useCallback(() => {
    sessionStorage.removeItem(checkoutDraftStorageKey)
    sessionStorage.removeItem(legacyCheckoutDraftStorageKey)
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] === 'owner',
    })
  }, [queryClient])

  const applySession = useCallback(
    (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id
      if (currentUserId.current && currentUserId.current !== nextUserId) {
        clearPrivateClientState()
      }
      currentUserId.current = nextUserId
      setSession(nextSession)
      setError(undefined)
      setStatus(nextSession ? 'authenticated' : 'guest')
    },
    [clearPrivateClientState],
  )

  const loadSession = useCallback(async () => {
    setStatus('loading')
    let resolvedClient: PublicSupabaseClient
    try {
      resolvedClient = await resolveClient()
    } catch {
      clearPrivateClientState()
      setSession(null)
      setError(text('Не удалось проверить сессию.', 'Could not verify the session.'))
      setStatus('error')
      return
    }
    const { data, error: sessionError } = await resolvedClient.auth.getSession()
    if (sessionError) {
      clearPrivateClientState()
      setSession(null)
      setError(text('Не удалось проверить сессию.', 'Could not verify the session.'))
      setStatus('error')
      return
    }
    applySession(data.session)
  }, [applySession, clearPrivateClientState, resolveClient, text])

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    void resolveClient().then(
      async (resolvedClient) => {
        if (!active) return
        const { data: authState } = resolvedClient.auth.onAuthStateChange(
          (_event, nextSession) => applySession(nextSession),
        )
        unsubscribe = () => authState.subscription.unsubscribe()

        const { data, error: sessionError } = await resolvedClient.auth.getSession()
        if (!active) return
        if (sessionError) {
          clearPrivateClientState()
          setError(
            text('Не удалось проверить сессию.', 'Could not verify the session.'),
          )
          setStatus('error')
        } else {
          applySession(data.session)
        }
      },
      () => {
        if (!active) return
        clearPrivateClientState()
        setSession(null)
        setError(text('Не удалось проверить сессию.', 'Could not verify the session.'))
        setStatus('error')
      },
    )
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [applySession, clearPrivateClientState, resolveClient, text])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ...(session?.user ? { user: session.user } : {}),
      ...(error ? { error } : {}),
      refreshSession: loadSession,
      async signInWithEmail(email, returnTo) {
        const resolvedClient = await resolveClient()
        sessionStorage.setItem(authReturnStorageKey, safeReturnTo(returnTo))
        sessionStorage.removeItem(legacyAuthReturnStorageKey)
        const { error: signInError } = await resolvedClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: true,
          },
        })
        if (signInError)
          throw new Error(
            text(
              'Не удалось отправить ссылку для входа.',
              'Could not send the sign-in link.',
            ),
          )
      },
      async signOut() {
        const resolvedClient = await resolveClient()
        const { error: signOutError } = await resolvedClient.auth.signOut({
          scope: 'local',
        })
        if (signOutError)
          throw new Error(
            text('Не удалось безопасно выйти.', 'Could not sign out safely.'),
          )
        clearPrivateClientState()
        applySession(null)
      },
    }),
    [
      applySession,
      clearPrivateClientState,
      error,
      loadSession,
      resolveClient,
      session,
      status,
      text,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  return (
    value ?? {
      status: 'guest',
      refreshSession: () => Promise.resolve(),
      signInWithEmail: () => Promise.reject(new Error('Auth provider is unavailable')),
      signOut: () => Promise.resolve(),
    }
  )
}
