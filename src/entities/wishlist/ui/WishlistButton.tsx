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
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
    </button>
  )
}
