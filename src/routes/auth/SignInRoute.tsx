import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { paths } from '../../app/router/paths'
import { safeReturnTo, useAuth } from '../../app/providers/AuthProvider'
import { Button } from '../../shared/ui/Button/Button'
import { useLocale } from '../../shared/i18n/locale'
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
  return (
    <section className={styles.page} aria-labelledby="sign-in-title">
      <div>
        <p>{text('без пароля / ссылка на email', 'passwordless / email link')}</p>
        <h1 id="sign-in-title">{text('Войти по email', 'Sign in with email')}</h1>
        <p>
          {text(
            'Отправим одноразовую magic link. Пароль и данные карты не нужны.',
            'We will send a one-time magic link. No password or card details needed.',
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
