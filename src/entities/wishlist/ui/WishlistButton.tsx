import { useCommerce } from '../../../app/providers/CommerceProvider'
import styles from './WishlistButton.module.scss'
import { useLocale } from '../../../shared/i18n/locale'

export function WishlistButton({
  productId,
  label,
}: {
  productId: string
  label: string
}) {
  const { text } = useLocale()
  const { wishlistProductIds, wishlistPending, toggleWishlist } = useCommerce()
  const active = wishlistProductIds.includes(productId)
  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={active}
      aria-label={`${
        active
          ? text('Убрать из избранного', 'Remove from wishlist')
          : text('Добавить в избранное', 'Add to wishlist')
      }: ${label}`}
      disabled={wishlistPending}
      onClick={() => toggleWishlist(productId)}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12 20.4 4.3 13A5.1 5.1 0 0 1 11.5 5.8L12 6.3l.5-.5A5.1 5.1 0 0 1 19.7 13Z"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  )
}
