import { Link, type LinkProps } from 'react-router'

import styles from './TextLink.module.scss'

type TextLinkProps = Omit<LinkProps, 'className'> & { className?: string }

export function TextLink({ className, children, ...props }: TextLinkProps) {
  return (
    <Link className={[styles.link, className].filter(Boolean).join(' ')} {...props}>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </Link>
  )
}
