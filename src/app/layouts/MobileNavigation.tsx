import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { Link, NavLink } from 'react-router'

import { paths } from '../router/paths'
import { IconButton } from '../../shared/ui/IconButton/IconButton'
import { useAuth } from '../providers/AuthProvider'
import { useCommerce } from '../providers/CommerceProvider'
import { useLocale } from '../../shared/i18n/locale'
import styles from './MobileNavigation.module.scss'

type MobileNavigationProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

function mobileNavClass({ isActive }: { isActive: boolean }): string {
  return `${styles.link ?? ''} ${isActive ? (styles.active ?? '') : ''}`
}

export function MobileNavigation({ open, onClose, triggerRef }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const auth = useAuth()
  const commerce = useCommerce()
  const { text } = useLocale()

  useEffect(() => {
    if (!open) {
      return
    }

    const dialog = dialogRef.current
    const trigger = triggerRef.current
    const main = document.getElementById('main-content')
    const footer = document.querySelector('footer')
    const previousOverflow = document.body.style.overflow

    if (!dialog) {
      return
    }

    if (typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }

    main?.setAttribute('inert', '')
    footer?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      dialog.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus()
    })

    return () => {
      window.cancelAnimationFrame(focusFrame)
      main?.removeAttribute('inert')
      footer?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow

      if (dialog.open && typeof dialog.close === 'function') {
        dialog.close()
      }

      trigger?.focus()
    }
  }, [open, triggerRef])

  if (!open) {
    return null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      ),
    )
    const first = focusable[0]
    const last = focusable.at(-1)

    if (!first || !last) {
      return
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <dialog
      id="mobile-navigation"
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="mobile-nav-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>{text('Навигация', 'Navigation')}</p>
            <h2 id="mobile-nav-title">{text('Куда идём?', 'Where to?')}</h2>
          </div>
          <IconButton label={text('Закрыть меню', 'Close menu')} onClick={onClose}>
            <span className={styles.closeIcon} aria-hidden="true">
              ×
            </span>
          </IconButton>
        </div>

        <nav aria-label={text('Мобильная навигация', 'Mobile navigation')}>
          <ul className={styles.list}>
            <li>
              <NavLink className={mobileNavClass} end to={paths.home} onClick={onClose}>
                <span>{text('Главная', 'Home')}</span>
                <span aria-hidden="true">↗</span>
              </NavLink>
            </li>
            <li>
              <NavLink className={mobileNavClass} to={paths.catalog} onClick={onClose}>
                <span>{text('Каталог', 'Catalog')}</span>
                <span aria-hidden="true">↗</span>
              </NavLink>
            </li>
            <li>
              <Link className={styles.link} to="/#fit-method" onClick={onClose}>
                <span>{text('Как читаем посадку', 'How we explain fit')}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
            <li>
              <Link className={styles.link} to={paths.wishlist} onClick={onClose}>
                <span>
                  {text('Избранное', 'Wishlist')} · {commerce.wishlistProductIds.length}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
            <li>
              <Link
                className={styles.link}
                to={auth.status === 'authenticated' ? paths.account : paths.signIn}
                onClick={onClose}
              >
                <span>
                  {auth.status === 'authenticated'
                    ? text('Аккаунт', 'Account')
                    : text('Войти', 'Sign in')}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          </ul>
        </nav>

        <p className={styles.note}>
          {text(
            'Подбираем по ширине, амортизации и поддержке — без обещаний угадать за вас.',
            'Choose by width, cushioning, and support—without claims of guessing for you.',
          )}
        </p>
      </div>
    </dialog>
  )
}
