import { commerceReference } from '../../shared/lib/commerceReference'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { paths } from '../../app/router/paths'
import { useAuth } from '../../app/providers/AuthProvider'
import type { OrderRepository } from '../../entities/order/api/OrderRepository'
import { formatOrderDate, presentOrderStatus } from '../../entities/order/model/order'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useLocale } from '../../shared/i18n/locale'
import { localizeColorName } from '../../entities/product/model/productLocalization'
import { Button } from '../../shared/ui/Button/Button'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import styles from './OrderRoutes.module.scss'

export function OrderDetailRoute({ repository }: { repository: OrderRepository }) {
  const { locale, intlLocale, text } = useLocale()
  const auth = useAuth()
  const { orderNumber = '' } = useParams()
  const query = useQuery({
    queryKey: ['owner', auth.user?.id, 'orders', 'detail', orderNumber],
    queryFn: () => repository.getOrder(orderNumber),
    enabled: auth.status === 'authenticated' && Boolean(orderNumber),
  })

  if (auth.status === 'loading')
    return (
      <div className={styles.loading}>
        <Skeleton label={text('Загружаем заказ', 'Loading order')} lines={6} />
      </div>
    )
  if (auth.status === 'error')
    return (
      <section className={styles.state}>
        <h1>{text('Не удалось проверить сессию', 'Could not verify session')}</h1>
        <p>
          {text(
            'Детали заказа скрыты до успешной повторной проверки.',
            'Order details remain hidden until a successful retry.',
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
        <h1>{text('Заказ недоступен', 'Order unavailable')}</h1>
        <p>
          {text(
            'Войдите в аккаунт владельца. Номер заказа сам по себе не раскрывает детали.',
            'Sign in to the owner account. The order number alone does not reveal details.',
          )}
        </p>
        <Link to={`${paths.signIn}?returnTo=${encodeURIComponent(location.pathname)}`}>
          {text('Войти', 'Sign in')}
        </Link>
      </section>
    )
  if (query.isPending)
    return (
      <div className={styles.loading}>
        <Skeleton label={text('Загружаем заказ', 'Loading order')} lines={6} />
      </div>
    )
  if (query.isError)
    return (
      <section className={styles.state}>
        <h1>{text('Не удалось загрузить заказ', 'Could not load order')}</h1>
        <p>
          {text(
            'Повторите запрос; история и snapshots не изменены.',
            'Retry the request; history and snapshots were not changed.',
          )}
        </p>
        <Button type="button" onClick={() => void query.refetch()}>
          {text('Повторить', 'Retry')}
        </Button>
        <Link to={paths.accountOrders}>{text('К истории', 'Back to history')}</Link>
      </section>
    )
  if (!query.data)
    return (
      <section className={styles.state}>
        <h1>{text('Заказ недоступен', 'Order unavailable')}</h1>
        <p>
          {text(
            'Так одинаково выглядит неизвестный и чужой номер заказа.',
            'Unknown and non-owner order numbers intentionally look the same.',
          )}
        </p>
        <Link to={paths.accountOrders}>
          {text('К моей истории', 'Back to my history')}
        </Link>
      </section>
    )

  const order = query.data
  const status = presentOrderStatus(order.status, locale)
  return (
    <article className={styles.detail} aria-labelledby="order-title">
      <nav aria-label={text('Хлебные крошки', 'Breadcrumbs')}>
        <Link to={paths.accountOrders}>{text('Мои заказы', 'My orders')}</Link>
        <span aria-hidden="true">/</span>
        <span>{commerceReference(order.orderNumber)}</span>
      </nav>
      <header>
        <div>
          <p className={styles.number}>{commerceReference(order.orderNumber)}</p>
          <h1 id="order-title">{text('Детали заказа', 'Order details')}</h1>
          <p>{formatOrderDate(order.placedAt, intlLocale)}</p>
        </div>
        <span className={styles.status} data-tone={status.tone}>
          {status.label}
        </span>
      </header>
      <section aria-labelledby="order-items-title">
        <h2 id="order-items-title">
          {text('Состав на момент покупки', 'Items at time of purchase')}
        </h2>
        <ul className={styles.items}>
          {order.items.map((item) => (
            <li key={`${item.sku}-${item.size}`}>
              <div>
                <strong>
                  {item.brandName} {item.productName}
                </strong>
                <p>
                  {localizeColorName(undefined, item.color, locale)} · EU {item.size}
                </p>
                <p className={styles.number}>
                  SKU {commerceReference(item.sku)} × {item.quantity}
                </p>
              </div>
              <strong>
                {formatMoney(
                  {
                    amountMinor: item.lineTotalMinor,
                    currency: order.currency,
                  },
                  intlLocale,
                )}
              </strong>
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.delivery} aria-labelledby="delivery-title">
        <h2 id="delivery-title">{text('Доставка', 'Delivery')}</h2>
        <p>{order.delivery.recipientName}</p>
        <address>
          {order.delivery.city}, {order.delivery.addressLine}
          {order.delivery.postalCode ? `, ${order.delivery.postalCode}` : ''}
        </address>
      </section>
      <aside className={styles.totals} aria-label={text('Итого заказа', 'Order total')}>
        <p>
          <span>{text('Товары', 'Items')}</span>
          <strong>
            {formatMoney(
              {
                amountMinor: order.subtotalMinor,
                currency: order.currency,
              },
              intlLocale,
            )}
          </strong>
        </p>
        <p>
          <span>{text('Доставка', 'Delivery')}</span>
          <strong>
            {order.deliveryMinor
              ? formatMoney(
                  {
                    amountMinor: order.deliveryMinor,
                    currency: order.currency,
                  },
                  intlLocale,
                )
              : text('Бесплатно', 'Free')}
          </strong>
        </p>
        <p>
          <span>{text('Итого', 'Total')}</span>
          <strong>
            {formatMoney(
              { amountMinor: order.totalMinor, currency: order.currency },
              intlLocale,
            )}
          </strong>
        </p>
      </aside>
      <p className={styles.help}>
        {text('Нужна помощь с демо-заказом?', 'Need help with a demo order?')}{' '}
        <Link to={paths.account}>
          {text('Вернуться в аккаунт', 'Return to account')}
        </Link>
        .
      </p>
    </article>
  )
}
