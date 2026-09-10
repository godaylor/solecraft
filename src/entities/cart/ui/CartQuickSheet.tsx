import { useEffect, useRef, useState } from 'react'

import { paths } from '../../../app/router/paths'
import { useCommerce } from '../../../app/providers/CommerceProvider'
import { ButtonLink } from '../../../shared/ui/Button/ButtonLink'
import { IconButton } from '../../../shared/ui/IconButton/IconButton'
import { useLocale } from '../../../shared/i18n/locale'
import { formatMoney } from '../../../shared/lib/formatMoney'
import type { CartRepository } from '../api/CartRepository'
import { CartLines } from './CartLines'
import { useCartView } from './useCartView'
import styles from './CartQuickSheet.module.scss'

export function CartQuickSheet({ repository }: { repository: CartRepository }) {
  const { intlLocale, text } = useLocale()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { cartLines } = useCommerce()
  const count = cartLines.reduce((sum, line) => sum + line.quantity, 0)
  const { subtotal } = useCartView(repository)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const trigger = triggerRef.current
    const main = document.getElementById('main-content')
    const previousOverflow = document.body.style.overflow
    if (!dialog) return
    dialog.showModal()
    main?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    dialog.querySelector<HTMLElement>('button')?.focus()
    return () => {
      main?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
      trigger?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {text('Корзина', 'Cart')}{' '}
        <span aria-label={`${count} ${text('товаров', 'items')}`}>{count}</span>
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-labelledby="quick-cart-title"
          onCancel={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div className={styles.panel}>
            <div className={styles.heading}>
              <div>
                <p>{text('быстрая сверка', 'quick check')}</p>
                <h2 id="quick-cart-title">{text('Корзина', 'Cart')}</h2>
              </div>
              <IconButton
                label={text('Закрыть корзину', 'Close cart')}
                onClick={() => setOpen(false)}
              >
                ×
              </IconButton>
            </div>
            <div className={styles.content}>
              <CartLines compact repository={repository} />
            </div>
            <div className={styles.footer}>
              <p>
                {text('Подытог', 'Subtotal')}{' '}
                <strong>
                  {formatMoney({ amountMinor: subtotal, currency: 'RUB' }, intlLocale)}
                </strong>
              </p>
              <ButtonLink to={paths.cart} onClick={() => setOpen(false)}>
                {text('Открыть корзину', 'Open cart')}
              </ButtonLink>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
