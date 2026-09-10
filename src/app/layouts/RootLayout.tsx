import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { IconButton } from '../../shared/ui/IconButton/IconButton'
import type { CartRepository } from '../../entities/cart/api/CartRepository'
import { applyGuestCartStorageEvent } from '../../entities/cart/model/guestCartStore'
import { CartQuickSheet } from '../../entities/cart/ui/CartQuickSheet'
import { useLocale } from '../../shared/i18n/locale'
import { useAuth } from '../providers/AuthProvider'
import { useCommerce } from '../providers/CommerceProvider'
import { paths } from '../router/paths'
import { MobileNavigation } from './MobileNavigation'
import styles from './RootLayout.module.scss'

function navClassName({ isActive }: { isActive: boolean }): string {
  return `${styles.navLink ?? ''} ${isActive ? (styles.navLinkActive ?? '') : ''}`
}

export function RootLayout({ cartRepository }: { cartRepository: CartRepository }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const auth = useAuth()
  const commerce = useCommerce()
  const { locale, setLocale, text } = useLocale()

  useEffect(() => {
    window.addEventListener('storage', applyGuestCartStorageEvent)
    return () => window.removeEventListener('storage', applyGuestCartStorageEvent)
  }, [])

  return (
    <div className={styles.app}>
      <nav
        className={styles.skipNavigation}
        aria-label={text('Быстрый переход', 'Skip navigation')}
      >
        <a className={styles.skipLink} href="#main-content">
          {text('К основному содержанию', 'Skip to main content')}
        </a>
      </nav>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink
            className={styles.brand ?? ''}
            to={paths.home}
            aria-label={text('Solecraft — на главную', 'Solecraft — home')}
          >
            <span className={styles.brandWord}>Solecraft</span>
            <span className={styles.brandNote}>
              {text('fit-first / город', 'fit-first / city')}
            </span>
          </NavLink>

          <nav
            className={styles.desktopNavigation}
            aria-label={text('Основная навигация', 'Primary navigation')}
          >
            <ul className={styles.navList}>
              <li>
                <NavLink className={navClassName} end to={paths.home}>
                  {text('Главная', 'Home')}
                </NavLink>
              </li>
              <li>
                <NavLink className={navClassName} to={paths.catalog}>
                  {text('Каталог', 'Catalog')}
                </NavLink>
              </li>
              <li>
                <Link className={styles.navLink} to="/#fit-method">
                  {text('Как выбрать', 'How to choose')}
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.headerActions}>
            <div
              className={styles.localeSwitch}
              role="group"
              aria-label={text('Язык интерфейса', 'Interface language')}
            >
              {(['ru', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={locale === option}
                  aria-label={
                    option === 'ru'
                      ? text('Русский язык', 'Russian language')
                      : text('Английский язык', 'English language')
                  }
                  onClick={() => setLocale(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <Link className={styles.utilityLink} to={paths.wishlist}>
              {text('Избранное', 'Wishlist')}{' '}
              <span>{commerce.wishlistProductIds.length}</span>
            </Link>
            <CartQuickSheet repository={cartRepository} />
            <Link
              className={styles.utilityLink}
              to={auth.status === 'authenticated' ? paths.account : paths.signIn}
            >
              {auth.status === 'authenticated'
                ? text('Аккаунт', 'Account')
                : text('Войти', 'Sign in')}
            </Link>
            <IconButton
              ref={menuButtonRef}
              className={styles.menuButton}
              label={text('Открыть меню', 'Open menu')}
              aria-expanded={mobileNavigationOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <span className={styles.menuIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </IconButton>
          </div>
        </div>
      </header>

      <MobileNavigation
        open={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
        triggerRef={menuButtonRef}
      />

      {commerce.announcement ? (
        <p
          key={commerce.announcement.id}
          className="visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {commerce.announcement.text}
        </p>
      ) : null}

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span>Solecraft</span>
            <p>
              {text(
                'Городские кроссовки с понятной посадкой.',
                'City sneakers with clear fit guidance.',
              )}
            </p>
          </div>
          <nav aria-label={text('Справочная навигация', 'Help navigation')}>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/#fit-method">
                  {text('Подход к посадке', 'Fit approach')}
                </Link>
              </li>
              <li>
                <Link to="/#store-policy">
                  {text('Доставка и возврат', 'Delivery and returns')}
                </Link>
              </li>
              <li>
                <NavLink to={paths.catalog}>{text('Каталог', 'Catalog')}</NavLink>
              </li>
            </ul>
          </nav>
          <p className={styles.disclaimer}>
            {text(
              'Демо-каталог. Fit-данные — ориентир с указанным источником, а не медицинская рекомендация.',
              'Demo catalog. Fit data is source-aware guidance, not medical advice.',
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}
