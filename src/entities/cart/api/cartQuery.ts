import { queryOptions } from '@tanstack/react-query'

import type { CartRepository } from './CartRepository'

export const cartKeys = {
  all: ['cart'] as const,
  inventory(inventoryIds: readonly string[]) {
    return [...this.all, 'inventory', [...inventoryIds].sort()] as const
  },
}

export function cartInventoryQueryOptions(
  repository: CartRepository,
  inventoryIds: readonly string[],
) {
  return queryOptions({
    queryKey: cartKeys.inventory(inventoryIds),
    queryFn: ({ signal }) => repository.getInventory(inventoryIds, { signal }),
    enabled: inventoryIds.length > 0,
  })
}
