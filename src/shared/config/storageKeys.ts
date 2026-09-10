export const checkoutDraftStorageKey = 'solecraft:checkout-draft'
export const legacyCheckoutDraftStorageKey = 'para:checkout-draft'
export const authReturnStorageKey = 'solecraft:auth-return'
export const legacyAuthReturnStorageKey = 'para:auth-return'

export function migrateStorageKey(
  storage: Storage,
  currentKey: string,
  legacyKeys: readonly string[],
): void {
  try {
    if (storage.getItem(currentKey) !== null) return

    for (const legacyKey of legacyKeys) {
      const value = storage.getItem(legacyKey)
      if (value === null) continue
      storage.setItem(currentKey, value)
      storage.removeItem(legacyKey)
      return
    }
  } catch {
    // Existing user state remains untouched when browser storage is unavailable.
  }
}
