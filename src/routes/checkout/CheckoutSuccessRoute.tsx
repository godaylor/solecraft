import { commerceReference } from '../../shared/lib/commerceReference'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'

import { paths } from '../../app/router/paths'
import { useAuth } from '../../app/providers/AuthProvider'
import type { CheckoutRepository } from '../../entities/checkout/api/CheckoutRepository'
import { readReceiptCapability } from '../../entities/checkout/model/receiptCapability'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useLocale } from '../../shared/i18n/locale'
import { localizeColorName } from '../../entities/product/model/productLocalization'
import { presentOrderStatus } from '../../entities/order/model/order'
import { Button } from '../../shared/ui/Button/Button'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import styles from './CheckoutRoute.module.scss'

export function CheckoutSuccessRoute({
  repository,
}: {
  repository: CheckoutRepository
}) {
  const { locale, intlLocale, text } = useLocale()
  const { orderNumber = '' } = useParams()
  const auth = useAuth()
  const token =
    auth.status === 'authenticated' ? undefined : readReceiptCapability(orderNumber)
  const query = useQuery({
    queryKey:
      auth.status === 'authenticated'
        ? ['owner', 'order-receipt', auth.user?.id, orderNumber]
        : ['guest-receipt', orderNumber, Boolean(token)],
    queryFn: () =>
      auth.status === 'authenticated'
        ? repository.readOwnerReceipt(orderNumber)
        : token
          ? repository.readGuestReceipt(orderNumber, token)
          : Promise.resolve(null),
    enabled: auth.status !== 'loading',
    gcTime: auth.status === 'authenticated' ? 5 * 60_000 : 0,
  })
  if (query.isPending)
    return (
      <div className={styles.loading}>
        <Skeleton label={text('Проверяем заказ', 'Checking order')} lines={4} />
      </div>
    )
  if (query.isError)
    return (
      <section className={styles.failure}>
        <h1>
          {text('Не удалось проверить подтверждение', 'Could not verify confirmation')}
        </h1>
        <p>
          {text(
            'Проверьте соединение и повторите. Номер заказа не раскрывает детали.',
            'Check your connection and retry. The order number does not reveal details.',
          )}
        </p>
        <Button type="button" onClick={() => void query.refetch()}>
          {text('Повторить', 'Retry')}
        </Button>
        <Link to={paths.catalog}>{text('В каталог', 'Back to catalog')}</Link>
      </section>
    )
  if (!query.data)
    return (
      <section className={styles.failure}>
        <h1>{text('Подтверждение недоступно', 'Confirmation unavailable')}</h1>
        <p>
          {text(
            'Capability отсутствует, неверна или истекла. Номер заказа сам по себе не открывает детали.',
            'The capability is missing, invalid, or expired. The order number alone does not open details.',
          )}
        </p>
        <Link to={paths.catalog}>{text('В каталог', 'Back to catalog')}</Link>
      </section>
    )
  const receipt = query.data
  const status = presentOrderStatus(receipt.status, locale)
  return (
    <section className={styles.success} aria-labelledby="success-title">
      <p>{text('Заказ принят / демо без списания', 'Order placed / no demo charge')}</p>
      <h1 id="success-title">{text('Готово', 'Done')}</h1>
      <strong className={styles.orderNumber}>
        {commerceReference(receipt.orderNumber)}
      </strong>
      <p>
        {text('Статус', 'Status')}: <span>{status.label}</span>
      </p>
      <h2>{text('Состав заказа', 'Order items')}</h2>
      <ul>
        {receipt.items.map((item) => (
          <li key={item.sku}>
            <span>
              {item.brandName} {item.productName} ·{' '}
              {localizeColorName(undefined, item.color, locale)} · EU {item.size} ·{' '}
              {commerceReference(item.sku)} × {item.quantity}
            </span>
            <strong>
              {formatMoney(
                { amountMinor: item.lineTotalMinor, currency: 'RUB' },
                intlLocale,
              )}
            </strong>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        {text('Итого', 'Total')}{' '}
        <strong>
          {formatMoney(
            { amountMinor: receipt.totalMinor, currency: 'RUB' },
            intlLocale,
          )}
        </strong>
      </p>
      <p>
        {auth.status === 'authenticated'
          ? text(
              'Заказ сохранён в owner-only истории аккаунта.',
              'The order is saved in your owner-only account history.',
            )
          : text(
              'Гостевое подтверждение доступно только в этой browser session.',
              'Guest confirmation is available only in this browser session.',
            )}
      </p>
      {auth.status === 'authenticated' ? (
        <Link to={paths.accountOrders}>
          {text('Открыть историю заказов', 'Open order history')}
        </Link>
      ) : null}
      <Link to={paths.catalog}>{text('Вернуться в каталог', 'Return to catalog')}</Link>
    </section>
  )
}
