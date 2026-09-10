import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { createAppRoutes } from '../app/router/createAppRouter'
import { fixtureCatalogRepository } from '../entities/product/api/fixtureCatalogRepository'

describe('mobile navigation Sheet', () => {
  it('opens, makes the background inert, closes with Escape and restores focus', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      createAppRoutes({ catalogRepository: fixtureCatalogRepository }),
      { initialEntries: ['/'] },
    )

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    const trigger = await screen.findByRole('button', { name: 'Открыть меню' })
    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Куда идём?' })).toBeInTheDocument()
    expect(document.getElementById('main-content')).toHaveAttribute('inert')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Куда идём?' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(document.getElementById('main-content')).not.toHaveAttribute('inert')
  })
})
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
