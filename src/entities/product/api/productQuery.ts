import { queryOptions } from '@tanstack/react-query'

import type { ProductRepository } from './ProductRepository'

export const productKeys = {
  all: ['products'] as const,
  detail(slug: string) {
    return [...this.all, 'detail', slug] as const
  },
}

export function productDetailQueryOptions(repository: ProductRepository, slug: string) {
  return queryOptions({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }) => repository.getBySlug(slug, { signal }),
  })
}
