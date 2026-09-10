import type { OrderReceipt, OrderReceiptItem } from '../../checkout/model/checkout'

export type OrderStatus =
  'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type OrderStatusPresentation = {
  label: string
  tone: 'new' | 'active' | 'success' | 'muted'
}

const statusPresentationRu: Record<OrderStatus, OrderStatusPresentation> = {
  placed: { label: 'Принят', tone: 'new' },
  processing: { label: 'Собирается', tone: 'active' },
  shipped: { label: 'В пути', tone: 'active' },
  delivered: { label: 'Доставлен', tone: 'success' },
  cancelled: { label: 'Отменён', tone: 'muted' },
}

const statusPresentationEn: Record<OrderStatus, OrderStatusPresentation> = {
  placed: { label: 'Placed', tone: 'new' },
  processing: { label: 'Processing', tone: 'active' },
  shipped: { label: 'In transit', tone: 'active' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

export function presentOrderStatus(
  status: string,
  locale: 'ru' | 'en' = 'ru',
): OrderStatusPresentation {
  const presentations = locale === 'ru' ? statusPresentationRu : statusPresentationEn
  return status in presentations
    ? presentations[status as OrderStatus]
    : {
        label: locale === 'ru' ? 'Статус уточняется' : 'Status pending',
        tone: 'muted',
      }
}

export function formatOrderDate(value: string, locale = 'ru-RU'): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? locale === 'ru-RU'
      ? 'Дата недоступна'
      : 'Date unavailable'
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Moscow',
      }).format(date)
}

export function parseOrderPage(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export type OrderSummary = Omit<
  OrderReceipt,
  'items' | 'subtotalMinor' | 'deliveryMinor'
>

export type OrderDeliverySnapshot = {
  recipientName: string
  city: string
  addressLine: string
  postalCode?: string
}

export type OrderDetail = OrderReceipt & {
  delivery: OrderDeliverySnapshot
}

export type { OrderReceiptItem }
