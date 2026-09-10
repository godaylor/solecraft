import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { CatalogPageParams, CatalogRepository } from './CatalogRepository'

export const catalogKeys = {
  all: ['catalog'] as const,
  page(params: CatalogPageParams) {
    return [
      ...this.all,
      'page',
      {
        ...params,
        brands: [...params.brands],
        uses: [...params.uses],
        colors: [...params.colors],
      },
    ] as const
  },
}

export function catalogPageQueryOptions(
  repository: CatalogRepository,
  params: CatalogPageParams,
) {
  return queryOptions({
    queryKey: catalogKeys.page(params),
    queryFn: ({ signal }) => repository.list(params, { signal }),
    placeholderData: keepPreviousData,
  })
}
