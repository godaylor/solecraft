import { useState } from 'react'
import { Link } from 'react-router'

import { Badge } from '../../../shared/ui/Badge/Badge'
import { Price } from '../../../shared/ui/Price/Price'
import type { Product } from '../model/product'
import { FitLine } from './FitLine'
import { WishlistButton } from '../../wishlist/ui/WishlistButton'
import { useLocale } from '../../../shared/i18n/locale'
import styles from './ProductCard.module.scss'

type ProductCardProps = {
  product: Product
  href: string
  priority?: boolean
  headingLevel?: 2 | 3
}

export function ProductCard({
  product,
  href,
  priority = false,
  headingLevel = 3,
}: ProductCardProps) {
  const { text } = useLocale()
  const provenanceLabels: Record<Product['fit']['provenance'], string> = {
    manufacturer: text('Данные бренда', 'Brand data'),
    editorial_demo: text('Демо-оценка', 'Demo assessment'),
    unknown: text('Не оценено', 'Not assessed'),
  }
  const [imageFailed, setImageFailed] = useState(false)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <article className={styles.card} id={product.slug}>
      <div className={styles.media}>
        <WishlistButton productId={product.id} label={product.model} />
        {imageFailed ? (
          <div
            className={styles.imageFallback}
            role="img"
            aria-label={product.image.alt}
          >
            <span aria-hidden="true">↗</span>
            <span>
              {text('Изображение временно недоступно', 'Image temporarily unavailable')}
            </span>
          </div>
        ) : (
          <img
            src={product.image.src}
            alt={product.image.alt}
            width={product.image.width}
            height={product.image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <div
          className={styles.tags}
          aria-label={text('Сценарии использования', 'Use cases')}
        >
          {product.useCases.slice(0, 2).map((useCase) => (
            <Badge key={useCase.slug}>{useCase.label}</Badge>
          ))}
        </div>
      </div>

      <div className={styles.summary}>
        <p className={styles.brand}>{product.brand.name}</p>
        <Heading className={styles.title}>
          <Link
            to={href}
            aria-label={`${product.title} — ${text(
              'открыть карточку товара',
              'open product details',
            )}`}
          >
            {product.model}
          </Link>
        </Heading>
        <Price value={product.price} />
        <p className={styles.availability}>
          {product.availability.inStock
            ? `${text('В наличии', 'In stock')} · ${product.availableSizes.length} ${text(
                'EU размеров',
                'EU sizes',
              )}`
            : text('Нет в наличии', 'Out of stock')}
        </p>
      </div>

      <div className={styles.fit}>
        <div className={styles.fitHeading}>
          <span>{text('Линия посадки', 'Fit line')}</span>
          <span>{provenanceLabels[product.fit.provenance]}</span>
        </div>
        <FitLine compact fit={product.fit} />
      </div>
    </article>
  )
}
