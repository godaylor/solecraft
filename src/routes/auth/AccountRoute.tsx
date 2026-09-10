import { useState } from 'react'
import { Link } from 'react-router'

import { paths } from '../../app/router/paths'
import { useAuth } from '../../app/providers/AuthProvider'
import { useCommerce } from '../../app/providers/CommerceProvider'
import { Button } from '../../shared/ui/Button/Button'
import { useLocale } from '../../shared/i18n/locale'
import styles from './AuthRoutes.module.scss'

export function AccountRoute() {
  const { text } = useLocale()
  const auth = useAuth()
  const commerce = useCommerce()
  const [error, setError] = useState('')
  if (auth.status === 'loading')
    return (
      <p className={styles.loading} role="status">
        {text('Проверяем сессию…', 'Checking session…')}
      </p>
    )
  if (auth.status === 'error')
    return (
      <section className={styles.state}>
        <h1>{text('Не удалось проверить сессию', 'Could not verify session')}</h1>
        <p>
          {text(
            'Данные аккаунта скрыты до успешной повторной проверки.',
            'Account data remains hidden until a successful retry.',
          )}
        </p>
        <Button type="button" onClick={() => void auth.refreshSession()}>
          {text('Повторить', 'Retry')}
        </Button>
      </section>
    )
  if (auth.status !== 'authenticated') {
    return (
      <section className={styles.state}>
        <h1>{text('Войдите в аккаунт', 'Sign in to your account')}</h1>
        <p>
          {text(
            'История и owner-only списки доступны после magic link.',
            'Order history and owner-only lists are available after magic-link sign-in.',
          )}
        </p>
        <Link to={`${paths.signIn}?returnTo=${encodeURIComponent(paths.account)}`}>
          {text('Войти', 'Sign in')}
        </Link>
      </section>
    )
  }
  return (
    <section className={styles.account} aria-labelledby="account-title">
      <p>owner-only / RLS</p>
      <h1 id="account-title">{text('Аккаунт', 'Account')}</h1>
      <p>{auth.user?.email}</p>
      <p role="status">
        {commerce.mergeStatus === 'merging'
          ? text('Объединяем гостевые данные…', 'Merging guest data…')
          : commerce.mergeStatus === 'success'
            ? text('Гостевые данные объединены.', 'Guest data merged.')
            : commerce.mergeStatus === 'error'
              ? text(
                  'Не удалось объединить данные — гостевая копия сохранена для повтора.',
                  'Could not merge data—the guest copy is preserved for retry.',
                )
              : ''}
      </p>
      <nav aria-label={text('Разделы аккаунта', 'Account sections')}>
        <Link to={paths.wishlist}>
          {text('Избранное', 'Wishlist')} · {commerce.wishlistProductIds.length}
        </Link>
        <Link to={paths.cart}>
          {text('Корзина', 'Cart')} · {commerce.cartLines.length}
        </Link>
        <Link to={paths.accountOrders}>{text('Заказы', 'Orders')}</Link>
      </nav>
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          void auth
            .signOut()
            .catch(() =>
              setError(
                text('Не удалось выйти. Повторите.', 'Could not sign out. Retry.'),
              ),
            )
        }
      >
        {text('Выйти', 'Sign out')}
      </Button>
      <p role="alert">{error}</p>
    </section>
  )
}
