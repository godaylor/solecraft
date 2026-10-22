import styles from './BrandMark.module.scss'

type BrandMarkProps = {
  variant?: 'header' | 'footer'
}

export function BrandMark({ variant = 'header' }: BrandMarkProps) {
  return (
    <span
      className={`${styles.mark} ${styles[variant]}`}
      data-brand-mark={variant}
      aria-hidden="true"
    >
      <img
        className={styles.image}
        src="/brand/solecraft-emblem-96.webp"
        srcSet="/brand/solecraft-emblem-96.webp 96w, /brand/solecraft-emblem-192.webp 192w, /brand/solecraft-emblem-384.webp 384w"
        sizes={
          variant === 'footer'
            ? '(max-width: 1000px) 56px, 64px'
            : '(max-width: 380px) 32px, (max-width: 1000px) 36px, 44px'
        }
        width={96}
        height={96}
        alt=""
        decoding="async"
      />
    </span>
  )
}
