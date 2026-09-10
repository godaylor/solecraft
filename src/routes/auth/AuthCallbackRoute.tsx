import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'

import { paths } from '../../app/router/paths'
import { safeReturnTo, useAuth } from '../../app/providers/AuthProvider'
import {
  authReturnStorageKey,
  legacyAuthReturnStorageKey,
  migrateStorageKey,
} from '../../shared/config/storageKeys'
import styles from './AuthRoutes.module.scss'
import { useLocale } from '../../shared/i18n/locale'

export function AuthCallbackRoute() {
  const { text } = useLocale()
  const auth = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (auth.status !== 'authenticated') return
    migrateStorageKey(sessionStorage, authReturnStorageKey, [
      legacyAuthReturnStorageKey,
    ])
    const destination = safeReturnTo(sessionStorage.getItem(authReturnStorageKey))
    sessionStorage.removeItem(authReturnStorageKey)
    sessionStorage.removeItem(legacyAuthReturnStorageKey)
    void navigate(destination, { replace: true })
  }, [auth.status, navigate])

  if (auth.status === 'error' || auth.status === 'guest') {
    return (
      <section className={styles.state}>
        <h1>{text('Ссылка не сработала', 'The link did not work')}</h1>
        <p>
          {text(
            'Она могла истечь или уже быть использована.',
            'It may have expired or already been used.',
          )}
        </p>
        <Link to={paths.signIn}>{text('Запросить новую', 'Request a new link')}</Link>
      </section>
    )
  }
  return (
    <p className={styles.loading} role="status">
      {text('Завершаем безопасный вход…', 'Completing secure sign-in…')}
    </p>
  )
}
