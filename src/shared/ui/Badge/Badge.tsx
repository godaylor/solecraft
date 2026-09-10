import type { ReactNode } from 'react'

import styles from './Badge.module.scss'

type BadgeProps = {
  children: ReactNode
  tone?: 'neutral' | 'mint' | 'orange'
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`${styles.badge ?? ''} ${styles[tone] ?? ''}`}>{children}</span>
  )
}
