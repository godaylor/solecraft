import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { migrateStorageKey } from '../../../shared/config/storageKeys'
import type { CartLineInput } from './cartHandoff'

export const guestCartStorageKey = 'solecraft:guest-cart'
export const legacyGuestCartStorageKey = 'para:guest-cart'
export const guestCartVersion = 1

if (typeof window !== 'undefined') {
  migrateStorageKey(window.localStorage, guestCartStorageKey, [
    legacyGuestCartStorageKey,
  ])
}

export type GuestCartLine = {
  inventoryId: string
  quantity: number
  updatedAt: string
}

type StockRecord = { inventoryId: string; stock: number }

type GuestCartState = {
  lines: GuestCartLine[]
  updatedAt: string
  add: (input: CartLineInput) => void
  setQuantity: (inventoryId: string, quantity: number) => void
  remove: (inventoryId: string) => GuestCartLine | undefined
  restore: (line: GuestCartLine) => void
  clear: () => void
  reconcile: (records: readonly StockRecord[]) => void
  consumeMerged: (snapshot: readonly GuestCartLine[]) => void
}

function now(): string {
  return new Date().toISOString()
}

function validLine(value: unknown): value is GuestCartLine {
  if (!value || typeof value !== 'object') return false
  const line = value as Partial<GuestCartLine>
  return (
    typeof line.inventoryId === 'string' &&
    line.inventoryId.length > 0 &&
    Number.isSafeInteger(line.quantity) &&
    Number(line.quantity) >= 1 &&
    Number(line.quantity) <= 10 &&
    typeof line.updatedAt === 'string' &&
    Number.isFinite(Date.parse(line.updatedAt))
  )
}

export function sanitizeGuestCartState(
  value: unknown,
): Pick<GuestCartState, 'lines' | 'updatedAt'> {
  if (!value || typeof value !== 'object') return { lines: [], updatedAt: now() }
  const candidate = value as { lines?: unknown; updatedAt?: unknown }
  const lines = Array.isArray(candidate.lines)
    ? candidate.lines.filter(validLine).slice(0, 100)
    : []
  const updatedAt =
    typeof candidate.updatedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : now()
  return { lines, updatedAt }
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      lines: [],
      updatedAt: now(),
      add(input) {
        if (!input.inventoryId || !Number.isSafeInteger(input.quantity)) return
        const timestamp = now()
        const current = get().lines.find(
          (line) => line.inventoryId === input.inventoryId,
        )
        const quantity = Math.min(
          10,
          input.maxQuantity ?? 10,
          (current?.quantity ?? 0) + input.quantity,
        )
        const line = { inventoryId: input.inventoryId, quantity, updatedAt: timestamp }
        set({
          lines: current
            ? get().lines.map((item) =>
                item.inventoryId === input.inventoryId ? line : item,
              )
            : [...get().lines, line],
          updatedAt: timestamp,
        })
      },
      setQuantity(inventoryId, requestedQuantity) {
        if (!Number.isSafeInteger(requestedQuantity)) return
        if (requestedQuantity <= 0) {
          get().remove(inventoryId)
          return
        }
        const timestamp = now()
        set({
          lines: get().lines.map((line) =>
            line.inventoryId === inventoryId
              ? {
                  ...line,
                  quantity: Math.min(10, requestedQuantity),
                  updatedAt: timestamp,
                }
              : line,
          ),
          updatedAt: timestamp,
        })
      },
      remove(inventoryId) {
        const removed = get().lines.find((line) => line.inventoryId === inventoryId)
        if (!removed) return undefined
        set({
          lines: get().lines.filter((line) => line.inventoryId !== inventoryId),
          updatedAt: now(),
        })
        return removed
      },
      restore(line) {
        if (!validLine(line)) return
        const timestamp = now()
        set({
          lines: [
            ...get().lines.filter((item) => item.inventoryId !== line.inventoryId),
            { ...line, updatedAt: timestamp },
          ],
          updatedAt: timestamp,
        })
      },
      clear() {
        set({ lines: [], updatedAt: now() })
      },
      reconcile(records) {
        const stock = new Map(
          records.map((record) => [record.inventoryId, record.stock]),
        )
        let changed = false
        const timestamp = now()
        const lines = get().lines.map((line) => {
          const available = stock.get(line.inventoryId)
          if (
            available === undefined ||
            available === 0 ||
            line.quantity <= available
          ) {
            return line
          }
          changed = true
          return {
            ...line,
            quantity: Math.max(1, Math.min(10, available)),
            updatedAt: timestamp,
          }
        })
        if (changed) set({ lines, updatedAt: timestamp })
      },
      consumeMerged(snapshot) {
        const merged = new Map(
          snapshot.map((line) => [line.inventoryId, line.updatedAt]),
        )
        const lines = get().lines.filter(
          (line) => merged.get(line.inventoryId) !== line.updatedAt,
        )
        if (lines.length !== get().lines.length) set({ lines, updatedAt: now() })
      },
    }),
    {
      name: guestCartStorageKey,
      version: guestCartVersion,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, updatedAt }) => ({ lines, updatedAt }),
      migrate: (persistedState) => sanitizeGuestCartState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizeGuestCartState(persistedState),
      }),
    },
  ),
)

export const guestCartHandoff = {
  add(input: CartLineInput) {
    useGuestCartStore.getState().add(input)
  },
}

export function applyGuestCartStorageEvent(event: StorageEvent): void {
  if (event.key !== guestCartStorageKey || !event.newValue) return
  try {
    const payload = JSON.parse(event.newValue) as { state?: unknown; version?: unknown }
    if (payload.version !== guestCartVersion) return
    const incoming = sanitizeGuestCartState(payload.state)
    if (
      Date.parse(incoming.updatedAt) <=
      Date.parse(useGuestCartStore.getState().updatedAt)
    ) {
      return
    }
    useGuestCartStore.setState(incoming)
  } catch {
    // Corrupt writes fail closed and leave the current valid cart intact.
  }
}
