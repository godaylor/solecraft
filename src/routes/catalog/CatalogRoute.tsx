import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { productPath } from '../../app/router/paths'
import type {
  CatalogPage,
  CatalogRepository,
} from '../../entities/product/api/CatalogRepository'
import {
  catalogKeys,
  catalogPageQueryOptions,
} from '../../entities/product/api/catalogQuery'
import { ProductCard } from '../../entities/product/ui/ProductCard'
import { localizeProduct } from '../../entities/product/model/productLocalization'
import { useLocale } from '../../shared/i18n/locale'
import { Button } from '../../shared/ui/Button/Button'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState'
import { InlineError } from '../../shared/ui/InlineError/InlineError'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import {
  CatalogFilterRail,
  CatalogToolbar,
  type CatalogCommit,
} from './CatalogDiscovery'
import { CatalogPagination } from './CatalogPagination'
import {
  emptyCatalogState,
  hasCatalogDiscoveryState,
  normalizeCatalogState,
  parseCatalogParams,
  serializeCatalogParams,
} from './catalogParams'
import { catalogPageHref } from './readCatalogPage'
import styles from './CatalogRoute.module.scss'

const pageSize = 12

type CatalogRouteProps = {
  catalogRepository: CatalogRepository
}

function CatalogHeading({
  total,
  visiblePage,
  totalPages,
}: {
  total?: number
  visiblePage?: number
  totalPages?: number
}) {
  const { text } = useLocale()
  return (
    <header className={styles.heading}>
      <div>
        <p className={styles.kicker}>
          {text('Каталог / городские пары', 'Catalog / city sneakers')}
        </p>
        <h1 id="catalog-title">{text('Городские пары', 'City sneakers')}</h1>
      </div>
      <p aria-live="polite">
        {total === undefined
          ? text(
              'Загружаем ассортимент и актуальные остатки.',
              'Loading the assortment and current stock.',
            )
          : text(
              `Найдено: ${total}. Страница ${visiblePage ?? 1} из ${totalPages ?? 1}.`,
              `Found: ${total}. Page ${visiblePage ?? 1} of ${totalPages ?? 1}.`,
            )}
      </p>
    </header>
  )
}

export function CatalogRoute({ catalogRepository }: CatalogRouteProps) {
  const { locale, text } = useLocale()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawSearch = searchParams.toString()
  const catalogState = useMemo(
    () => parseCatalogParams(new URLSearchParams(rawSearch)),
    [rawSearch],
  )
  const canonicalSearch = useMemo(
    () => serializeCatalogParams(catalogState).toString(),
    [catalogState],
  )

  useEffect(() => {
    if (rawSearch !== canonicalSearch) {
      setSearchParams(new URLSearchParams(canonicalSearch), { replace: true })
    }
  }, [canonicalSearch, rawSearch, setSearchParams])

  const commitState = useCallback<CatalogCommit>(
    (nextState, replace = false) => {
      setSearchParams(serializeCatalogParams(normalizeCatalogState(nextState)), {
        replace,
      })
    },
    [setSearchParams],
  )

  const catalogQuery = useQuery(
    catalogPageQueryOptions(catalogRepository, {
      ...catalogState,
      pageSize,
    }),
  )
  const cachedCatalogPage = queryClient
    .getQueriesData<CatalogPage>({ queryKey: catalogKeys.all })
    .reduce<CatalogPage | undefined>(
      (latestPage, [, page]) => page ?? latestPage,
      undefined,
    )
  const catalogPage = catalogQuery.data ?? cachedCatalogPage

  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <CatalogHeading
        {...(catalogPage
          ? {
              total: catalogPage.total,
              visiblePage: catalogPage.page,
              totalPages: catalogPage.totalPages,
            }
          : {})}
      />

      <CatalogToolbar
        key={catalogState.q ?? ''}
        state={catalogState}
        onCommit={commitState}
      />

      <div className={styles.catalogBody}>
        <CatalogFilterRail state={catalogState} onCommit={commitState} />

        <div className={styles.results}>
          <div className={styles.catalogNote} role="note">
            <span>{text('Живые данные', 'Live data')}</span>
            <p>
              {text(
                'Сравните модели по цене, доступным EU-размерам и Линии посадки.',
                'Compare models by price, available EU sizes, and the Fit line.',
              )}
            </p>
          </div>

          <p className={styles.refreshStatus} role="status" aria-live="polite">
            {catalogQuery.isFetching && catalogPage
              ? catalogQuery.isPlaceholderData
                ? text(
                    'Обновляем выдачу. Пока показана предыдущая страница.',
                    'Refreshing results. The previous page remains visible.',
                  )
                : text(
                    'Обновляем цены и остатки. Показанные карточки остаются доступны.',
                    'Refreshing prices and stock. The current cards remain available.',
                  )
              : ''}
          </p>

          {!catalogPage ? (
            catalogQuery.isError ? (
              <div className={styles.statePanel}>
                <InlineError
                  title={text(
                    'Не удалось загрузить каталог',
                    'Could not load the catalog',
                  )}
                >
                  {text(
                    'Проверьте соединение и повторите запрос. Текущий адрес страницы сохранён.',
                    'Check your connection and retry. The current page address is preserved.',
                  )}
                </InlineError>
                <Button onClick={() => void catalogQuery.refetch()}>
                  {text('Повторить', 'Retry')}
                </Button>
              </div>
            ) : (
              <div
                className={styles.grid}
                aria-busy="true"
                aria-label={text('Загрузка товаров', 'Loading products')}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton
                    key={index}
                    {...(index === 0
                      ? { label: text('Загрузка каталога', 'Loading catalog') }
                      : {})}
                  />
                ))}
              </div>
            )
          ) : (
            <>
              {catalogQuery.isError ? (
                <div className={styles.backgroundError}>
                  <InlineError
                    title={text('Не удалось обновить данные', 'Could not refresh data')}
                  >
                    {text(
                      'Показана последняя успешная выдача. Можно повторить обновление.',
                      'The last successful results are shown. You can retry the refresh.',
                    )}
                  </InlineError>
                  <Button
                    variant="secondary"
                    onClick={() => void catalogQuery.refetch()}
                  >
                    {text('Обновить', 'Refresh')}
                  </Button>
                </div>
              ) : null}

              {catalogPage.total === 0 ? (
                hasCatalogDiscoveryState(catalogState) ? (
                  <EmptyState
                    title={text(
                      'По этим условиям пар нет',
                      'No sneakers match these conditions',
                    )}
                    description={text(
                      'Уберите один фильтр или сбросьте поиск, чтобы вернуть весь ассортимент.',
                      'Remove a filter or reset search to restore the full assortment.',
                    )}
                    action={
                      <Button onClick={() => commitState(emptyCatalogState)}>
                        {text('Сбросить условия', 'Reset conditions')}
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    title={text('Каталог пока пуст', 'The catalog is empty')}
                    description={text(
                      'Published товары не найдены. Попробуйте повторить обновление позже.',
                      'No published products were found. Try refreshing later.',
                    )}
                    action={
                      <Button onClick={() => void catalogQuery.refetch()}>
                        {text('Повторить', 'Retry')}
                      </Button>
                    }
                  />
                )
              ) : catalogPage.products.length === 0 ? (
                <EmptyState
                  title={text(
                    'На этой странице нет пар',
                    'There are no sneakers on this page',
                  )}
                  description={text(
                    'Номер страницы больше доступного диапазона. Вернитесь к началу каталога.',
                    'The page number is outside the available range. Return to the start.',
                  )}
                  action={
                    <ButtonLink to={catalogPageHref(1, catalogState)}>
                      {text('На первую страницу', 'Go to page one')}
                    </ButtonLink>
                  }
                />
              ) : (
                <>
                  <h2 className="visually-hidden">
                    {text('Товары каталога', 'Catalog products')}
                  </h2>
                  <div
                    className={styles.grid}
                    aria-busy={catalogQuery.isFetching || undefined}
                  >
                    {catalogPage.products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={localizeProduct(product, locale)}
                        href={productPath(product.slug)}
                        priority={index < 2 && catalogState.page === 1}
                      />
                    ))}
                  </div>
                  <CatalogPagination
                    currentPage={catalogPage.page}
                    totalPages={catalogPage.totalPages}
                    state={catalogState}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
