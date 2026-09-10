export const freeDeliveryThresholdMinor = 1_500_000
export const standardDeliveryMinor = 49_000

export function calculateCartTotals(subtotalMinor: number) {
  const safeSubtotal = Math.max(0, Math.trunc(subtotalMinor))
  const deliveryMinor =
    safeSubtotal === 0 || safeSubtotal >= freeDeliveryThresholdMinor
      ? 0
      : standardDeliveryMinor
  return {
    subtotalMinor: safeSubtotal,
    deliveryMinor,
    estimatedTotalMinor: safeSubtotal + deliveryMinor,
  }
}
