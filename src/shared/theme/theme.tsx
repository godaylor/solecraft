/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = Exclude<Theme, 'system'>
export const themeStorageKey = 'solecraft:theme:v1'
const systemThemeQuery = '(prefers-color-scheme: dark)'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

function parseTheme(value: string | null): Theme {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function readTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(themeStorageKey))
  } catch {
    return 'system'
  }
}

function readSystemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(systemThemeQuery).matches
    ? 'dark'
    : 'light'
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme() {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme)
    } catch {
      // The current tab keeps its choice when browser storage is unavailable.
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia?.(systemThemeQuery)
    const onSystemChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }
    const onStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== null) {
        try {
          if (event.storageArea !== window.localStorage) return
        } catch {
          return
        }
      }
      if (event.key === themeStorageKey || event.key === null) {
        setThemeState(parseTheme(event.newValue))
      }
    }

    query?.addEventListener('change', onSystemChange)
    window.addEventListener('storage', onStorageChange)
    return () => {
      query?.removeEventListener('change', onSystemChange)
      window.removeEventListener('storage', onStorageChange)
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', resolvedTheme === 'dark' ? '#111a28' : '#f3f6fa')
  }, [resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
