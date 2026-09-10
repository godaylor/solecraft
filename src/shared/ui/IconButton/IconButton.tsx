import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

import styles from './IconButton.module.scss'

type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'aria-label'> & {
  label: string
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={[styles.button, className].filter(Boolean).join(' ')}
        aria-label={label}
        type="button"
        {...props}
      >
        {children}
      </button>
    )
  },
)
