import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { paths, productPath } from '../../app/router/paths'
import { useAuth } from '../../app/providers/AuthProvider'
import { useCommerce } from '../../app/providers/CommerceProvider'
import type { OwnerCommerceRepository } from '../../entities/account/api/OwnerCommerceRepository'
import { ProductCard } from '../../entities/product/ui/ProductCard'
import { localizeProduct } from '../../entities/product/model/productLocalization'
import { useLocale } from '../../shared/i18n/locale'
import { InlineError } from '../../shared/ui/InlineError/InlineError'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import { Button } from '../../shared/ui/Button/Button'
import styles from './WishlistRoute.module.scss'

export function WishlistRoute({ repository }: { repository: OwnerCommerceRepository }) {
  const { locale, text } = useLocale()
  const { wishlistProductIds } = useCommerce()
  const auth = useAuth()
  const query = useQuery({
    queryKey:
      auth.status === 'authenticated'
        ? ['owner', auth.user?.id, 'wishlist-products', [...wishlistProductIds].sort()]
        : ['guest', 'wishlist-products', [...wishlistProductIds].sort()],
    queryFn: () => repository.getWishlistProducts(wishlistProductIds),
    enabled: wishlistProductIds.length > 0,
  })
  return (
    <section className={styles.page} aria-labelledby="wishlist-title">
      <header>
        <p>{text('сохранённые пары', 'saved sneakers')}</p>
        <h1 id="wishlist-title">{text('Избранное', 'Wishlist')}</h1>
      </header>
      {!wishlistProductIds.length ? (
        <div className={styles.empty}>
          <h2>{text('Здесь пока пусто', 'Nothing saved yet')}</h2>
          <p>
            {text(
              'Сохраняйте пары из каталога — гостевой список переживёт reload.',
              'Save sneakers from the catalog—the guest list survives reload.',
            )}
          </p>
          <Link to={paths.catalog}>{text('В каталог', 'Back to catalog')}</Link>
        </div>
      ) : query.isPending ? (
        <Skeleton label={text('Загружаем избранное', 'Loading wishlist')} lines={4} />
      ) : query.isError ? (
        <div className={styles.error}>
          <InlineError
            title={text('Не удалось открыть избранное', 'Could not open wishlist')}
          >
            {text(
              'Сохранённый список не изменился. Повторите загрузку.',
              'The saved list was not changed. Retry loading.',
            )}
          </InlineError>
          <Button type="button" onClick={() => void query.refetch()}>
            {text('Повторить', 'Retry')}
          </Button>
        </div>
      ) : query.data.length === 0 ? (
        <div className={styles.empty}>
          <h2>
            {text(
              'Сохранённые пары больше недоступны',
              'Saved sneakers are no longer available',
            )}
          </h2>
          <p>
            {text(
              'Удалите их из списка или выберите актуальную модель в каталоге.',
              'Remove them from the list or choose a current model in the catalog.',
            )}
          </p>
          <Link to={paths.catalog}>{text('В каталог', 'Back to catalog')}</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {query.data.map((product) => (
            <ProductCard
              key={product.id}
              product={localizeProduct(product, locale)}
              href={productPath(product.slug)}
              headingLevel={2}
            />
          ))}
        </div>
      )}
    </section>
  )
}
