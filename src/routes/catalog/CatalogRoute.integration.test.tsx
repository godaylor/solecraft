import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { createAppRoutes } from '../../app/router/createAppRouter'
import type {
  CatalogPage,
  CatalogRepository,
} from '../../entities/product/api/CatalogRepository'
import { fixtureProducts } from '../../entities/product/api/fixtureCatalogRepository'

function catalogPage(products = fixtureProducts): CatalogPage {
  return {
    products,
    page: 1,
    pageSize: 12,
    total: products.length,
    totalPages: 1,
  }
}

function renderCatalog(repository: CatalogRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  const router = createMemoryRouter(
    createAppRoutes({ catalogRepository: repository }),
    { initialEntries: ['/catalog'] },
  )

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

describe('CatalogRoute states', () => {
  it('keeps a card-shaped loading grid until data resolves', async () => {
    let resolvePage: ((page: CatalogPage) => void) | undefined
    const pendingPage = new Promise<CatalogPage>((resolve) => {
      resolvePage = resolve
    })

    renderCatalog({ list: () => pendingPage })

    expect(await screen.findByLabelText('Загрузка товаров')).toHaveAttribute(
      'aria-busy',
      'true',
    )

    resolvePage?.(catalogPage())

    expect(await screen.findByText('Signal 01')).toBeInTheDocument()
  })

  it('distinguishes an empty published catalog', async () => {
    renderCatalog({ list: () => Promise.resolve(catalogPage([])) })

    expect(
      await screen.findByRole('heading', { name: 'Каталог пока пуст' }),
    ).toBeVisible()
  })

  it('retries without changing the current route', async () => {
    const user = userEvent.setup()
    const list = vi
      .fn<CatalogRepository['list']>()
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValueOnce(catalogPage())

    renderCatalog({ list })

    await user.click(await screen.findByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Signal 01')).toBeVisible()
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('keeps successful cards visible when a background refresh fails', async () => {
    const list = vi
      .fn<CatalogRepository['list']>()
      .mockResolvedValueOnce(catalogPage())
      .mockRejectedValueOnce(new Error('background unavailable'))
    const { queryClient } = renderCatalog({ list })

    expect(await screen.findByText('Signal 01')).toBeVisible()
    await queryClient.invalidateQueries({ queryKey: ['catalog'] })

    expect(await screen.findByText('Не удалось обновить данные')).toBeVisible()
    expect(screen.getByText('Signal 01')).toBeVisible()
  })

  it('explains a failed new URL query while keeping placeholder cards visible', async () => {
    const list = vi.fn<CatalogRepository['list']>((params) =>
      params.q ? Promise.reject(new Error('offline')) : Promise.resolve(catalogPage()),
    )
    const { queryClient, router } = renderCatalog({ list })

    expect(await screen.findByText('Signal 01')).toBeVisible()
    await act(() => router.navigate('/catalog?q=offline'))

    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .getAll()
          .some(
            (query) =>
              query.state.status === 'error' &&
              JSON.stringify(query.queryKey).includes('offline'),
          ),
      ).toBe(true),
    )
    expect(await screen.findByText('Не удалось обновить данные')).toBeVisible()
    expect(screen.getByText('Signal 01')).toBeVisible()
    expect(list).toHaveBeenCalled()
  })
})
