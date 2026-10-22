import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { paths, productPath } from '../../app/router/paths'
import type { CatalogRepository } from '../../entities/product/api/CatalogRepository'
import { catalogPageQueryOptions } from '../../entities/product/api/catalogQuery'
import { localizeProduct } from '../../entities/product/model/productLocalization'
import { ProductCard } from '../../entities/product/ui/ProductCard'
import { FitLine } from '../../entities/product/ui/FitLine'
import { useLocale } from '../../shared/i18n/locale'
import { useScrollReveal } from '../../shared/motion/useScrollReveal'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import { Button } from '../../shared/ui/Button/Button'
import { Icon } from '../../shared/ui/Icon/Icon'
import { Price } from '../../shared/ui/Price/Price'
import styles from './HomeRoute.module.scss'

export function HomeRoute({
  catalogRepository,
}: {
  catalogRepository: CatalogRepository
}) {
  const { locale, text } = useLocale()
  const homeRef = useRef<HTMLDivElement>(null)
  useScrollReveal(homeRef)
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [failedHeroId, setFailedHeroId] = useState<string>()
  const featuredQuery = useQuery(
    catalogPageQueryOptions(catalogRepository, {
      brands: [],
      uses: [],
      colors: [],
      sort: 'recommended',
      page: 1,
      pageSize: 12,
    }),
  )
  const products =
    featuredQuery.data?.products.map((product) => localizeProduct(product, locale)) ??
    []
  const spotlightProducts = products.slice(0, 3)
  const spotlight = spotlightProducts[spotlightIndex] ?? spotlightProducts[0]
  const routes = [
    {
      title: text('Весь день в движении', 'All day, on the move'),
      note: text(
        'От первой встречи до последнего метро',
        'From the first meeting to the last train',
      ),
      tag: text('Город / каждый день', 'City / everyday'),
      href: '/catalog?use=all-day',
      image: '/media/products/solecraft-01.webp',
      tone: 'blue',
    },
    {
      title: text('В своём темпе', 'At your own pace'),
      note: text(
        'Планы меняются. Твой стиль остаётся.',
        'Plans change. Your style stays.',
      ),
      tag: text('Офис / после работы', 'Office / after hours'),
      href: '/catalog?use=office',
      image: '/media/products/solecraft-02.webp',
      tone: 'mint',
    },
    {
      title: text('За пределами прогноза', 'Beyond the forecast'),
      note: text(
        'Когда хочется выйти, несмотря на погоду',
        'When the city calls, whatever the weather',
      ),
      tag: text('Город / мокрая погода', 'City / wet weather'),
      href: '/catalog?use=wet-weather',
      image: '/media/products/solecraft-04.webp',
      tone: 'orange',
    },
  ]
  return (
    <div className={styles.home} ref={homeRef}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span />
            {text('Кроссовки для жизни в городе', 'Sneakers for a life in motion')}
          </p>
          <h1 id="home-title">
            {text('Твой город.', 'Your city.')}
            <br />
            <span>{text('Твой ритм.', 'Your rhythm.')}</span>
          </h1>
          <p className={styles.lede}>
            {text(
              'Пара, в которой хочется идти дальше. Выбирай по стилю. Сравнивай по посадке.',
              'The pair that keeps you exploring. Choose your style. Compare the fit.',
            )}
          </p>
          <div className={styles.heroActions}>
            <ButtonLink to={paths.catalog}>
              {text('Подобрать пару', 'Find your pair')}
              <Icon name="arrow" />
            </ButtonLink>
            <Link to="/#fit-method">
              {text('Что такое Линия посадки', 'Meet the Fit line')}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.heroFootnote}>
            <span aria-hidden="true">↳</span>
            <p>
              {text(
                'Хорошая посадка. Больше города.',
                'A better fit. More city to explore.',
              )}
              <small>
                {text(
                  'Ширина · амортизация · поддержка',
                  'Width · cushioning · support',
                )}
              </small>
            </p>
          </div>
        </div>
        <div className={styles.heroStage}>
          <span className={styles.stageWord} aria-hidden="true">
            MOVE
          </span>
          <svg
            className={styles.routeLine}
            viewBox="0 0 700 600"
            fill="none"
            aria-hidden="true"
          >
            <path d="M-60 530H355C650 530 650 112 430 112H280C100 112 90 390 310 390H750" />
          </svg>
          <span className={styles.stageLabel}>SOLECRAFT / CITY SERIES</span>
          <div className={styles.heroShoe} key={spotlight?.id ?? 'loading'}>
            {spotlight ? (
              <Link
                to={productPath(spotlight.slug)}
                aria-label={
                  spotlight.title +
                  ' — ' +
                  text('открыть карточку товара', 'open product details')
                }
              >
                {failedHeroId === spotlight.id ? (
                  <span
                    className={styles.heroImageFallback}
                    role="img"
                    aria-label={spotlight.image.alt}
                  >
                    {text(
                      'Фото временно недоступно. Открыть модель',
                      'Photo unavailable. View this sneaker',
                    )}
                    <Icon name="arrow" />
                  </span>
                ) : (
                  <img
                    src={spotlight.image.src}
                    srcSet={spotlight.image.srcSet}
                    sizes="(min-width: 900px) 55vw, 100vw"
                    alt={spotlight.image.alt}
                    width={1200}
                    height={900}
                    fetchPriority="high"
                    onError={() => setFailedHeroId(spotlight.id)}
                  />
                )}
              </Link>
            ) : (
              <div className={styles.shoePlaceholder} role="status">
                {featuredQuery.isPending
                  ? text('Загружаем пары…', 'Loading sneakers…')
                  : text('Найди свою пару в каталоге', 'Find your pair in the catalog')}
              </div>
            )}
          </div>
          <span className={styles.stepStamp} aria-hidden="true">
            {text('Больше', 'More')}
            <br />
            {text('движения', 'movement')}
            <Icon name="arrow" />
          </span>
          <div className={styles.spotlightInfo}>
            <div>
              <span>{spotlight?.brand.name ?? 'SOLECRAFT'}</span>
              <strong>
                {spotlight?.model ?? text('Твоя следующая пара', 'Your next pair')}
              </strong>
            </div>
            {spotlight && <Price value={spotlight.price} />}
          </div>
          <div
            className={styles.spotlightTabs}
            role="group"
            aria-label={text('Пара на главной', 'Featured sneaker')}
          >
            {spotlightProducts.map((product, index) => (
              <button
                type="button"
                key={product.id}
                aria-pressed={spotlightIndex === index}
                onClick={() => setSpotlightIndex(index)}
                aria-label={product.model}
              >
                <span aria-hidden="true" />
                {product.model}
              </button>
            ))}
          </div>
          {featuredQuery.isError && (
            <Button variant="secondary" onClick={() => void featuredQuery.refetch()}>
              {text('Повторить', 'Try again')}
            </Button>
          )}
        </div>
      </section>
      <div className={styles.serviceStrip}>
        <span>
          <Icon name="bag" />
          {text('Покупки без регистрации', 'Shop without signing up')}
        </span>
        <span>
          <Icon name="route" />
          {text('Сравнивай посадку до примерки', 'Compare fit before trying on')}
        </span>
        <span>
          <Icon name="return" />
          {text('Без реальных списаний', 'No real charges')}
        </span>
      </div>
      <section
        className={styles.selection}
        aria-labelledby="featured-title"
        data-reveal
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>
              {text('Твоя следующая пара', 'Your next pair')}
            </p>
            <h2 id="featured-title">{text('С чего начнём?', 'Where to first?')}</h2>
          </div>
          <Link to={paths.catalog}>
            {text('Весь каталог', 'All sneakers')}
            <Icon name="arrow" />
          </Link>
        </div>
        <div className={styles.productGrid}>
          {products.slice(0, 3).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={productPath(product.slug)}
            />
          ))}
          {!products.length && (
            <div className={styles.featuredState} role="status">
              <p>
                {featuredQuery.isPending
                  ? text('Загружаем пары…', 'Loading sneakers…')
                  : text(
                      'Пары сейчас недоступны. Попробуйте ещё раз.',
                      'Sneakers are unavailable right now. Please try again.',
                    )}
              </p>
              {featuredQuery.isError && (
                <Button onClick={() => void featuredQuery.refetch()}>
                  {text('Повторить', 'Try again')}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      <section className={styles.curated} aria-labelledby="curated-title" data-reveal>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>
              {text('Не только пункт назначения', 'More than a destination')}
            </p>
            <h2 id="curated-title">
              {text('У каждого дня своя пара', 'A pair for every kind of day')}
            </h2>
          </div>
          <p>
            {text(
              'Начни с того, как ты проводишь день.',
              'Start with the way you spend your day.',
            )}
          </p>
        </div>
        <div className={styles.curatedGrid}>
          {routes.map((route) => (
            <Link
              className={[styles.curatedCard, styles[route.tone]].join(' ')}
              to={route.href}
              key={route.href}
            >
              <span className={styles.curatedTag}>{route.tag}</span>
              <img
                src={route.image}
                srcSet={
                  route.image.replace('.webp', '-600.webp') +
                  ' 600w, ' +
                  route.image +
                  ' 1200w'
                }
                sizes="(min-width: 900px) 30vw, 90vw"
                alt=""
                width={1200}
                height={900}
                loading="lazy"
              />
              <div>
                <h3>{route.title}</h3>
                <p>{route.note}</p>
              </div>
              <span className={styles.roundArrow}>
                <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section
        id="fit-method"
        className={styles.fitMethod}
        aria-labelledby="fit-title"
        data-reveal
      >
        <div className={styles.fitIntro}>
          <p className={styles.eyebrow}>
            {text(
              'Форма — снаружи. Комфорт — внутри.',
              'Style on the outside. Fit on the inside.',
            )}
          </p>
          <h2 id="fit-title">
            {text('Красиво — это когда', 'Looks good.')}
            <br />
            <span>{text('тебе подходит.', 'Feels like you.')}</span>
          </h2>
          <p>
            {text(
              'Сравни ширину, амортизацию и поддержку моделей перед примеркой.',
              'Compare width, cushioning and support before trying a pair on.',
            )}
          </p>
          <ButtonLink variant="secondary" to="/catalog">
            {text('Найти свою посадку', 'Find your fit')}
            <Icon name="arrow" />
          </ButtonLink>
        </div>
        <div className={styles.fitSample}>
          <div className={styles.fitSampleHeading}>
            <Icon name="route" />
            <h3>{text('Линия посадки', 'Fit line')}</h3>
            <span>FIT / PROFILE</span>
          </div>
          {spotlight ? (
            <FitLine fit={spotlight.fit} />
          ) : (
            <p>
              {text(
                'Данные появятся вместе с парой.',
                'Fit data appears with the sneaker.',
              )}
            </p>
          )}
          <div className={styles.fitExplanations}>
            <p>
              <strong>{text('Ширина', 'Width')}</strong>
              {text('Пространство для стопы', 'Room for your foot')}
            </p>
            <p>
              <strong>{text('Амортизация', 'Cushioning')}</strong>
              {text('Мягкий или упругий шаг', 'A soft or firm ride')}
            </p>
            <p>
              <strong>{text('Поддержка', 'Support')}</strong>
              {text('Структура верха', 'Upper structure')}
            </p>
          </div>
          <small>
            {text(
              'Демо-оценка, а не персональная рекомендация. Неизвестные свойства всегда отмечаем.',
              'Demo assessment, not a personal recommendation. Unknown properties are always marked.',
            )}
          </small>
        </div>
      </section>
      <section className={styles.cityStory} aria-labelledby="city-title" data-reveal>
        <img
          src="/media/editorial/city-route.webp"
          srcSet="/media/editorial/city-route-800.webp 800w, /media/editorial/city-route.webp 1600w"
          sizes="100vw"
          alt={text(
            'Солнечный городской переход, бетонные лестницы и синие перила',
            'Sunlit city passage, concrete stairs and blue handrails',
          )}
          width={1600}
          height={1067}
          loading="lazy"
        />
        <div>
          <p className={styles.eyebrow}>SOLECRAFT / EVERYDAY EXPLORERS</p>
          <h2 id="city-title">
            {text('Планы на сегодня?', 'Plans for today?')}
            <br />
            {text('Просто идти.', 'Just keep going.')}
          </h2>
          <ButtonLink to={paths.catalog}>
            {text('Город ждёт. Выбрать пару', 'The city awaits. Find your pair')}
            <Icon name="arrow" />
          </ButtonLink>
        </div>
      </section>
      <section
        id="store-policy"
        className={styles.trust}
        aria-label={text('Условия магазина', 'Store policies')}
        data-reveal
      >
        <div>
          <Icon name="bag" />
          <strong>{text('Без лишних шагов', 'Keep it simple')}</strong>
          <p>
            {text(
              'Каталог, избранное и заказ доступны гостям. Аккаунт — по желанию.',
              'Browse, save and order as a guest. An account is optional.',
            )}
          </p>
        </div>
        <div>
          <Icon name="route" />
          <strong>{text('Всё ясно до оплаты', 'Clear before you pay')}</strong>
          <p>
            {text(
              'Стоимость доставки и итог заказа покажем заранее. Оплата — демонстрационная.',
              'Delivery costs and order totals appear upfront. Payment is a demo.',
            )}
          </p>
        </div>
        <div>
          <Icon name="return" />
          <strong>
            {text('Можно попробовать весь путь', 'Try the complete journey')}
          </strong>
          <p>
            {text(
              'Заказ демонстрационный: товары не отправляются, деньги не списываются.',
              'Orders are a demo: no products are shipped and no money is charged.',
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
