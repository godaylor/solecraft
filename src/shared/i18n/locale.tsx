/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'ru' | 'en'

export const localeStorageKey = 'solecraft:locale:v1'
const legacyLocaleStorageKeys = ['para:locale', 'para:language'] as const

type LocaleContextValue = {
  locale: Locale
  intlLocale: 'ru-RU' | 'en-US'
  setLocale: (locale: Locale) => void
  text: (ru: string, en: string) => string
}

function isLocale(value: string | null): value is Locale {
  return value === 'ru' || value === 'en'
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ru'
  try {
    const current = window.localStorage.getItem(localeStorageKey)
    if (isLocale(current)) return current

    for (const key of legacyLocaleStorageKeys) {
      const legacy = window.localStorage.getItem(key)
      if (!isLocale(legacy)) continue
      window.localStorage.setItem(localeStorageKey, legacy)
      window.localStorage.removeItem(key)
      return legacy
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return 'ru'
}

const metadata = {
  ru: {
    title: 'Solecraft — городские кроссовки',
    description:
      'Solecraft — демонстрационный магазин городских кроссовок с понятной посадкой.',
    socialDescription:
      'Выбирайте городские кроссовки по ширине, амортизации и поддержке.',
    ogLocale: 'ru_RU',
  },
  en: {
    title: 'Solecraft — city sneakers',
    description:
      'Solecraft is a demo city sneaker store built around clear, source-aware fit guidance.',
    socialDescription:
      'Choose city sneakers by width, cushioning, support, and everyday use.',
    ogLocale: 'en_US',
  },
} as const

function setMetaContent(selector: string, content: string): void {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

const defaultValue: LocaleContextValue = {
  locale: 'ru',
  intlLocale: 'ru-RU',
  setLocale() {},
  text: (ru) => ru,
}

const LocaleContext = createContext<LocaleContextValue>(defaultValue)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    try {
      window.localStorage.setItem(localeStorageKey, nextLocale)
    } catch {
      // The in-memory choice still works when persistence is unavailable.
    }
  }, [])

  const text = useCallback(
    (ru: string, en: string) => (locale === 'ru' ? ru : en),
    [locale],
  )

  useEffect(() => {
    const current = metadata[locale]
    document.documentElement.lang = locale
    document.title = current.title
    setMetaContent('meta[name="description"]', current.description)
    setMetaContent('meta[property="og:locale"]', current.ogLocale)
    setMetaContent('meta[property="og:title"]', current.title)
    setMetaContent('meta[property="og:description"]', current.socialDescription)
    setMetaContent('meta[name="twitter:title"]', current.title)
    setMetaContent('meta[name="twitter:description"]', current.socialDescription)
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      intlLocale: locale === 'ru' ? 'ru-RU' : 'en-US',
      setLocale,
      text,
    }),
    [locale, setLocale, text],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
