import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { LocaleProvider, localeStorageKey, useLocale } from './locale'

function LocaleProbe() {
  const { locale, setLocale, text } = useLocale()
  return (
    <div>
      <output>{`${locale}:${text('Каталог', 'Catalog')}`}</output>
      <button type="button" onClick={() => setLocale('en')}>
        English
      </button>
    </div>
  )
}

describe('LocaleProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
    document.title = ''
  })

  it('defaults to Russian and persists an English selection', async () => {
    const user = userEvent.setup()
    const first = render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    expect(screen.getByText('ru:Каталог')).toBeVisible()
    expect(document.documentElement).toHaveAttribute('lang', 'ru')
    expect(document.title).toBe('Solecraft — городские кроссовки')

    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByText('en:Catalog')).toBeVisible()
    expect(localStorage.getItem(localeStorageKey)).toBe('en')
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.title).toBe('Solecraft — city sneakers')

    first.unmount()
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )
    expect(screen.getByText('en:Catalog')).toBeVisible()
  })

  it('migrates a valid legacy preference copy-first', () => {
    localStorage.setItem('para:language', 'en')

    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    )

    expect(screen.getByText('en:Catalog')).toBeVisible()
    expect(localStorage.getItem(localeStorageKey)).toBe('en')
    expect(localStorage.getItem('para:language')).toBeNull()
  })
})
