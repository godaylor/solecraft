import { Link } from 'react-router'

import { useLocale } from '../../shared/i18n/locale'
import type { CatalogUrlState } from './catalogParams'
import { catalogPageHref } from './readCatalogPage'
import styles from './CatalogRoute.module.scss'

type CatalogPaginationProps = {
  currentPage: number
  totalPages: number
  state: CatalogUrlState
}

export function CatalogPagination({
  currentPage,
  totalPages,
  state,
}: CatalogPaginationProps) {
  const { text } = useLocale()
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav
      className={styles.pagination}
      aria-label={text('Страницы каталога', 'Catalog pages')}
    >
      {currentPage > 1 ? (
        <Link to={catalogPageHref(currentPage - 1, state)} rel="prev">
          {text('Назад', 'Previous')}
        </Link>
      ) : (
        <span aria-disabled="true">{text('Назад', 'Previous')}</span>
      )}

      <ol>
        {pages.map((page) => (
          <li key={page}>
            <Link
              to={catalogPageHref(page, state)}
              aria-label={`${text('Страница', 'Page')} ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          </li>
        ))}
      </ol>

      {currentPage < totalPages ? (
        <Link to={catalogPageHref(currentPage + 1, state)} rel="next">
          {text('Дальше', 'Next')}
        </Link>
      ) : (
        <span aria-disabled="true">{text('Дальше', 'Next')}</span>
      )}
    </nav>
  )
}
