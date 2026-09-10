import type { PublicSupabaseClient } from '../../../shared/api/supabaseClient'
import { OrderRepositoryError, type OrderRepository } from './OrderRepository'
import type {
  OrderDeliverySnapshot,
  OrderDetail,
  OrderReceiptItem,
  OrderSummary,
} from '../model/order'

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new OrderRepositoryError(`Invalid order ${field}`)
  return Number(value)
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value)
    throw new OrderRepositoryError(`Invalid order ${field}`)
  return value
}

function currency(value: unknown): 'RUB' {
  if (value !== 'RUB') throw new OrderRepositoryError('Invalid order currency')
  return value
}

function mapSummary(row: Record<string, unknown>): OrderSummary {
  return {
    orderNumber: text(row.order_number, 'order number'),
    status: text(row.status, 'status'),
    currency: currency(row.currency),
    totalMinor: integer(row.total_minor, 'total'),
    placedAt: text(row.placed_at, 'placed date'),
  }
}

function mapItem(row: Record<string, unknown>): OrderReceiptItem {
  return {
    productName: text(row.product_name_snapshot, 'product snapshot'),
    brandName: text(row.brand_name_snapshot, 'brand snapshot'),
    sku: text(row.sku_snapshot, 'SKU snapshot'),
    size: text(row.size_snapshot, 'size snapshot'),
    color: text(row.color_snapshot, 'color snapshot'),
    unitPriceMinor: integer(row.unit_price_minor, 'unit price'),
    quantity: integer(row.quantity, 'quantity'),
    lineTotalMinor: integer(row.line_total_minor, 'line total'),
  }
}

function mapDelivery(row: Record<string, unknown>): OrderDeliverySnapshot {
  return {
    recipientName: text(row.recipient_name, 'recipient snapshot'),
    city: text(row.city, 'city snapshot'),
    addressLine: text(row.address_line, 'address snapshot'),
    ...(typeof row.postal_code === 'string' && row.postal_code
      ? { postalCode: row.postal_code }
      : {}),
  }
}

export function createSupabaseOrderRepository(
  client: PublicSupabaseClient,
): OrderRepository {
  return {
    async getOrders(page, pageSize) {
      const from = (page - 1) * pageSize
      const { data, error, count } = await client
        .from('orders')
        .select('order_number,status,currency,total_minor,placed_at', {
          count: 'exact',
        })
        .order('placed_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) throw new OrderRepositoryError(`Order history failed (${error.code})`)
      return {
        orders: data.map((row) => mapSummary(row)),
        total: count ?? 0,
        page,
        pageSize,
      }
    },
    async getOrder(orderNumber) {
      const { data: order, error } = await client
        .from('orders')
        .select(
          'id,order_number,status,currency,subtotal_minor,delivery_minor,total_minor,placed_at',
        )
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (error) throw new OrderRepositoryError(`Order detail failed (${error.code})`)
      if (!order) return null

      const [itemsResult, addressResult] = await Promise.all([
        client
          .from('order_items')
          .select(
            'product_name_snapshot,brand_name_snapshot,sku_snapshot,size_snapshot,color_snapshot,unit_price_minor,quantity,line_total_minor',
          )
          .eq('order_id', order.id)
          .order('id'),
        client
          .from('order_addresses')
          .select('recipient_name,city,address_line,postal_code')
          .eq('order_id', order.id)
          .maybeSingle(),
      ])
      if (itemsResult.error || addressResult.error || !addressResult.data)
        throw new OrderRepositoryError('Order snapshots are unavailable')

      const summary = mapSummary(order)
      const detail: OrderDetail = {
        ...summary,
        subtotalMinor: integer(order.subtotal_minor, 'subtotal'),
        deliveryMinor: integer(order.delivery_minor, 'delivery'),
        items: itemsResult.data.map((row) => mapItem(row)),
        delivery: mapDelivery(addressResult.data),
      }
      return detail
    },
  }
}
