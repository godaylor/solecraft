import { QueryClient } from '@tanstack/react-query'

import { CatalogRepositoryError } from '../../entities/product/api/CatalogRepository'

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry(failureCount, error) {
          if (error instanceof CatalogRepositoryError && !error.retryable) {
            return false
          }

          return failureCount < 1
        },
        refetchOnWindowFocus: true,
      },
    },
  })
}
