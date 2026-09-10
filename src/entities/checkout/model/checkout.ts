import type { GuestCartLine } from '../../cart/model/guestCartStore'

export type CheckoutStep = 'contact' | 'delivery' | 'payment' | 'review'
export type DemoPaymentScenario = 'demo_success' | 'demo_decline' | 'demo_timeout'

export type CheckoutDraft = {
  contact?: { email: string; phone?: string }
  delivery?: {
    recipientName: string
    city: string
    addressLine: string
    postalCode?: string
  }
  payment?: DemoPaymentScenario
  idempotencyKey: string
}

export type CheckoutValidationErrors = Record<string, string>

export function createCheckoutDraft(): CheckoutDraft {
  return { idempotencyKey: crypto.randomUUID() }
}

export function safeCheckoutDraft(value: unknown): CheckoutDraft {
  if (!value || typeof value !== 'object') return createCheckoutDraft()
  const draft = value as Partial<CheckoutDraft>
  const idempotencyKey =
    typeof draft.idempotencyKey === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      draft.idempotencyKey,
    )
      ? draft.idempotencyKey
      : crypto.randomUUID()
  return {
    idempotencyKey,
    ...(draft.contact && typeof draft.contact.email === 'string'
      ? {
          contact: {
            email: draft.contact.email.slice(0, 254),
            ...(typeof draft.contact.phone === 'string'
              ? { phone: draft.contact.phone.slice(0, 32) }
              : {}),
          },
        }
      : {}),
    ...(draft.delivery &&
    typeof draft.delivery.recipientName === 'string' &&
    typeof draft.delivery.city === 'string' &&
    typeof draft.delivery.addressLine === 'string'
      ? {
          delivery: {
            recipientName: draft.delivery.recipientName.slice(0, 120),
            city: draft.delivery.city.slice(0, 120),
            addressLine: draft.delivery.addressLine.slice(0, 240),
            ...(typeof draft.delivery.postalCode === 'string'
              ? { postalCode: draft.delivery.postalCode.slice(0, 16) }
              : {}),
          },
        }
      : {}),
    ...(draft.payment &&
    ['demo_success', 'demo_decline', 'demo_timeout'].includes(draft.payment)
      ? { payment: draft.payment }
      : {}),
  }
}

export function validateContact(
  contact: CheckoutDraft['contact'],
  locale: 'ru' | 'en' = 'ru',
): CheckoutValidationErrors {
  const errors: CheckoutValidationErrors = {}
  if (!contact?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
    errors.email =
      locale === 'ru' ? 'Введите корректный email.' : 'Enter a valid email.'
  if (contact?.phone && !/^[+\d][\d\s()-]{4,31}$/.test(contact.phone))
    errors.phone =
      locale === 'ru' ? 'Проверьте формат телефона.' : 'Check the phone format.'
  return errors
}

export function validateDelivery(
  delivery: CheckoutDraft['delivery'],
  locale: 'ru' | 'en' = 'ru',
): CheckoutValidationErrors {
  const errors: CheckoutValidationErrors = {}
  if (!delivery?.recipientName || delivery.recipientName.trim().length < 2)
    errors.recipientName =
      locale === 'ru' ? 'Укажите получателя.' : 'Enter the recipient name.'
  if (!delivery?.city || delivery.city.trim().length < 2)
    errors.city = locale === 'ru' ? 'Укажите город.' : 'Enter a city.'
  if (!delivery?.addressLine || delivery.addressLine.trim().length < 5)
    errors.addressLine =
      locale === 'ru' ? 'Укажите полный адрес.' : 'Enter the full address.'
  return errors
}

export function firstAllowedCheckoutStep(draft: CheckoutDraft): CheckoutStep {
  if (Object.keys(validateContact(draft.contact)).length) return 'contact'
  if (Object.keys(validateDelivery(draft.delivery)).length) return 'delivery'
  if (!draft.payment) return 'payment'
  return 'review'
}

export type CreateOrderInput = {
  lines: readonly GuestCartLine[]
  draft: Required<
    Pick<CheckoutDraft, 'contact' | 'delivery' | 'payment' | 'idempotencyKey'>
  >
}

export type CreateOrderResult = {
  orderNumber: string
  userOwned: boolean
  receiptToken?: string
  idempotentReplay: boolean
}

export type OrderReceiptItem = {
  productName: string
  brandName: string
  sku: string
  size: string
  color: string
  unitPriceMinor: number
  quantity: number
  lineTotalMinor: number
}

export type OrderReceipt = {
  orderNumber: string
  status: string
  currency: 'RUB'
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  placedAt: string
  items: OrderReceiptItem[]
}
