import type { OrderDetail, OrderSummary } from '../model/order'

export class OrderRepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderRepositoryError'
  }
}

export type OrderPage = {
  orders: OrderSummary[]
  total: number
  page: number
  pageSize: number
}

export interface OrderRepository {
  getOrders(page: number, pageSize: number): Promise<OrderPage>
  getOrder(orderNumber: string): Promise<OrderDetail | null>
}
