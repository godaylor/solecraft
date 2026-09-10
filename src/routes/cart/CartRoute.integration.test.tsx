import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppRoutes } from '../../app/router/createAppRouter'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import { useGuestCartStore } from '../../entities/cart/model/guestCartStore'

const cartRepository: CartRepository = {
  getInventory: () =>
    Promise.resolve([
      {
        inventoryId: 'inventory-1',
        sku: 'PARA-BLACK-42',
        stock: 4,
        inventoryUpdatedAt: '2026-08-28T00:00:00Z',
        sizeId: 'size-42',
        sizeLabel: '42',
        variantId: 'variant-1',
        variantSlug: 'signal-black',
        colorSlug: 'black',
        colorName: 'Чёрный',
        price: { amountMinor: 1000000, currency: 'RUB' },
        productId: 'product-1',
        productSlug: 'sever-signal-01',
        model: 'Signal 01',
        title: 'Signal 01',
        brandName: 'Север',
      },
    ]),
}

function renderCart() {
  const router = createMemoryRouter(
    createAppRoutes({
      catalogRepository: { list: () => Promise.reject(new Error('not used')) },
      cartRepository,
    }),
    { initialEntries: ['/cart'] },
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useGuestCartStore.setState({ lines: [], updatedAt: '2026-08-28T00:00:00Z' })
  useGuestCartStore
    .getState()
    .add({ inventoryId: 'inventory-1', sku: 'PARA-BLACK-42', quantity: 1 })
})

describe('CartRoute', () => {
  it('changes quantity, removes and restores an exact SKU-aware line', async () => {
    const user = userEvent.setup()
    renderCart()
    expect(await screen.findByText('SKU SOLECRAFT-BLACK-42')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Увеличить количество' }))
    expect(screen.getByLabelText('Количество товара')).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: /Удалить позицию Signal 01/ }))
    expect(screen.getByText('Позиция удалена.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Отменить' }))
    expect(await screen.findByText('SKU SOLECRAFT-BLACK-42')).toBeVisible()
  })

  it('requires an explicit confirmation before clearing all lines', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByText('SKU SOLECRAFT-BLACK-42')
    await user.click(screen.getByRole('button', { name: 'Очистить корзину' }))
    expect(screen.getByText('Очистить всю корзину?')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Да, очистить' }))
    expect(screen.getByText('Корзина пока пуста.')).toBeVisible()
  })
})
