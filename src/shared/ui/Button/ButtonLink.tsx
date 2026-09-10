import { Link, type LinkProps } from 'react-router'

import styles from './Button.module.scss'

type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  className?: string
  variant?: 'primary' | 'secondary'
}

export function ButtonLink({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </Link>
  )
}
