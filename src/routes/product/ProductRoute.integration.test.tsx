import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { createAppRoutes } from '../../app/router/createAppRouter'
import type { CartHandoff } from '../../entities/cart/model/cartHandoff'
import type { ProductRepository } from '../../entities/product/api/ProductRepository'
import type { ProductDetails } from '../../entities/product/model/product'
import { resolveProductVariant } from './productVariant'

const product: ProductDetails = {
  id: 'product-1',
  slug: 'signal-01',
  model: 'Signal 01',
  title: 'Signal 01',
  description: 'Городская пара для длинного маршрута.',
  brand: { id: 'brand-1', slug: 'sever', name: 'Север' },
  category: { id: 'category-1', slug: 'city', name: 'Город' },
  fit: {
    width: 'standard',
    cushioning: 'soft',
    support: 'balanced',
    note: 'true_to_size',
    provenance: 'editorial_demo',
    sourceNote: 'Демо-каталог',
    reviewedAt: '2026-08-01',
  },
  useCases: [{ slug: 'all-day', label: 'Весь день' }],
  variants: [
    {
      id: 'variant-default',
      slug: 'signal-01-blue',
      color: { slug: 'blue', name: 'Синий', code: '#1F5EFF' },
      price: { amountMinor: 1299000, currency: 'RUB' },
      isDefault: true,
      media: [
        {
          id: 'media-blue',
          kind: 'catalog',
          src: '/img/1.jpg',
          alt: 'Signal 01, синий',
          width: 266,
          height: 224,
          position: 0,
        },
      ],
      inventory: [
        {
          inventoryId: 'inventory-blue-40',
          sku: 'PARA-BLUE-40',
          stock: 0,
          sizeId: 'size-40',
          sizeLabel: '40',
          sizeValue: 40,
          sortOrder: 1,
        },
        {
          inventoryId: 'inventory-blue-41',
          sku: 'PARA-BLUE-41',
          stock: 2,
          sizeId: 'size-41',
          sizeLabel: '41',
          sizeValue: 41,
          sortOrder: 2,
        },
      ],
    },
    {
      id: 'variant-red',
      slug: 'signal-01-red',
      color: { slug: 'red', name: 'Красный', code: '#C43D2F' },
      price: { amountMinor: 1349000, currency: 'RUB' },
      isDefault: false,
      media: [
        {
          id: 'media-red',
          kind: 'catalog',
          src: '/img/2.jpg',
          alt: 'Signal 01, красный',
          width: 266,
          height: 224,
          position: 0,
        },
      ],
      inventory: [
        {
          inventoryId: 'inventory-red-42',
          sku: 'PARA-RED-42',
          stock: 5,
          sizeId: 'size-42',
          sizeLabel: '42',
          sizeValue: 42,
          sortOrder: 3,
        },
      ],
    },
  ],
  sizeGuide: [
    {
      sizeId: 'size-42',
      sizeLabel: '42',
      sizeValue: 42,
      sortOrder: 3,
      footLengthMinMm: 265,
      footLengthMaxMm: 270,
      provenance: 'manufacturer',
      sourceNote: 'Таблица бренда',
      reviewedAt: '2026-08-01',
    },
  ],
}

function renderProduct(entry: string, cartHandoff: CartHandoff) {
  const repository: ProductRepository = { getBySlug: () => Promise.resolve(product) }
  const router = createMemoryRouter(
    createAppRoutes({
      catalogRepository: { list: () => Promise.reject(new Error('not used')) },
      productRepository: repository,
      cartHandoff,
    }),
    { initialEntries: [entry] },
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('ProductRoute', () => {
  it('resolves default, valid and invalid color state canonically', () => {
    expect(resolveProductVariant(product, null)).toMatchObject({
      variant: { id: 'variant-default' },
      canonicalColor: null,
    })
    expect(resolveProductVariant(product, 'red')).toMatchObject({
      variant: { id: 'variant-red' },
      canonicalColor: 'red',
    })
    expect(resolveProductVariant(product, 'missing')).toMatchObject({
      variant: { id: 'variant-default' },
      canonicalColor: null,
    })
  })

  it('switches color in URL, resets size and hands off the exact inventory identity', async () => {
    const user = userEvent.setup()
    const add = vi.fn<CartHandoff['add']>()
    const router = renderProduct('/products/signal-01?color=missing', { add })

    expect(await screen.findByRole('heading', { name: 'Signal 01' })).toBeVisible()
    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(screen.getByRole('button', { name: '40' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Красный/ }))
    expect(router.state.location.search).toBe('?color=red')
    await user.click(screen.getByRole('button', { name: '42' }))
    await user.click(screen.getByRole('button', { name: 'Добавить точный размер' }))

    expect(add).toHaveBeenCalledWith({
      inventoryId: 'inventory-red-42',
      sku: 'PARA-RED-42',
      quantity: 1,
      maxQuantity: 5,
    })
    expect(screen.getByRole('status')).toHaveTextContent('EU 42, Красный добавлен')
  })
})
