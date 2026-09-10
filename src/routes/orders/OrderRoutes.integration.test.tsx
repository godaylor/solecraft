import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { createAppRoutes } from '../../app/router/createAppRouter'
import type {
  OrderPage,
  OrderRepository,
} from '../../entities/order/api/OrderRepository'
import type { OrderDetail, OrderSummary } from '../../entities/order/model/order'

vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { id: 'owner-1', email: 'owner@example.test' },
  }),
}))

const summary: OrderSummary = {
  orderNumber: 'PARA-AAAAAAAAAAAA',
  status: 'placed',
  currency: 'RUB',
  totalMinor: 1071000,
  placedAt: '2026-08-28T08:15:00Z',
}

const detail: OrderDetail = {
  ...summary,
  subtotalMinor: 1022000,
  deliveryMinor: 49000,
  items: [
    {
      productName: 'Signal 01 snapshot',
      brandName: 'Север',
      sku: 'PARA-SNAPSHOT-42',
      size: '42',
      color: 'Асфальт',
      unitPriceMinor: 1022000,
      quantity: 1,
      lineTotalMinor: 1022000,
    },
  ],
  delivery: {
    recipientName: 'Анна Пара',
    city: 'Москва',
    addressLine: 'Очень длинная тестовая улица, дом 7, квартира 42',
    postalCode: '101000',
  },
}

function renderOrders(path: string, repository: OrderRepository) {
  const router = createMemoryRouter(
    createAppRoutes({
      catalogRepository: { list: () => Promise.reject(new Error('not used')) },
      orderRepository: repository,
    }),
    { initialEntries: [path] },
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

function repositoryWith(page: OrderPage): OrderRepository {
  return {
    getOrders: () => Promise.resolve(page),
    getOrder: () => Promise.resolve(detail),
  }
}

describe('account order routes', () => {
  it('shows loading and then an actionable empty state', async () => {
    let resolvePage!: (page: OrderPage) => void
    const pending = new Promise<OrderPage>((resolve) => {
      resolvePage = resolve
    })
    renderOrders('/account/orders', {
      getOrders: () => pending,
      getOrder: () => Promise.resolve(null),
    })
    expect(
      await screen.findByRole('status', { name: 'Загружаем заказы' }),
    ).toBeVisible()
    resolvePage({ orders: [], total: 0, page: 1, pageSize: 4 })
    expect(
      await screen.findByRole('heading', { name: 'Заказов пока нет' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Перейти в каталог' })).toBeVisible()
  })

  it('offers retry on list failure', async () => {
    renderOrders('/account/orders', {
      getOrders: () => Promise.reject(new Error('offline')),
      getOrder: () => Promise.resolve(null),
    })
    expect(
      await screen.findByRole('heading', { name: 'История временно недоступна' }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeVisible()
  })

  it('keeps pagination in the URL and supports direct page navigation', async () => {
    const getOrders = vi.fn((page: number, pageSize: number) =>
      Promise.resolve({
        orders: [{ ...summary, orderNumber: `PARA-PAGE${page}AAAAAAA` }],
        total: 5,
        page,
        pageSize,
      }),
    )
    const router = renderOrders('/account/orders', {
      getOrders,
      getOrder: () => Promise.resolve(null),
    })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('link', { name: 'Следующая' }))
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/account/orders?page=2',
    )
    expect(await screen.findByText('SOLECRAFT-PAGE2AAAAAAA')).toBeVisible()
    expect(getOrders).toHaveBeenCalledWith(2, 4)
  })

  it('renders immutable item and delivery snapshots on a direct detail URL', async () => {
    renderOrders(
      '/account/orders/PARA-AAAAAAAAAAAA',
      repositoryWith({
        orders: [summary],
        total: 1,
        page: 1,
        pageSize: 4,
      }),
    )
    expect(await screen.findByRole('heading', { name: 'Детали заказа' })).toBeVisible()
    expect(screen.getByText('Signal 01 snapshot', { exact: false })).toBeVisible()
    expect(screen.getByText('SKU SOLECRAFT-SNAPSHOT-42 × 1')).toBeVisible()
    expect(screen.getByText(/Очень длинная тестовая улица/)).toBeVisible()
  })

  it('fails closed for an unknown or forbidden direct order number', async () => {
    renderOrders('/account/orders/PARA-FOREIGN00000', {
      getOrders: () => Promise.resolve({ orders: [], total: 0, page: 1, pageSize: 4 }),
      getOrder: () => Promise.resolve(null),
    })
    expect(
      await screen.findByRole('heading', { name: 'Заказ недоступен' }),
    ).toBeVisible()
    expect(screen.getByText(/неизвестный и чужой номер/)).toBeVisible()
  })
})
