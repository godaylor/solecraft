import { beforeEach, describe, expect, it } from 'vitest'

import {
  applyGuestCartStorageEvent,
  guestCartStorageKey,
  guestCartVersion,
  sanitizeGuestCartState,
  useGuestCartStore,
} from './guestCartStore'

beforeEach(() => {
  localStorage.clear()
  useGuestCartStore.setState({ lines: [], updatedAt: '2026-08-28T00:00:00.000Z' })
})

describe('guest cart persistence', () => {
  it('stores only exact inventory identity, quantity and safe timestamps', () => {
    useGuestCartStore
      .getState()
      .add({ inventoryId: 'inventory-1', sku: 'DO-NOT-PERSIST', quantity: 1 })
    useGuestCartStore
      .getState()
      .add({ inventoryId: 'inventory-1', sku: 'CHANGED', quantity: 2 })

    expect(useGuestCartStore.getState().lines).toMatchObject([
      { inventoryId: 'inventory-1', quantity: 3 },
    ])
    const persisted = localStorage.getItem(guestCartStorageKey) ?? ''
    expect(persisted).not.toContain('DO-NOT-PERSIST')
    expect(persisted).not.toContain('CHANGED')
  })

  it('fails closed on corrupt/unknown persistence and clamps reconciliation to stock', () => {
    expect(sanitizeGuestCartState('bad')).toMatchObject({ lines: [] })
    expect(
      sanitizeGuestCartState({ lines: [{ inventoryId: '', quantity: 99 }] }),
    ).toMatchObject({ lines: [] })

    useGuestCartStore
      .getState()
      .add({ inventoryId: 'inventory-1', sku: 'SKU', quantity: 5 })
    useGuestCartStore.getState().reconcile([{ inventoryId: 'inventory-1', stock: 2 }])
    expect(useGuestCartStore.getState().lines[0]?.quantity).toBe(2)
  })

  it('supports remove/undo/clear and last-write-wins cross-tab sync', () => {
    useGuestCartStore
      .getState()
      .add({ inventoryId: 'inventory-1', sku: 'SKU', quantity: 1 })
    const removed = useGuestCartStore.getState().remove('inventory-1')
    expect(useGuestCartStore.getState().lines).toEqual([])
    useGuestCartStore.getState().restore(removed!)
    expect(useGuestCartStore.getState().lines).toHaveLength(1)

    const incoming = JSON.stringify({
      version: guestCartVersion,
      state: {
        lines: [
          {
            inventoryId: 'inventory-2',
            quantity: 4,
            updatedAt: '2030-01-01T00:00:00.000Z',
          },
        ],
        updatedAt: '2030-01-01T00:00:00.000Z',
      },
    })
    applyGuestCartStorageEvent(
      new StorageEvent('storage', { key: guestCartStorageKey, newValue: incoming }),
    )
    expect(useGuestCartStore.getState().lines).toMatchObject([
      { inventoryId: 'inventory-2', quantity: 4 },
    ])
    useGuestCartStore.getState().clear()
    expect(useGuestCartStore.getState().lines).toEqual([])
  })
})
