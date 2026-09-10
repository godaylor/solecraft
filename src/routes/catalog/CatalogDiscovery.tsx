import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'

import type { CatalogSort } from '../../entities/product/api/CatalogRepository'
import type { FitWidth } from '../../entities/product/model/product'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useLocale } from '../../shared/i18n/locale'
import { Button } from '../../shared/ui/Button/Button'
import { IconButton } from '../../shared/ui/IconButton/IconButton'
import {
  emptyCatalogState,
  normalizeCatalogState,
  type CatalogUrlState,
} from './catalogParams'
import {
  brandOptions,
  getColorOptions,
  getUseCaseOptions,
  getWidthOptions,
  priceOptions,
  sizeOptions,
  type CatalogOption,
} from './catalogOptions'
import styles from './CatalogDiscovery.module.scss'

export type CatalogCommit = (state: CatalogUrlState, replace?: boolean) => void

type DiscoveryProps = {
  state: CatalogUrlState
  onCommit: CatalogCommit
}

type FilterFieldsProps = {
  state: CatalogUrlState
  onChange: (state: CatalogUrlState) => void
}

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function clearFacets(state: CatalogUrlState): CatalogUrlState {
  return normalizeCatalogState({
    ...(state.q ? { q: state.q } : {}),
    brands: [],
    uses: [],
    colors: [],
    sort: state.sort,
    page: 1,
  })
}

function filterCount(state: CatalogUrlState): number {
  return (
    state.brands.length +
    state.uses.length +
    state.colors.length +
    (state.size ? 1 : 0) +
    (state.width ? 1 : 0) +
    (state.priceMin !== undefined ? 1 : 0) +
    (state.priceMax !== undefined ? 1 : 0) +
    (state.inStock ? 1 : 0)
  )
}

function optionLabel(options: readonly CatalogOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function FilterFields({ state, onChange }: FilterFieldsProps) {
  const { locale, intlLocale, text } = useLocale()
  const useCaseOptions = getUseCaseOptions(locale)
  const widthOptions = getWidthOptions(locale)
  const colorOptions = getColorOptions(locale)
  return (
    <div className={styles.filterFields}>
      <fieldset className={styles.fieldset}>
        <legend>{text('Бренд', 'Brand')}</legend>
        <div className={styles.choiceList}>
          {brandOptions.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={state.brands.includes(option.value)}
                onChange={() =>
                  onChange({
                    ...state,
                    brands: toggleValue(state.brands, option.value),
                  })
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>{text('Сценарий', 'Use case')}</legend>
        <div className={styles.choiceList}>
          {useCaseOptions.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={state.uses.includes(option.value)}
                onChange={() =>
                  onChange({
                    ...state,
                    uses: toggleValue(state.uses, option.value),
                  })
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.selectGroup}>
        <label>
          <span>{text('Размер EU', 'EU size')}</span>
          <select
            value={state.size ?? ''}
            onChange={(event) => {
              const next = { ...state }
              if (event.target.value) next.size = event.target.value
              else delete next.size
              onChange(next)
            }}
          >
            <option value="">{text('Любой размер', 'Any size')}</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                EU {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{text('Ширина', 'Width')}</span>
          <select
            value={state.width ?? ''}
            onChange={(event) => {
              const next = { ...state }
              if (event.target.value) next.width = event.target.value as FitWidth
              else delete next.width
              onChange(next)
            }}
          >
            <option value="">{text('Любая ширина', 'Any width')}</option>
            {widthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>{text('Цвет', 'Color')}</legend>
        <div className={styles.choiceList}>
          {colorOptions.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={state.colors.includes(option.value)}
                onChange={() =>
                  onChange({
                    ...state,
                    colors: toggleValue(state.colors, option.value),
                  })
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.selectGroup}>
        <label>
          <span>{text('Цена от', 'Price from')}</span>
          <select
            value={state.priceMin ?? ''}
            onChange={(event) => {
              const next = { ...state }
              if (event.target.value) next.priceMin = Number(event.target.value)
              else delete next.priceMin
              onChange(next)
            }}
          >
            <option value="">{text('Без минимума', 'No minimum')}</option>
            {priceOptions.map((price) => (
              <option key={price} value={price}>
                {formatMoney({ amountMinor: price, currency: 'RUB' }, intlLocale)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{text('Цена до', 'Price to')}</span>
          <select
            value={state.priceMax ?? ''}
            onChange={(event) => {
              const next = { ...state }
              if (event.target.value) next.priceMax = Number(event.target.value)
              else delete next.priceMax
              onChange(next)
            }}
          >
            <option value="">{text('Без максимума', 'No maximum')}</option>
            {priceOptions.map((price) => (
              <option key={price} value={price}>
                {formatMoney({ amountMinor: price, currency: 'RUB' }, intlLocale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.stockChoice}>
        <input
          type="checkbox"
          checked={state.inStock === true}
          onChange={(event) => {
            const next = { ...state }
            if (event.target.checked) next.inStock = true
            else delete next.inStock
            onChange(next)
          }}
        />
        <span>{text('Только в наличии', 'In stock only')}</span>
      </label>
    </div>
  )
}

function handleDialogTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return

  const focusable = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled])',
    ),
  )
  const first = focusable[0]
  const last = focusable.at(-1)

  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function MobileFilterSheet({
  open,
  draft,
  onDraftChange,
  onApply,
  onClose,
  triggerRef,
}: {
  open: boolean
  draft: CatalogUrlState
  onDraftChange: (state: CatalogUrlState) => void
  onApply: (state: CatalogUrlState) => void
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { text } = useLocale()

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    const trigger = triggerRef.current
    const previousOverflow = document.body.style.overflow

    if (!dialog) return
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    else dialog.setAttribute('open', '')
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      dialog.querySelector<HTMLElement>('button:not([disabled])')?.focus()
    })

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      if (dialog.open && typeof dialog.close === 'function') dialog.close()
      trigger?.focus()
    }
  }, [open, triggerRef])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby="catalog-filter-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        } else {
          handleDialogTab(event)
        }
      }}
    >
      <div className={styles.sheetPanel}>
        <header className={styles.sheetHeading}>
          <div>
            <p>{text('Линия отбора', 'Selection line')}</p>
            <h2 id="catalog-filter-title">
              {text('Фильтры каталога', 'Catalog filters')}
            </h2>
          </div>
          <IconButton
            label={text('Закрыть фильтры', 'Close filters')}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </IconButton>
        </header>

        <FilterFields state={draft} onChange={onDraftChange} />

        <footer className={styles.sheetActions}>
          <Button onClick={() => onApply({ ...draft, page: 1 })}>
            {text('Показать результаты', 'Show results')}
          </Button>
          <Button variant="secondary" onClick={() => onDraftChange(clearFacets(draft))}>
            {text('Очистить фильтры', 'Clear filters')}
          </Button>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            {text('Отмена', 'Cancel')}
          </button>
        </footer>
      </div>
    </dialog>
  )
}

function ActiveFilterChips({ state, onCommit }: DiscoveryProps) {
  const { locale, intlLocale, text } = useLocale()
  const useCaseOptions = getUseCaseOptions(locale)
  const widthOptions = getWidthOptions(locale)
  const colorOptions = getColorOptions(locale)
  const chips: { key: string; label: string; remove: () => void }[] = []

  if (state.q) {
    chips.push({
      key: 'q',
      label: `${text('Поиск', 'Search')}: ${state.q}`,
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.q
        onCommit(next)
      },
    })
  }
  state.brands.forEach((value) =>
    chips.push({
      key: `brand-${value}`,
      label: optionLabel(brandOptions, value),
      remove: () =>
        onCommit({
          ...state,
          brands: state.brands.filter((item) => item !== value),
          page: 1,
        }),
    }),
  )
  state.uses.forEach((value) =>
    chips.push({
      key: `use-${value}`,
      label: optionLabel(useCaseOptions, value),
      remove: () =>
        onCommit({
          ...state,
          uses: state.uses.filter((item) => item !== value),
          page: 1,
        }),
    }),
  )
  if (state.size) {
    chips.push({
      key: 'size',
      label: `EU ${state.size}`,
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.size
        onCommit(next)
      },
    })
  }
  if (state.width) {
    chips.push({
      key: 'width',
      label: optionLabel(widthOptions, state.width),
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.width
        onCommit(next)
      },
    })
  }
  state.colors.forEach((value) =>
    chips.push({
      key: `color-${value}`,
      label: optionLabel(colorOptions, value),
      remove: () =>
        onCommit({
          ...state,
          colors: state.colors.filter((item) => item !== value),
          page: 1,
        }),
    }),
  )
  if (state.priceMin !== undefined) {
    chips.push({
      key: 'price-min',
      label: `${text('От', 'From')} ${formatMoney(
        { amountMinor: state.priceMin, currency: 'RUB' },
        intlLocale,
      )}`,
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.priceMin
        onCommit(next)
      },
    })
  }
  if (state.priceMax !== undefined) {
    chips.push({
      key: 'price-max',
      label: `${text('До', 'To')} ${formatMoney(
        { amountMinor: state.priceMax, currency: 'RUB' },
        intlLocale,
      )}`,
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.priceMax
        onCommit(next)
      },
    })
  }
  if (state.inStock) {
    chips.push({
      key: 'stock',
      label: text('В наличии', 'In stock'),
      remove: () => {
        const next = { ...state, page: 1 }
        delete next.inStock
        onCommit(next)
      },
    })
  }

  if (!chips.length) return null

  return (
    <div
      className={styles.activeFilters}
      aria-label={text('Активные фильтры', 'Active filters')}
    >
      <span>{text('Линия отбора', 'Selection line')}</span>
      <ul>
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={chip.remove}
              aria-label={`${text('Убрать', 'Remove')}: ${chip.label}`}
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.clearAll}
        onClick={() => onCommit(emptyCatalogState)}
      >
        {text('Сбросить всё', 'Reset all')}
      </button>
    </div>
  )
}

export function CatalogToolbar({ state, onCommit }: DiscoveryProps) {
  const { text } = useLocale()
  const [queryDraft, setQueryDraft] = useState(state.q ?? '')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetDraft, setSheetDraft] = useState(state)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const sortOptions: readonly CatalogOption<CatalogSort>[] = [
    { value: 'recommended', label: text('Рекомендуем', 'Recommended') },
    { value: 'newest', label: text('Сначала новые', 'Newest first') },
    { value: 'price-asc', label: text('Сначала дешевле', 'Price: low to high') },
    { value: 'price-desc', label: text('Сначала дороже', 'Price: high to low') },
  ]

  useEffect(() => {
    const normalizedDraft = queryDraft.trim().replace(/\s+/g, ' ').slice(0, 120)
    if (normalizedDraft === (state.q ?? '')) return

    const timer = window.setTimeout(() => {
      const next = { ...state, page: 1 }
      if (normalizedDraft) next.q = normalizedDraft
      else delete next.q
      onCommit(next, true)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [onCommit, queryDraft, state])

  const commitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedDraft = queryDraft.trim().replace(/\s+/g, ' ').slice(0, 120)
    const next = { ...state, page: 1 }
    if (normalizedDraft) next.q = normalizedDraft
    else delete next.q
    onCommit(next)
  }

  return (
    <div className={styles.discovery}>
      <div className={styles.toolbar}>
        <form className={styles.search} role="search" onSubmit={commitSearch}>
          <label htmlFor="catalog-search">
            {text(
              'Поиск по названию, бренду и сценарию',
              'Search by name, brand, and use case',
            )}
          </label>
          <div className={styles.searchControl}>
            <input
              id="catalog-search"
              type="search"
              value={queryDraft}
              maxLength={120}
              placeholder={text(
                'Например, офис или Metro',
                'For example, office or Metro',
              )}
              onChange={(event) => setQueryDraft(event.target.value)}
            />
            <Button type="submit">{text('Найти', 'Search')}</Button>
          </div>
        </form>

        <label className={styles.sort}>
          <span>{text('Сортировка', 'Sort')}</span>
          <select
            value={state.sort}
            onChange={(event) =>
              onCommit({
                ...state,
                sort: event.target.value as CatalogSort,
                page: 1,
              })
            }
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          ref={filterButtonRef}
          type="button"
          className={styles.mobileFilterButton}
          aria-expanded={sheetOpen}
          onClick={() => {
            setSheetDraft(state)
            setSheetOpen(true)
          }}
        >
          {text('Фильтры', 'Filters')}
          {filterCount(state) ? ` · ${filterCount(state)}` : ''}
        </button>
      </div>

      <ActiveFilterChips state={state} onCommit={onCommit} />

      <MobileFilterSheet
        open={sheetOpen}
        draft={sheetDraft}
        onDraftChange={setSheetDraft}
        triggerRef={filterButtonRef}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          onCommit(normalizeCatalogState(next))
          setSheetOpen(false)
        }}
      />
    </div>
  )
}

export function CatalogFilterRail({ state, onCommit }: DiscoveryProps) {
  const { text } = useLocale()
  return (
    <aside
      className={styles.rail}
      aria-label={text('Фильтры каталога', 'Catalog filters')}
    >
      <div className={styles.railHeading}>
        <div>
          <p>{text('Линия отбора', 'Selection line')}</p>
          <h2>{text('Фильтры', 'Filters')}</h2>
        </div>
        {filterCount(state) ? <span>{filterCount(state)}</span> : null}
      </div>
      <FilterFields
        state={state}
        onChange={(next) => onCommit(normalizeCatalogState({ ...next, page: 1 }))}
      />
      {filterCount(state) ? (
        <button
          type="button"
          className={styles.clearRail}
          onClick={() => onCommit(clearFacets(state))}
        >
          {text('Очистить фильтры', 'Clear filters')}
        </button>
      ) : null}
    </aside>
  )
}
