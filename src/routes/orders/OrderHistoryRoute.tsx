import { commerceReference } from '../../shared/lib/commerceReference'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useSearchParams } from 'react-router'

import { orderDetailPath, orderHistoryPath, paths } from '../../app/router/paths'
import { useAuth } from '../../app/providers/AuthProvider'
import type { OrderRepository } from '../../entities/order/api/OrderRepository'
import {
  formatOrderDate,
  parseOrderPage,
  presentOrderStatus,
} from '../../entities/order/model/order'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useLocale } from '../../shared/i18n/locale'
import { Button } from '../../shared/ui/Button/Button'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import styles from './OrderRoutes.module.scss'

const pageSize = 4

export function OrderHistoryRoute({ repository }: { repository: OrderRepository }) {
  const { locale, intlLocale, text } = useLocale()
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const rawPage = searchParams.get('page')
  const page = parseOrderPage(rawPage)
  const query = useQuery({
    queryKey: ['owner', auth.user?.id, 'orders', { page, pageSize }],
    queryFn: () => repository.getOrders(page, pageSize),
    enabled: auth.status === 'authenticated',
  })

  if (auth.status === 'loading')
    return (
      <div className={styles.loading}>
        <Skeleton label={text('Проверяем историю', 'Checking history')} lines={4} />
      </div>
    )
  if (auth.status === 'error')
    return (
      <section className={styles.state}>
        <h1>{text('Не удалось проверить сессию', 'Could not verify session')}</h1>
        <p>
          {text(
            'История скрыта до успешной повторной проверки.',
            'History remains hidden until a successful retry.',
          )}
        </p>
        <Button type="button" onClick={() => void auth.refreshSession()}>
          {text('Повторить', 'Retry')}
        </Button>
      </section>
    )
  if (auth.status !== 'authenticated')
    return (
      <section className={styles.state}>
        <h1>
          {text('История доступна после входа', 'History is available after sign-in')}
        </h1>
        <p>
          {text(
            'Гостевые подтверждения не образуют публичный поиск заказов.',
            'Guest confirmations do not create a public order lookup.',
          )}
        </p>
        <Link
          to={`${paths.signIn}?returnTo=${encodeURIComponent(paths.accountOrders)}`}
        >
          {text('Войти по magic link', 'Sign in with a magic link')}
        </Link>
      </section>
    )
  if (rawPage !== null && (rawPage !== String(page) || page === 1))
    return <Navigate to={orderHistoryPath()} replace />
  if (query.isPending)
    return (
      <div className={styles.loading}>
        <Skeleton label={text('Загружаем заказы', 'Loading orders')} lines={5} />
      </div>
    )
  if (query.isError)
    return (
      <section className={styles.state}>
        <h1>
          {text('История временно недоступна', 'History is temporarily unavailable')}
        </h1>
        <p>
          {text(
            'Private data не изменены. Повторите запрос или вернитесь в аккаунт.',
            'Private data was not changed. Retry or return to your account.',
          )}
        </p>
        <Button type="button" onClick={() => void query.refetch()}>
          {text('Повторить', 'Retry')}
        </Button>
        <Link to={paths.account}>{text('В аккаунт', 'Open account')}</Link>
      </section>
    )

  const totalPages = Math.max(1, Math.ceil(query.data.total / pageSize))
  if (query.data.total > 0 && page > totalPages)
    return <Navigate to={orderHistoryPath(totalPages)} replace />

  return (
    <section className={styles.page} aria-labelledby="orders-title">
      <header className={styles.heading}>
        <div>
          <p>owner-only / immutable snapshots</p>
          <h1 id="orders-title">{text('Мои заказы', 'My orders')}</h1>
        </div>
        <Link to={paths.account}>{text('Аккаунт', 'Account')}</Link>
      </header>
      {!query.data.orders.length ? (
        <div className={styles.empty}>
          <h2>{text('Заказов пока нет', 'No orders yet')}</h2>
          <p>
            {text(
              'Выберите точный SKU и завершите демо-оформление.',
              'Choose an exact SKU and complete the demo checkout.',
            )}
          </p>
          <Link to={paths.catalog}>{text('Перейти в каталог', 'Open catalog')}</Link>
        </div>
      ) : (
        <ol className={styles.orders}>
          {query.data.orders.map((order) => {
            const status = presentOrderStatus(order.status, locale)
            return (
              <li key={order.orderNumber}>
                <article>
                  <div>
                    <p className={styles.number}>
                      {commerceReference(order.orderNumber)}
                    </p>
                    <h2>
                      <Link to={orderDetailPath(order.orderNumber)}>
                        {text('Заказ от', 'Order from')}{' '}
                        {formatOrderDate(order.placedAt, intlLocale)}
                      </Link>
                    </h2>
                  </div>
                  <span className={styles.status} data-tone={status.tone}>
                    {status.label}
                  </span>
                  <strong>
                    {formatMoney(
                      {
                        amountMinor: order.totalMinor,
                        currency: order.currency,
                      },
                      intlLocale,
                    )}
                  </strong>
                </article>
              </li>
            )
          })}
        </ol>
      )}
      {query.data.total > pageSize ? (
        <nav
          className={styles.pagination}
          aria-label={text('Страницы истории заказов', 'Order history pages')}
        >
          {page > 1 ? (
            <Link rel="prev" to={orderHistoryPath(page - 1)}>
              {text('Предыдущая', 'Previous')}
            </Link>
          ) : (
            <span />
          )}
          <span>
            {text('Страница', 'Page')} {page} {text('из', 'of')} {totalPages}
          </span>
          {page < totalPages ? (
            <Link rel="next" to={orderHistoryPath(page + 1)}>
              {text('Следующая', 'Next')}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  )
}
