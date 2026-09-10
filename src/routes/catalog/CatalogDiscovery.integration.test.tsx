import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { createAppRoutes } from '../../app/router/createAppRouter'
import type {
  CatalogPage,
  CatalogPageParams,
  CatalogRepository,
} from '../../entities/product/api/CatalogRepository'
import { fixtureProducts } from '../../entities/product/api/fixtureCatalogRepository'

function pageFor(params: CatalogPageParams, products = fixtureProducts): CatalogPage {
  return {
    products,
    page: params.page,
    pageSize: params.pageSize,
    total: products.length,
    totalPages: 1,
  }
}

function renderDiscovery(
  initialEntry = '/catalog',
  resolve: (params: CatalogPageParams) => CatalogPage = (params) => pageFor(params),
) {
  const list = vi.fn<CatalogRepository['list']>((params) =>
    Promise.resolve(resolve(params)),
  )
  const router = createMemoryRouter(createAppRoutes({ catalogRepository: { list } }), {
    initialEntries: [initialEntry],
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { list, router }
}

describe('catalog discovery URL state', () => {
  it('canonicalizes invalid and unknown params with replace semantics', async () => {
    const { router } = renderDiscovery(
      '/catalog?junk=1&brand=bad&brand=sever&sort=bad&page=1',
    )

    expect(await screen.findByText('Signal 01')).toBeVisible()
    await waitFor(() => expect(router.state.location.search).toBe('?brand=sever'))
  })

  it('commits desktop facets and sort to URL while resetting page', async () => {
    const user = userEvent.setup()
    const { list, router } = renderDiscovery('/catalog?page=2')

    await screen.findByText('Signal 01')
    await user.click(screen.getByLabelText('ФОРМА'))
    await user.selectOptions(screen.getByLabelText('Сортировка'), 'price-asc')

    await waitFor(() =>
      expect(router.state.location.search).toBe('?brand=forma&sort=price-asc'),
    )
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        brands: ['forma'],
        sort: 'price-asc',
        page: 1,
      }),
      expect.anything(),
    )
  })

  it('debounces search into canonical URL and offers no-results recovery', async () => {
    const user = userEvent.setup()
    const { router } = renderDiscovery('/catalog', (params) =>
      pageFor(params, params.q ? [] : fixtureProducts),
    )

    await user.type(
      await screen.findByLabelText('Поиск по названию, бренду и сценарию'),
      'нет такой пары',
    )

    expect(
      await screen.findByRole('heading', { name: 'По этим условиям пар нет' }),
    ).toBeVisible()
    expect(router.state.location.search).toBe(
      '?q=%D0%BD%D0%B5%D1%82+%D1%82%D0%B0%D0%BA%D0%BE%D0%B9+%D0%BF%D0%B0%D1%80%D1%8B',
    )

    await user.click(screen.getByRole('button', { name: 'Сбросить условия' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findByText('Signal 01')).toBeVisible()
  })

  it('keeps mobile sheet changes draft-only until Apply and returns focus', async () => {
    const user = userEvent.setup()
    const { router } = renderDiscovery()
    const trigger = await screen.findByRole('button', { name: 'Фильтры' })

    await user.click(trigger)
    let dialog = screen.getByRole('dialog', { name: 'Фильтры каталога' })
    await user.click(within(dialog).getByLabelText('СЕВЕР'))
    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))

    expect(router.state.location.search).toBe('')
    await waitFor(() => expect(trigger).toHaveFocus())

    await user.click(trigger)
    dialog = screen.getByRole('dialog', { name: 'Фильтры каталога' })
    await user.click(within(dialog).getByLabelText('СЕВЕР'))
    await user.click(
      within(dialog).getByRole('button', { name: 'Показать результаты' }),
    )

    await waitFor(() => expect(router.state.location.search).toBe('?brand=sever'))
    await user.click(screen.getByRole('button', { name: 'Убрать: СЕВЕР' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })
})
