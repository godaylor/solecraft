import { commerceReference } from '../../shared/lib/commerceReference'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { paths } from '../../app/router/paths'
import { useCommerceCartHandoff } from '../../app/providers/CommerceProvider'
import type { CartHandoff } from '../../entities/cart/model/cartHandoff'
import {
  ProductRepositoryError,
  type ProductRepository,
} from '../../entities/product/api/ProductRepository'
import { productDetailQueryOptions } from '../../entities/product/api/productQuery'
import type {
  ProductDetails,
  ProductVariant,
} from '../../entities/product/model/product'
import { localizeProductDetails } from '../../entities/product/model/productLocalization'
import { FitLine } from '../../entities/product/ui/FitLine'
import { WishlistButton } from '../../entities/wishlist/ui/WishlistButton'
import { Button } from '../../shared/ui/Button/Button'
import { InlineError } from '../../shared/ui/InlineError/InlineError'
import { Price } from '../../shared/ui/Price/Price'
import { Skeleton } from '../../shared/ui/Skeleton/Skeleton'
import { useLocale } from '../../shared/i18n/locale'
import { resolveProductVariant } from './productVariant'
import styles from './ProductRoute.module.scss'

function ProductGallery({ variant }: { variant: ProductVariant }) {
  const { text } = useLocale()
  const [activeId, setActiveId] = useState(variant.media[0]?.id)
  const [failedMediaIds, setFailedMediaIds] = useState<Set<string>>(() => new Set())
  const active =
    variant.media.find((media) => media.id === activeId) ?? variant.media[0]

  if (!active) {
    return (
      <div className={styles.mediaFallback}>
        {text('Изображение временно недоступно', 'Image temporarily unavailable')}
      </div>
    )
  }

  return (
    <div
      className={styles.gallery}
      aria-label={text('Галерея товара', 'Product gallery')}
    >
      <div className={styles.primaryMedia}>
        {failedMediaIds.has(active.id) ? (
          <div className={styles.mediaFallback} role="img" aria-label={active.alt}>
            {text('Изображение временно недоступно', 'Image temporarily unavailable')}
          </div>
        ) : (
          <img
            src={active.src}
            srcSet={active.srcSet}
            sizes="(min-width: 900px) 58vw, 100vw"
            alt={active.alt}
            width={active.width}
            height={active.height}
            fetchPriority="high"
            onError={() =>
              setFailedMediaIds((current) => new Set(current).add(active.id))
            }
          />
        )}
        <span>
          {text('цвет', 'color')} / {variant.color.name}
        </span>
      </div>
      {variant.media.length > 1 ? (
        <div
          className={styles.thumbnails}
          aria-label={text('Выберите изображение', 'Choose an image')}
        >
          {variant.media.map((media) => (
            <button
              type="button"
              key={media.id}
              aria-pressed={media.id === active.id}
              aria-label={`${text('Показать', 'Show')}: ${media.alt}`}
              onClick={() => setActiveId(media.id)}
            >
              {failedMediaIds.has(media.id) ? (
                <span className={styles.thumbnailFallback} aria-hidden="true">
                  {text('Фото недоступно', 'Photo unavailable')}
                </span>
              ) : (
                <img
                  src={media.src}
                  srcSet={media.srcSet}
                  sizes="96px"
                  alt=""
                  width={media.width}
                  height={media.height}
                  onError={() =>
                    setFailedMediaIds((current) => new Set(current).add(media.id))
                  }
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SizeGuide({ product }: { product: ProductDetails }) {
  const { text } = useLocale()
  const provenanceLabels: Record<ProductDetails['fit']['provenance'], string> = {
    manufacturer: text('Данные производителя', 'Manufacturer data'),
    editorial_demo: text('Редакционная демо-оценка', 'Editorial demo assessment'),
    unknown: text('Источник не подтверждён', 'Source not confirmed'),
  }
  return (
    <details className={styles.guide}>
      <summary>{text('Как выбрать размер', 'How to choose a size')}</summary>
      <p>
        {text(
          'Измерьте стопу вечером и сравните диапазон в миллиметрах. Это справочник бренда, не персональная рекомендация.',
          'Measure your foot in the evening and compare the millimeter range. This is a brand guide, not a personal recommendation.',
        )}
      </p>
      <div className={styles.tableScroll}>
        <table>
          <caption className="visually-hidden">
            {text('Размерная сетка', 'Size guide')} {product.brand.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">EU</th>
              <th scope="col">{text('Стопа', 'Foot')}</th>
              <th scope="col">{text('Источник', 'Source')}</th>
            </tr>
          </thead>
          <tbody>
            {product.sizeGuide.map((entry) => (
              <tr key={entry.sizeId}>
                <th scope="row">{entry.sizeLabel}</th>
                <td>
                  {entry.footLengthMinMm && entry.footLengthMaxMm
                    ? `${entry.footLengthMinMm}–${entry.footLengthMaxMm} ${text(
                        'мм',
                        'mm',
                      )}`
                    : text('Нет подтверждённого соответствия', 'No confirmed mapping')}
                </td>
                <td>{provenanceLabels[entry.provenance]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function ProductPage({
  product,
  cartHandoff,
}: {
  product: ProductDetails
  cartHandoff: CartHandoff
}) {
  const { text } = useLocale()
  const fitNotes: Record<ProductDetails['fit']['note'], string> = {
    runs_small: text(
      'Модель маломерит — начните примерку с большего размера.',
      'This model runs small—start with a larger size.',
    ),
    true_to_size: text(
      'Обычно соответствует размеру бренда.',
      'Usually true to the brand size.',
    ),
    runs_large: text(
      'Модель большемерит — сравните соседний меньший размер.',
      'This model runs large—compare the next size down.',
    ),
    unknown: text(
      'Особенности размерности пока не оценены.',
      'Sizing behavior has not been assessed.',
    ),
  }
  const provenanceLabels: Record<ProductDetails['fit']['provenance'], string> = {
    manufacturer: text('Данные производителя', 'Manufacturer data'),
    editorial_demo: text('Редакционная демо-оценка', 'Editorial demo assessment'),
    unknown: text('Источник не подтверждён', 'Source not confirmed'),
  }
  const [searchParams, setSearchParams] = useSearchParams()
  const colorParam = searchParams.get('color')
  const { variant, canonicalColor } = useMemo(
    () => resolveProductVariant(product, colorParam),
    [colorParam, product],
  )
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>()
  const [selectionError, setSelectionError] = useState(false)
  const [feedback, setFeedback] = useState<{
    variantId: string
    text: string
  }>()
  const sizeGroupRef = useRef<HTMLFieldSetElement>(null)

  useEffect(() => {
    if (colorParam === canonicalColor) return
    const next = new URLSearchParams(searchParams)
    if (canonicalColor) next.set('color', canonicalColor)
    else next.delete('color')
    setSearchParams(next, { replace: true })
  }, [canonicalColor, colorParam, searchParams, setSearchParams])

  const selected = variant.inventory.find(
    (item) => item.inventoryId === selectedInventoryId,
  )

  const addToCart = () => {
    if (!selected || selected.stock < 1) {
      setSelectionError(true)
      sizeGroupRef.current
        ?.querySelector<HTMLButtonElement>('button:not([disabled])')
        ?.focus()
      return
    }
    cartHandoff.add({
      inventoryId: selected.inventoryId,
      sku: selected.sku,
      quantity: 1,
      maxQuantity: selected.stock,
    })
    setSelectionError(false)
    setFeedback({
      variantId: variant.id,
      text: text(
        `EU ${selected.sizeLabel}, ${variant.color.name} добавлен в корзину.`,
        `EU ${selected.sizeLabel}, ${variant.color.name} added to cart.`,
      ),
    })
  }

  return (
    <article className={styles.page}>
      <nav
        className={styles.breadcrumbs}
        aria-label={text('Хлебные крошки', 'Breadcrumbs')}
      >
        <Link to={paths.catalog}>{text('Каталог', 'Catalog')}</Link>
        <span aria-hidden="true">/</span>
        <span>{product.model}</span>
      </nav>

      <div className={styles.layout}>
        <ProductGallery key={variant.id} variant={variant} />
        <section className={styles.purchase} aria-labelledby="product-title">
          <p className={styles.kicker}>
            {product.brand.name} / {product.category.name}
          </p>
          <h1 id="product-title">{product.model}</h1>
          <WishlistButton productId={product.id} label={product.model} />
          <p className={styles.description}>{product.description}</p>
          <Price value={variant.price} />

          <fieldset className={styles.colorways}>
            <legend>
              {text('Цвет', 'Color')}: <strong>{variant.color.name}</strong>
            </legend>
            <div>
              {product.variants.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={item.id === variant.id}
                  aria-label={`${item.color.name}${
                    item.id === variant.id ? text(', выбран', ', selected') : ''
                  }`}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    if (item.isDefault) next.delete('color')
                    else next.set('color', item.color.slug)
                    setSelectedInventoryId(undefined)
                    setSelectionError(false)
                    setFeedback(undefined)
                    setSearchParams(next)
                  }}
                >
                  <span
                    style={{ backgroundColor: item.color.code }}
                    aria-hidden="true"
                  />
                  {item.color.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset
            ref={sizeGroupRef}
            className={styles.sizes}
            aria-describedby={selectionError ? 'size-error' : undefined}
          >
            <legend>{text('Размер EU', 'EU size')}</legend>
            <div>
              {variant.inventory.map((item) => (
                <button
                  type="button"
                  key={item.inventoryId}
                  disabled={item.stock < 1}
                  aria-pressed={item.inventoryId === selectedInventoryId}
                  onClick={() => {
                    setSelectedInventoryId(item.inventoryId)
                    setSelectionError(false)
                    setFeedback(undefined)
                  }}
                >
                  {item.sizeLabel}
                  {item.stock > 0 && item.stock <= 3 ? (
                    <small>{text('мало', 'low')}</small>
                  ) : null}
                </button>
              ))}
            </div>
          </fieldset>
          {selectionError ? (
            <p id="size-error" className={styles.error}>
              {text('Выберите доступный размер.', 'Choose an available size.')}
            </p>
          ) : null}
          {selected ? (
            <p className={styles.sku}>
              SKU {commerceReference(selected.sku)} · {text('в наличии', 'in stock')}{' '}
              {selected.stock}
            </p>
          ) : null}

          <Button className={styles.addButton} type="button" onClick={addToCart}>
            {text('Добавить точный размер', 'Add selected size')}
          </Button>
          <p className={styles.feedback} role="status" aria-live="polite">
            {feedback?.variantId === variant.id ? feedback.text : ''}
          </p>
          <p className={styles.trust}>
            {text(
              'Демо-заказ без реального списания · возврат в течение 14 дней',
              'Demo order with no real charge · 14-day return',
            )}
          </p>
        </section>
      </div>

      <section className={styles.fitPanel} aria-labelledby="fit-title">
        <div>
          <p className={styles.kicker}>
            {text('fit-first / источник указан', 'fit-first / source shown')}
          </p>
          <h2 id="fit-title">{text('Линия посадки', 'Fit line')}</h2>
          <p>{fitNotes[product.fit.note]}</p>
          <p className={styles.provenance}>
            {provenanceLabels[product.fit.provenance]}
            {product.fit.sourceNote ? ` · ${product.fit.sourceNote}` : ''}
          </p>
        </div>
        <FitLine fit={product.fit} />
      </section>
      <SizeGuide product={product} />
    </article>
  )
}

export function ProductRoute({
  productRepository,
  cartHandoff,
}: {
  productRepository: ProductRepository
  cartHandoff: CartHandoff
}) {
  const { locale, text } = useLocale()
  const { slug = '' } = useParams()
  const resolvedCartHandoff = useCommerceCartHandoff(cartHandoff)
  const productQuery = useQuery(productDetailQueryOptions(productRepository, slug))

  if (productQuery.isPending) {
    return (
      <div className={styles.loading} role="status">
        <Skeleton label={text('Загрузка товара', 'Loading product')} lines={5} />
      </div>
    )
  }
  if (productQuery.isError) {
    const notFound =
      productQuery.error instanceof ProductRepositoryError &&
      productQuery.error.kind === 'not-found'
    return (
      <section className={styles.state}>
        <p className={styles.kicker}>
          {notFound ? '404' : text('PDP недоступна', 'Product page unavailable')}
        </p>
        <h1>
          {notFound
            ? text('Такая пара не найдена', 'Product not found')
            : text('Не удалось загрузить товар', 'Could not load the product')}
        </h1>
        <p>
          {notFound
            ? text(
                'Проверьте адрес или вернитесь в каталог.',
                'Check the address or return to the catalog.',
              )
            : text(
                'Повторите запрос — выбранные параметры URL сохранятся.',
                'Retry the request—the selected URL parameters will be preserved.',
              )}
        </p>
        {notFound ? (
          <Link to={paths.catalog}>{text('В каталог', 'Back to catalog')}</Link>
        ) : (
          <>
            <InlineError
              title={text('Ошибка загрузки товара', 'Product loading error')}
            >
              {text('Данные не изменены.', 'Data was not changed.')}
            </InlineError>
            <Button type="button" onClick={() => void productQuery.refetch()}>
              {text('Повторить', 'Retry')}
            </Button>
          </>
        )}
      </section>
    )
  }
  return (
    <ProductPage
      product={localizeProductDetails(productQuery.data, locale)}
      cartHandoff={resolvedCartHandoff}
    />
  )
}
