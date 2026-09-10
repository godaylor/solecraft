import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { IconButton } from '../IconButton/IconButton'

describe('action primitives', () => {
  it('runs an enabled Button action', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Продолжить</Button>)
    await user.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('exposes Button loading state and blocks repeated action', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Button isLoading onClick={onClick}>
        Продолжить
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Подождите…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('requires a contextual accessible name for IconButton', () => {
    render(
      <IconButton label="Закрыть меню">
        <span aria-hidden="true">×</span>
      </IconButton>,
    )

    expect(screen.getByRole('button', { name: 'Закрыть меню' })).toBeInTheDocument()
  })
})
