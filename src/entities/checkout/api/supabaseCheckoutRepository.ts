import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import { CheckoutError, type CheckoutRepository } from './CheckoutRepository'
import type { OrderReceipt, OrderReceiptItem } from '../model/checkout'

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new CheckoutError('backend', `Invalid receipt ${field}`)
  return Number(value)
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value)
    throw new CheckoutError('backend', `Invalid receipt ${field}`)
  return value
}

function mapItems(value: unknown): OrderReceiptItem[] {
  if (!Array.isArray(value)) throw new CheckoutError('backend', 'Invalid receipt items')
  return value.map((raw) => {
    const item = raw as Record<string, unknown>
    return {
      productName: text(item.productName, 'productName'),
      brandName: text(item.brandName, 'brandName'),
      sku: text(item.sku, 'sku'),
      size: text(item.size, 'size'),
      color: text(item.color, 'color'),
      unitPriceMinor: integer(item.unitPriceMinor, 'unitPriceMinor'),
      quantity: integer(item.quantity, 'quantity'),
      lineTotalMinor: integer(item.lineTotalMinor, 'lineTotalMinor'),
    }
  })
}

function mapReceipt(value: unknown): OrderReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CheckoutError('backend', 'Invalid receipt')
  const receipt = value as Record<string, unknown>
  const currency = text(receipt.currency, 'currency')
  if (currency !== 'RUB') throw new CheckoutError('backend', 'Invalid receipt currency')
  return {
    orderNumber: text(receipt.orderNumber, 'orderNumber'),
    status: text(receipt.status, 'status'),
    currency,
    subtotalMinor: integer(receipt.subtotalMinor, 'subtotalMinor'),
    deliveryMinor: integer(receipt.deliveryMinor, 'deliveryMinor'),
    totalMinor: integer(receipt.totalMinor, 'totalMinor'),
    placedAt: text(receipt.placedAt, 'placedAt'),
    items: mapItems(receipt.items),
  }
}

function mapRpcError(message: string): CheckoutError {
  if (message.includes('demo_payment_declined'))
    return new CheckoutError('declined', 'Демо-платёж отклонён.')
  if (message.includes('demo_payment_timeout'))
    return new CheckoutError('timeout', 'Демо-платёж не ответил вовремя.')
  if (message.includes('stock_conflict:'))
    return new CheckoutError(
      'conflict',
      'Остаток изменился.',
      message.split('stock_conflict:')[1]?.split(/\s/)[0],
    )
  if (message.includes('invalid_') || message.includes('empty_checkout'))
    return new CheckoutError('validation', 'Проверьте данные заказа.')
  return new CheckoutError('backend', 'Не удалось создать заказ.')
}

export function createSupabaseCheckoutRepository(
  client: PublicSupabaseClient,
): CheckoutRepository {
  return {
    async createOrder({ lines, draft }) {
      const { data, error } = await client.rpc('create_order', {
        p_lines: lines.map((line) => ({
          inventoryId: line.inventoryId,
          quantity: line.quantity,
        })),
        p_contact: draft.contact,
        p_delivery: draft.delivery,
        p_payment_scenario: draft.payment,
        p_idempotency_key: draft.idempotencyKey,
      })
      if (error) throw mapRpcError(error.message)
      const result = data as Record<string, unknown>
      return {
        orderNumber: text(result.orderNumber, 'orderNumber'),
        userOwned: result.userOwned === true,
        ...(typeof result.receiptToken === 'string'
          ? { receiptToken: result.receiptToken }
          : {}),
        idempotentReplay: result.idempotentReplay === true,
      }
    },
    async readGuestReceipt(orderNumber, token) {
      const { data, error } = await client.rpc('read_guest_receipt', {
        p_order_number: orderNumber,
        p_token: token,
      })
      if (error || data === null) return null
      return mapReceipt(data)
    },
    async readOwnerReceipt(orderNumber) {
      const { data: order, error } = await client
        .from('orders')
        .select(
          'id,order_number,status,currency,subtotal_minor,delivery_minor,total_minor,placed_at',
        )
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (error || !order) return null
      const { data: items, error: itemsError } = await client
        .from('order_items')
        .select(
          'product_name_snapshot,brand_name_snapshot,sku_snapshot,size_snapshot,color_snapshot,unit_price_minor,quantity,line_total_minor',
        )
        .eq('order_id', order.id)
        .order('id')
      if (itemsError) throw new CheckoutError('backend', 'Не удалось прочитать заказ.')
      return mapReceipt({
        orderNumber: order.order_number,
        status: order.status,
        currency: order.currency,
        subtotalMinor: order.subtotal_minor,
        deliveryMinor: order.delivery_minor,
        totalMinor: order.total_minor,
        placedAt: order.placed_at,
        items: items.map((item) => ({
          productName: item.product_name_snapshot,
          brandName: item.brand_name_snapshot,
          sku: item.sku_snapshot,
          size: item.size_snapshot,
          color: item.color_snapshot,
          unitPriceMinor: item.unit_price_minor,
          quantity: item.quantity,
          lineTotalMinor: item.line_total_minor,
        })),
      })
    },
  }
}
