import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { paths } from '../../app/router/paths'
import { safeReturnTo, useAuth } from '../../app/providers/AuthProvider'
import { Button } from '../../shared/ui/Button/Button'
import { useLocale } from '../../shared/i18n/locale'
import { emailSignInEnabled } from '../../shared/config/emailSignIn'
import styles from './AuthRoutes.module.scss'

export function SignInRoute() {
  const { text } = useLocale()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setState('sending')
    try {
      await auth.signInWithEmail(
        email.trim(),
        safeReturnTo(searchParams.get('returnTo')),
      )
      setState('sent')
    } catch {
      setState('error')
    }
  }

  if (auth.status === 'authenticated') {
    return (
      <section className={styles.state}>
        <h1>{text('Вы уже вошли', 'You are already signed in')}</h1>
        <Link to={paths.account}>{text('В аккаунт', 'Open account')}</Link>
      </section>
    )
  }
  if (!emailSignInEnabled()) {
    return (
      <section className={styles.state} aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">
          {text(
            'Вход по email временно недоступен',
            'Email sign-in is temporarily unavailable',
          )}
        </h1>
        <p>
          {text(
            'Вы можете выбрать обувь и оформить демо-заказ без регистрации. Избранное и корзина сохраняются в этом браузере.',
            'You can browse shoes and place a demo order without registering. Your wishlist and cart are saved in this browser.',
          )}
        </p>
        <p>
          {text(
            'Гостевой заказ не добавляется в историю аккаунта. Подтверждение доступно в этой же сессии браузера.',
            'Guest orders are not added to account history. The receipt is available in the same browser session.',
          )}
        </p>
        <Link to={paths.catalog}>
          {text('Перейти в каталог', 'Browse the catalog')}
        </Link>
        {' · '}
        <Link to={paths.cart}>{text('Открыть корзину', 'Open cart')}</Link>
      </section>
    )
  }
  return (
    <section className={styles.page} aria-labelledby="sign-in-title">
      <div>
        <p>{text('без пароля / ссылка на email', 'passwordless / email link')}</p>
        <h1 id="sign-in-title">{text('Войти по email', 'Sign in with email')}</h1>
        <p>
          {text(
            'Отправим одноразовую ссылку для входа. Пароль и данные карты не нужны.',
            'We will send a one-time sign-in link. No password or card details needed.',
          )}
        </p>
      </div>
      <form onSubmit={(event) => void submit(event)} noValidate>
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" isLoading={state === 'sending'} disabled={!email.trim()}>
          {text('Отправить ссылку', 'Send link')}
        </Button>
        <p role="status" aria-live="polite">
          {state === 'sent'
            ? text(
                'Ссылка отправлена. Откройте её в этой вкладке браузера.',
                'Link sent. Open it in this browser tab.',
              )
            : state === 'error'
              ? text(
                  'Не удалось отправить ссылку. Проверьте email и повторите.',
                  'Could not send the link. Check the email and retry.',
                )
              : ''}
        </p>
      </form>
    </section>
  )
}
