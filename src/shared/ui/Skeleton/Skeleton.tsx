import styles from './Skeleton.module.scss'
import { useLocale } from '../../i18n/locale'

type SkeletonProps = {
  label?: string
  lines?: number
}

export function Skeleton({ label, lines = 3 }: SkeletonProps) {
  const { text } = useLocale()
  return (
    <div
      className={styles.root}
      role="status"
      aria-label={label ?? text('Загрузка', 'Loading')}
    >
      <div className={styles.media} aria-hidden="true" />
      {Array.from({ length: lines }, (_, index) => (
        <span className={styles.line} aria-hidden="true" key={index} />
      ))}
    </div>
  )
}
