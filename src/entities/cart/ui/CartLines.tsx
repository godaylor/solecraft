import { commerceReference } from '../../../shared/lib/commerceReference'
import { useState } from 'react'
import { Link } from 'react-router'

import { productPath } from '../../../app/router/paths'
import { useCommerce } from '../../../app/providers/CommerceProvider'
import { formatMoney } from '../../../shared/lib/formatMoney'
import { useLocale } from '../../../shared/i18n/locale'
import { localizeColorName } from '../../product/model/productLocalization'
import { Button } from '../../../shared/ui/Button/Button'
import { InlineError } from '../../../shared/ui/InlineError/InlineError'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import type { CartRepository } from '../api/CartRepository'
import type { GuestCartLine } from '../model/guestCartStore'
import styles from './CartLines.module.scss'
import { useCartView } from './useCartView'

export function CartLines({
  repository,
  compact = false,
  onRemove,
}: {
  repository: CartRepository
  compact?: boolean
  onRemove?: (line: GuestCartLine) => void
}) {
  const { locale, intlLocale, text } = useLocale()
  const { lines, query, entries } = useCartView(repository)
  const { setCartQuantity, removeCartLine, cartPending } = useCommerce()
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())
  const LineHeading = compact ? 'h3' : 'h2'

  if (!lines.length)
    return (
      <p className={styles.empty}>{text('Корзина пока пуста.', 'Cart is empty.')}</p>
    )
  if (query.isPending)
    return (
      <Skeleton
        label={text('Сверяем цену и остатки', 'Checking price and stock')}
        lines={3}
      />
    )
  if (query.isError) {
    return (
      <div>
        <InlineError
          title={text('Не удалось сверить корзину', 'Could not verify the cart')}
        >
          {text(
            'Цена и остаток не считаются доверенными до успешного повтора.',
            'Price and stock are not trusted until a successful retry.',
          )}
        </InlineError>
        <Button type="button" onClick={() => void query.refetch()}>
          {text('Повторить сверку', 'Retry verification')}
        </Button>
      </div>
    )
  }

  return (
    <ul className={`${styles.list ?? ''} ${compact ? (styles.compact ?? '') : ''}`}>
      {entries.map(({ line, record }) => (
        <li key={line.inventoryId} className={styles.line}>
          {record?.image && !failedImageIds.has(line.inventoryId) ? (
            <img
              src={record.image.src}
              alt=""
              width={record.image.width}
              height={record.image.height}
              onError={() =>
                setFailedImageIds((current) => new Set(current).add(line.inventoryId))
              }
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              ↗
            </div>
          )}
          <div className={styles.summary}>
            {record ? (
              <>
                <p>{record.brandName}</p>
                <LineHeading>
                  <Link to={productPath(record.productSlug, record.colorSlug)}>
                    {record.model}
                  </Link>
                </LineHeading>
                <p>
                  {localizeColorName(record.colorSlug, record.colorName, locale)} · EU{' '}
                  {record.sizeLabel}
                </p>
                <p className={styles.sku}>SKU {commerceReference(record.sku)}</p>
                {record.stock < 1 ? (
                  <strong className={styles.unavailable}>
                    {text(
                      'Нет в наличии — удалите позицию',
                      'Out of stock—remove this item',
                    )}
                  </strong>
                ) : line.quantity >= record.stock ? (
                  <span className={styles.stock}>
                    {text('Доступно', 'Available')}: {record.stock}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                <LineHeading>
                  {text('Позиция больше недоступна', 'Item no longer available')}
                </LineHeading>
                <p className={styles.sku}>ID {line.inventoryId}</p>
              </>
            )}
          </div>
          {!compact ? (
            <div
              className={styles.quantity}
              aria-label={text('Количество', 'Quantity')}
            >
              <button
                type="button"
                aria-label={text('Уменьшить количество', 'Decrease quantity')}
                disabled={cartPending || line.quantity <= 1}
                onClick={() => setCartQuantity(line.inventoryId, line.quantity - 1)}
              >
                −
              </button>
              <output aria-label={text('Количество товара', 'Product quantity')}>
                {line.quantity}
              </output>
              <button
                type="button"
                aria-label={text('Увеличить количество', 'Increase quantity')}
                disabled={
                  cartPending ||
                  !record ||
                  record.stock < 1 ||
                  line.quantity >= Math.min(10, record.stock)
                }
                onClick={() => setCartQuantity(line.inventoryId, line.quantity + 1)}
              >
                +
              </button>
            </div>
          ) : (
            <span className={styles.compactQuantity}>× {line.quantity}</span>
          )}
          <strong className={styles.price}>
            {record
              ? formatMoney(
                  {
                    amountMinor: record.price.amountMinor * line.quantity,
                    currency: record.price.currency,
                  },
                  intlLocale,
                )
              : '—'}
          </strong>
          <button
            type="button"
            className={styles.remove}
            aria-label={`${text('Удалить позицию', 'Remove item')} ${record?.model ?? line.inventoryId}`}
            onClick={() => {
              const removed = removeCartLine(line.inventoryId)
              if (removed) onRemove?.(removed)
            }}
          >
            {text('Удалить', 'Remove')}
          </button>
        </li>
      ))}
    </ul>
  )
}
