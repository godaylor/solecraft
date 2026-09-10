import axe from 'axe-core'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { createAppRoutes } from '../app/router/createAppRouter'
import { fixtureCatalogRepository } from '../entities/product/api/fixtureCatalogRepository'

describe('home accessibility', () => {
  it('has no detectable axe violations in the shell and home route', async () => {
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
    await screen.findByRole('heading', { level: 1, name: /Твой город/i })

    const results = await axe.run(document.body, {
      // jsdom has no canvas implementation; real color contrast is covered by Playwright.
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })
})
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
