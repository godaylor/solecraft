const prefix = 'solecraft:guest-receipt:'
const legacyPrefix = 'para:guest-receipt:'

export function saveReceiptCapability(orderNumber: string, token: string): void {
  sessionStorage.setItem(`${prefix}${orderNumber}`, token)
}

export function readReceiptCapability(orderNumber: string): string | undefined {
  const current = sessionStorage.getItem(`${prefix}${orderNumber}`)
  if (current) return current

  const legacyKey = `${legacyPrefix}${orderNumber}`
  const legacy = sessionStorage.getItem(legacyKey)
  if (!legacy) return undefined
  sessionStorage.setItem(`${prefix}${orderNumber}`, legacy)
  sessionStorage.removeItem(legacyKey)
  return legacy
}

export function removeReceiptCapability(orderNumber: string): void {
  sessionStorage.removeItem(`${prefix}${orderNumber}`)
  sessionStorage.removeItem(`${legacyPrefix}${orderNumber}`)
}
