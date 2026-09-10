import type {
  CreateOrderInput,
  CreateOrderResult,
  OrderReceipt,
} from '../model/checkout'

export type CheckoutErrorKind =
  'declined' | 'timeout' | 'conflict' | 'validation' | 'backend'

export class CheckoutError extends Error {
  constructor(
    readonly kind: CheckoutErrorKind,
    message: string,
    readonly affectedInventoryId?: string,
  ) {
    super(message)
    this.name = 'CheckoutError'
  }
}

export interface CheckoutRepository {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  readGuestReceipt(orderNumber: string, token: string): Promise<OrderReceipt | null>
  readOwnerReceipt(orderNumber: string): Promise<OrderReceipt | null>
}
