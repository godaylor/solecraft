import { isRouteErrorResponse, useRouteError } from 'react-router'
import { useEffect } from 'react'

import { reportClientError } from '../../shared/lib/observability'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import styles from '../../shared/ui/StatusPage/StatusPage.module.scss'
import { paths } from './paths'
import { useLocale } from '../../shared/i18n/locale'

export function RouteErrorBoundary() {
  const { text } = useLocale()
  const error: unknown = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    if (!isNotFound) reportClientError('route-error')
  }, [isNotFound])

  return (
    <section className={styles.status} aria-labelledby="route-error-title">
      <p className={styles.code}>
        {isNotFound ? '404' : text('Ошибка маршрута', 'Route error')}
      </p>
      <h1 id="route-error-title">
        {isNotFound
          ? text('Страница не найдена', 'Page not found')
          : text('Не удалось открыть страницу', 'Could not open the page')}
      </h1>
      <p>
        {isNotFound
          ? text(
              'Проверьте адрес или вернитесь к началу.',
              'Check the address or return home.',
            )
          : text(
              'Обновите страницу. Если ошибка повторится, вернитесь на главную.',
              'Refresh the page. If the error repeats, return home.',
            )}
      </p>
      <ButtonLink to={paths.home}>{text('На главную', 'Go home')}</ButtonLink>
    </section>
  )
}

export function CatalogErrorBoundary() {
  const { text } = useLocale()
  return (
    <section className={styles.status} aria-labelledby="catalog-error-title">
      <p className={styles.code}>{text('Каталог недоступен', 'Catalog unavailable')}</p>
      <h1 id="catalog-error-title">
        {text('Не удалось загрузить пары', 'Could not load sneakers')}
      </h1>
      <p>
        {text(
          'Локальные данные не изменились. Попробуйте открыть каталог ещё раз.',
          'Local data was not changed. Try opening the catalog again.',
        )}
      </p>
      <ButtonLink to={paths.catalog} reloadDocument>
        {text('Повторить', 'Retry')}
      </ButtonLink>
    </section>
  )
}

export function RouteHydrateFallback() {
  const { text } = useLocale()
  return (
    <p className={styles.loading} role="status">
      {text('Загрузка маршрута…', 'Loading route…')}
    </p>
  )
}
