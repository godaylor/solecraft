import styles from './InlineError.module.scss'
import { useLocale } from '../../i18n/locale'

type InlineErrorProps = {
  title?: string
  children: string
}

export function InlineError({ title, children }: InlineErrorProps) {
  const { text } = useLocale()
  return (
    <div className={styles.root} role="alert">
      <strong>{title ?? text('Не удалось выполнить действие', 'Action failed')}</strong>
      <span>{children}</span>
    </div>
  )
}
