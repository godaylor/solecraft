import type { ComponentPropsWithoutRef } from 'react'

import styles from './Button.module.scss'
import { useLocale } from '../../i18n/locale'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const { text } = useLocale()
  const classNames = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classNames}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? text('Подождите…', 'Please wait…') : children}
    </button>
  )
}
