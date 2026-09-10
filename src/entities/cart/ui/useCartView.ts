import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import type { CartRepository } from '../api/CartRepository'
import { cartInventoryQueryOptions } from '../api/cartQuery'
import { useCommerce } from '../../../app/providers/CommerceProvider'
import { useGuestCartStore } from '../model/guestCartStore'

export function useCartView(repository: CartRepository) {
  const { cartLines: lines } = useCommerce()
  const inventoryIds = useMemo(() => lines.map((line) => line.inventoryId), [lines])
  const query = useQuery(cartInventoryQueryOptions(repository, inventoryIds))
  const records = query.data ?? []

  useEffect(() => {
    if (query.data) useGuestCartStore.getState().reconcile(query.data)
  }, [query.data])

  const entries = lines.map((line) => ({
    line,
    record: records.find((record) => record.inventoryId === line.inventoryId),
  }))
  const subtotal = entries.reduce(
    (sum, entry) => sum + (entry.record?.price.amountMinor ?? 0) * entry.line.quantity,
    0,
  )
  return { lines, query, entries, subtotal }
}
