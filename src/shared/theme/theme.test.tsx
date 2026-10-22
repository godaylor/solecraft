import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider, themeStorageKey, useTheme } from './theme'

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <output aria-label="Current appearance">{`${theme}:${resolvedTheme}`}</output>
      <button type="button" onClick={() => setTheme('light')}>
        Light
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        System
      </button>
    </div>
  )
}

function mockSystemTheme(initialDark: boolean) {
  let matches = initialDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const query = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )
  return {
    change(dark: boolean) {
      matches = dark
      act(() => {
        for (const listener of listeners) {
          listener({ matches, media: query.media } as MediaQueryListEvent)
        }
      })
    },
    listeners,
  }
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  )
}

describe('appearance preference', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.querySelector('meta[name="theme-color"]')?.remove()
    delete document.documentElement.dataset.theme
    localStorage.clear()
  })

  it('follows the device by default and updates the page and browser color live', () => {
    const device = mockSystemTheme(false)
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
    const rendered = renderTheme()

    expect(screen.getByLabelText('Current appearance')).toHaveTextContent(
      'system:light',
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(meta).toHaveAttribute('content', '#f3f6fa')

    device.change(true)
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('system:dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(meta).toHaveAttribute('content', '#111a28')

    rendered.unmount()
    expect(device.listeners.size).toBe(0)
  })

  it('persists an explicit choice without letting device changes override it', async () => {
    const device = mockSystemTheme(true)
    const user = userEvent.setup()
    const first = renderTheme()

    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(localStorage.getItem(themeStorageKey)).toBe('light')
    device.change(false)
    device.change(true)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    first.unmount()
    renderTheme()
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('light:light')

    await user.click(screen.getByRole('button', { name: 'System' }))
    expect(localStorage.getItem(themeStorageKey)).toBe('system')
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('system:dark')
  })

  it('synchronizes another tab and returns to device appearance when preferences clear', () => {
    mockSystemTheme(true)
    renderTheme()
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: themeStorageKey, newValue: 'light' }),
      )
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'unrelated', newValue: 'dark' }),
      )
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: themeStorageKey,
          newValue: 'dark',
          storageArea: window.sessionStorage,
        }),
      )
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: null, storageArea: window.localStorage }),
      )
    })
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('system:dark')
  })

  it('uses the device for an invalid stored value', () => {
    mockSystemTheme(true)
    localStorage.setItem(themeStorageKey, 'unexpected-value')
    renderTheme()
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('system:dark')
  })

  it('keeps selection usable when storage access is denied', async () => {
    mockSystemTheme(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError')
    })
    const user = userEvent.setup()
    renderTheme()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(screen.getByLabelText('Current appearance')).toHaveTextContent('dark:dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('remains usable when system appearance detection is unavailable', async () => {
    vi.stubGlobal('matchMedia', undefined)
    const user = userEvent.setup()
    renderTheme()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
