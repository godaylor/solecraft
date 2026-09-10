import { paths } from '../../app/router/paths'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import { useLocale } from '../../shared/i18n/locale'
import styles from '../../shared/ui/StatusPage/StatusPage.module.scss'

export function NotFoundRoute() {
  const { text } = useLocale()
  return (
    <section className={styles.status} aria-labelledby="not-found-title">
      <p className={styles.code}>404</p>
      <h1 id="not-found-title">{text('Такой страницы нет', 'Page not found')}</h1>
      <p>
        {text(
          'Маршрут не ведёт в каталог. Вернитесь к известной точке.',
          'This route does not lead to the catalog. Return to a known point.',
        )}
      </p>
      <ButtonLink to={paths.home}>{text('На главную', 'Go home')}</ButtonLink>
    </section>
  )
}
