import { useState } from 'react'
import { Link } from 'react-router'

import { paths } from '../../app/router/paths'
import { useCommerce } from '../../app/providers/CommerceProvider'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import { calculateCartTotals } from '../../entities/cart/model/cartTotals'
import type { GuestCartLine } from '../../entities/cart/model/guestCartStore'
import { CartLines } from '../../entities/cart/ui/CartLines'
import { useCartView } from '../../entities/cart/ui/useCartView'
import { formatMoney } from '../../shared/lib/formatMoney'
import { useLocale } from '../../shared/i18n/locale'
import { Button } from '../../shared/ui/Button/Button'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import styles from './CartRoute.module.scss'

export function CartRoute({ cartRepository }: { cartRepository: CartRepository }) {
  const { intlLocale, text } = useLocale()
  const [lastRemoved, setLastRemoved] = useState<GuestCartLine>()
  const [confirmClear, setConfirmClear] = useState(false)
  const { restoreCartLine: restore, clearCart: clear } = useCommerce()
  const { lines, entries, subtotal } = useCartView(cartRepository)
  const totals = calculateCartTotals(subtotal)
  const hasUnavailable = entries.some(({ record }) => !record || record.stock < 1)

  return (
    <section className={styles.page} aria-labelledby="cart-title">
      <header className={styles.heading}>
        <div>
          <p>{text('точные SKU / актуальная сверка', 'exact SKU / live check')}</p>
          <h1 id="cart-title">{text('Корзина', 'Cart')}</h1>
        </div>
        <Link to={paths.catalog}>{text('Продолжить выбор', 'Keep browsing')}</Link>
      </header>

      {lastRemoved ? (
        <div className={styles.undo} role="status">
          {text('Позиция удалена.', 'Item removed.')}
          <button
            type="button"
            onClick={() => {
              restore(lastRemoved)
              setLastRemoved(undefined)
            }}
          >
            {text('Отменить', 'Undo')}
          </button>
        </div>
      ) : null}

      <CartLines repository={cartRepository} onRemove={setLastRemoved} />

      {lines.length ? (
        <div className={styles.bottom}>
          <div className={styles.clear}>
            {confirmClear ? (
              <>
                <span>{text('Очистить всю корзину?', 'Clear the entire cart?')}</span>
                <Button
                  type="button"
                  onClick={() => {
                    clear()
                    setConfirmClear(false)
                  }}
                >
                  {text('Да, очистить', 'Yes, clear')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmClear(false)}
                >
                  {text('Отмена', 'Cancel')}
                </Button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)}>
                {text('Очистить корзину', 'Clear cart')}
              </button>
            )}
          </div>
          <aside
            className={styles.summary}
            aria-label={text('Итого корзины', 'Cart total')}
          >
            <p>
              <span>{text('Товаров', 'Items')}</span>
              <strong>{lines.reduce((sum, line) => sum + line.quantity, 0)}</strong>
            </p>
            <p>
              <span>{text('Подытог', 'Subtotal')}</span>
              <strong>
                {formatMoney({ amountMinor: subtotal, currency: 'RUB' }, intlLocale)}
              </strong>
            </p>
            <p>
              <span>{text('Доставка, оценка', 'Estimated delivery')}</span>
              <strong>
                {totals.deliveryMinor
                  ? formatMoney(
                      { amountMinor: totals.deliveryMinor, currency: 'RUB' },
                      intlLocale,
                    )
                  : text('Бесплатно', 'Free')}
              </strong>
            </p>
            <p>
              <span>{text('Оценка итога', 'Estimated total')}</span>
              <strong>
                {formatMoney(
                  {
                    amountMinor: totals.estimatedTotalMinor,
                    currency: 'RUB',
                  },
                  intlLocale,
                )}
              </strong>
            </p>
            <small>
              {hasUnavailable
                ? text(
                    'Удалите недоступные позиции перед оформлением.',
                    'Remove unavailable items before checkout.',
                  )
                : text(
                    'Цена и остатки сверены с каталогом.',
                    'Price and stock match the catalog.',
                  )}
            </small>
            {!hasUnavailable ? (
              <ButtonLink to={paths.checkoutContact}>
                {text('Перейти к оформлению', 'Go to checkout')}
              </ButtonLink>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  )
}
