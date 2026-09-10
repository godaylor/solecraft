import type { Money } from '../../entities/product/model/product'

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(money: Money, locale = 'ru-RU'): string {
  if (!Number.isSafeInteger(money.amountMinor)) {
    throw new Error('Money amount must be an integer in minor units')
  }

  const key = `${locale}:${money.currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
      maximumFractionDigits: 0,
    })
    formatters.set(key, formatter)
  }
  return formatter.format(money.amountMinor / 100)
}
