import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { createAppRoutes } from '../app/router/createAppRouter'
import type { CatalogRepository } from '../entities/product/api/CatalogRepository'
import { fixtureCatalogRepository } from '../entities/product/api/fixtureCatalogRepository'

function renderRoute(
  path: string,
  catalogRepository: CatalogRepository = fixtureCatalogRepository,
) {
  const router = createMemoryRouter(createAppRoutes({ catalogRepository }), {
    initialEntries: [path],
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('application routes', () => {
  it('renders only the home route at root', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Твой город/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Городские пары' }),
    ).not.toBeInTheDocument()
  })

  it('loads the typed catalog fixture through Query', async () => {
    renderRoute('/catalog')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Городские пары' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Signal 01')).toBeInTheDocument()
  })

  it('renders a recoverable catalog error when the repository rejects', async () => {
    renderRoute('/catalog', {
      list() {
        return Promise.reject(new Error('fixture unavailable'))
      },
    })

    expect(await screen.findByText('Не удалось загрузить каталог')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('renders a meaningful not-found route', async () => {
    renderRoute('/unknown')

    expect(
      await screen.findByRole('heading', { name: 'Такой страницы нет' }),
    ).toBeInTheDocument()
  })
})
