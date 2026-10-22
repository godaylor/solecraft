import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LocaleProvider, localeStorageKey } from '../../i18n/locale'
import { ThemeProvider } from '../../theme/theme'
import { ThemeControl } from './ThemeControl'

describe('appearance controls', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    cleanup()
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('has a named native selector that changes the theme', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeControl />
      </ThemeProvider>,
    )
    const selector = screen.getByRole('combobox', { name: 'Тема оформления' })
    expect(selector).toHaveValue('system')
    await user.selectOptions(selector, 'dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('localizes the expanded buttons and exposes the current choice', async () => {
    localStorage.setItem(localeStorageKey, 'en')
    const user = userEvent.setup()
    render(
      <LocaleProvider>
        <ThemeProvider>
          <ThemeControl variant="expanded" />
        </ThemeProvider>
      </LocaleProvider>,
    )
    expect(screen.getByRole('group', { name: 'Appearance' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
