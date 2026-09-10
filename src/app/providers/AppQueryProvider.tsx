import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

type AppQueryProviderProps = {
  client: QueryClient
  children: ReactNode
}

export function AppQueryProvider({ client, children }: AppQueryProviderProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
