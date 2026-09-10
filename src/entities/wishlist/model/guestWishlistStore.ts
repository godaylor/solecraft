import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { migrateStorageKey } from '../../../shared/config/storageKeys'

export const guestWishlistStorageKey = 'solecraft:guest-wishlist'
export const legacyGuestWishlistStorageKey = 'para:guest-wishlist'

if (typeof window !== 'undefined') {
  migrateStorageKey(window.localStorage, guestWishlistStorageKey, [
    legacyGuestWishlistStorageKey,
  ])
}

type GuestWishlistState = {
  productIds: string[]
  updatedAt: string
  toggle: (productId: string) => void
  consumeMerged: (snapshot: readonly string[]) => void
  clear: () => void
}

function safeState(value: unknown) {
  if (!value || typeof value !== 'object')
    return { productIds: [], updatedAt: new Date().toISOString() }
  const candidate = value as { productIds?: unknown; updatedAt?: unknown }
  return {
    productIds: Array.isArray(candidate.productIds)
      ? [
          ...new Set(
            candidate.productIds.filter(
              (id): id is string => typeof id === 'string' && id.length > 0,
            ),
          ),
        ].slice(0, 200)
      : [],
    updatedAt:
      typeof candidate.updatedAt === 'string' &&
      Number.isFinite(Date.parse(candidate.updatedAt))
        ? candidate.updatedAt
        : new Date().toISOString(),
  }
}

export const useGuestWishlistStore = create<GuestWishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      updatedAt: new Date().toISOString(),
      toggle(productId) {
        if (!productId) return
        set({
          productIds: get().productIds.includes(productId)
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
          updatedAt: new Date().toISOString(),
        })
      },
      consumeMerged(snapshot) {
        const merged = new Set(snapshot)
        set({
          productIds: get().productIds.filter((id) => !merged.has(id)),
          updatedAt: new Date().toISOString(),
        })
      },
      clear() {
        set({ productIds: [], updatedAt: new Date().toISOString() })
      },
    }),
    {
      name: guestWishlistStorageKey,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ productIds, updatedAt }) => ({ productIds, updatedAt }),
      migrate: safeState,
      merge: (persisted, current) => ({ ...current, ...safeState(persisted) }),
    },
  ),
)
