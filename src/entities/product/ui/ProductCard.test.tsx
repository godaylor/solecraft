import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { fixtureProducts } from '../api/fixtureCatalogRepository'
import { ProductCard } from './ProductCard'

const product = fixtureProducts[0]

if (!product) {
  throw new Error('ProductCard tests require a deterministic product fixture')
}

describe('ProductCard', () => {
  it('links to the catalog and exposes textual fit attributes', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} href="/catalog#sever-signal" />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: /Signal 01 — открыть карточку товара/i }),
    ).toHaveAttribute('href', '/catalog#sever-signal')

    const fitLine = screen.getByLabelText('Линия посадки')
    expect(within(fitLine).getByText('стандартная')).toBeVisible()
    expect(within(fitLine).getByText('мягкая')).toBeVisible()
    expect(within(fitLine).getAllByText('сбалансированная')).toHaveLength(1)
  })

  it('keeps a descriptive fallback when the image fails', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} href="/catalog#sever-signal" />
      </MemoryRouter>,
    )

    fireEvent.error(screen.getByRole('img', { name: product.image.alt }))

    expect(screen.getByText('Изображение временно недоступно')).toBeVisible()
    expect(screen.getByRole('img', { name: product.image.alt })).toBeInTheDocument()
  })
})
