import { catalogProductAnchor, paths } from '../../app/router/paths'
import type { Product } from '../../entities/product/model/product'
import { localizeProduct } from '../../entities/product/model/productLocalization'
import { FitLine } from '../../entities/product/ui/FitLine'
import { ProductCard } from '../../entities/product/ui/ProductCard'
import { Badge } from '../../shared/ui/Badge/Badge'
import { ButtonLink } from '../../shared/ui/Button/ButtonLink'
import { TextLink } from '../../shared/ui/TextLink/TextLink'
import { useLocale } from '../../shared/i18n/locale'
import styles from './HomeRoute.module.scss'
import { resolveProductImageAsset } from '../../entities/product/model/productMedia'

const featuredProduct = {
  id: 'para-city-01',
  slug: 'sever-signal-01',
  brand: { id: 'fixture-brand-sever', slug: 'sever', name: 'СЕВЕР' },
  category: { id: 'fixture-category-city', slug: 'city', name: 'Город' },
  model: 'Signal 01',
  title: 'Городские кроссовки Signal 01',
  description: 'Городские кроссовки Signal 01',
  price: { amountMinor: 1299000, currency: 'RUB' },
  defaultVariant: {
    id: 'fixture-variant-para-city-01',
    slug: 'sever-signal-default',
    color: { slug: 'default', name: 'Основной', code: '#171C26' },
  },
  image: {
    ...resolveProductImageAsset('/img/sneakers/1.png', 266, 224),
    alt: 'СЕВЕР Signal 01, вид сбоку',
  },
  fit: {
    width: 'standard',
    cushioning: 'soft',
    support: 'balanced',
    note: 'unknown',
    provenance: 'editorial_demo',
    sourceNote: 'M1 deterministic fixture',
    reviewedAt: '2026-08-28',
  },
  useCases: [
    { slug: 'city-walk', label: '12 000 шагов' },
    { slug: 'all-day', label: 'весь день' },
  ],
  availableSizes: ['40', '42', '44'],
  availability: { inStock: true, totalStock: 8 },
} as const satisfies Product

export function HomeRoute() {
  const { locale, text } = useLocale()
  const localizedFeaturedProduct = localizeProduct(featuredProduct, locale)
  const curatedEntries = [
    {
      title: text('12 000 шагов', '12,000 steps'),
      description: text(
        'Мягкая амортизация для длинного городского маршрута.',
        'Soft cushioning for a long city route.',
      ),
      meta: text('весь день / мягко', 'all day / soft'),
      href: catalogProductAnchor('sever-signal-01'),
      tone: 'blue',
    },
    {
      title: text('Лёгкий офис', 'Light office'),
      description: text(
        'Спокойный силуэт, который не устает к вечеру.',
        'A calm silhouette that stays comfortable into the evening.',
      ),
      meta: text('офис / баланс', 'office / balanced'),
      href: catalogProductAnchor('forma-metro'),
      tone: 'mint',
    },
    {
      title: text('Дождливый город', 'Rainy city'),
      description: text(
        'Поддержка и уверенный шаг на мокром маршруте.',
        'Support and a confident stride on wet routes.',
      ),
      meta: text('дождь / опора', 'rain / support'),
      href: catalogProductAnchor('krug-rain-2'),
      tone: 'orange',
    },
  ] as const

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            {text('Посадка / город / движение', 'Fit / city / motion')}
          </p>
          <h1 id="home-title">
            {text('Твой город.', 'Your city.')}
            <span>{text('Твоя посадка.', 'Your fit.')}</span>
          </h1>
          <p className={styles.lede}>
            {text(
              'Solecraft помогает выбирать кроссовки по ширине, амортизации и поддержке — чтобы вид совпадал с тем, как вы двигаетесь каждый день.',
              'Solecraft helps you choose sneakers by width, cushioning, and support—so the look matches how you move every day.',
            )}
          </p>
          <div className={styles.heroActions}>
            <ButtonLink to={paths.catalog}>
              {text('Подобрать пару', 'Find your pair')}
            </ButtonLink>
            <TextLink to="/#fit-method">
              {text('Как читать посадку', 'How to read fit')}
            </TextLink>
          </div>
          <p className={styles.heroNote}>
            {text(
              'EU-размеры · источник fit-данных виден · без магии',
              'EU sizes · visible fit sources · no magic',
            )}
          </p>
        </div>

        <aside className={styles.fitPanel} aria-labelledby="hero-fit-title">
          <div className={styles.panelTopline}>
            <Badge tone="orange">fit-first</Badge>
            <span>{text('маршрут / 12 000 шагов', 'route / 12,000 steps')}</span>
          </div>
          <p className={styles.panelIndex}>{text('Линия посадки', 'Fit line')}</p>
          <h2 id="hero-fit-title">
            {text(
              'Мягко идти. Уверенно держать ритм.',
              'Walk softly. Keep a confident rhythm.',
            )}
          </h2>
          <FitLine fit={localizedFeaturedProduct.fit} />
          <div className={styles.panelTags}>
            <Badge tone="mint">{text('весь день', 'all day')}</Badge>
            <Badge tone="mint">{text('город', 'city')}</Badge>
          </div>
          <p className={styles.panelSource}>
            {text(
              'Редакционная демо-оценка. Это ориентир, а не персональная рекомендация.',
              'Editorial demo assessment. This is guidance, not a personal recommendation.',
            )}
          </p>
        </aside>
      </section>

      <section className={styles.curated} aria-labelledby="curated-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>
              {text('Выбрать по дню', 'Choose by day')}
            </p>
            <h2 id="curated-title">
              {text('Начните со своего маршрута', 'Start with your route')}
            </h2>
          </div>
          <p>
            {text(
              'Не с логотипа на коробке, а с того, где и сколько вы ходите.',
              'Start with where and how far you walk—not the logo on the box.',
            )}
          </p>
        </div>

        <div className={styles.curatedGrid}>
          {curatedEntries.map((entry) => (
            <article
              className={`${styles.curatedCard ?? ''} ${styles[entry.tone] ?? ''}`}
              key={entry.title}
            >
              <p className={styles.curatedMeta}>{entry.meta}</p>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <TextLink to={entry.href}>
                {text('К подходящей паре', 'See the matching pair')}
              </TextLink>
            </article>
          ))}
        </div>
      </section>

      <section id="fit-method" className={styles.fitMethod} aria-labelledby="fit-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionKicker}>
              {text('Как это работает', 'How it works')}
            </p>
            <h2 id="fit-title">
              {text('Три сигнала, не один рейтинг', 'Three signals, not one score')}
            </h2>
          </div>
          <p>
            {text(
              'Линия не обещает «идеальную пару». Она показывает независимые свойства, чтобы сравнение оставалось честным.',
              'The line does not promise a “perfect pair.” It shows independent properties so comparisons stay honest.',
            )}
          </p>
        </div>
        <div className={styles.methodGrid}>
          <article>
            <span>{text('Ширина', 'Width')}</span>
            <h3>{text('Место для стопы', 'Room for your foot')}</h3>
            <p>
              {text(
                'От узкой до очень широкой. Если данных нет, пишем «не оценено».',
                'From narrow to extra wide. Missing data is shown as “not assessed.”',
              )}
            </p>
          </article>
          <article>
            <span>{text('Амортизация', 'Cushioning')}</span>
            <h3>{text('Характер шага', 'Ride character')}</h3>
            <p>
              {text(
                'Упругая, сбалансированная или мягкая — без шкалы «лучше/хуже».',
                'Firm, balanced, or soft—without a “better/worse” scale.',
              )}
            </p>
          </article>
          <article>
            <span>{text('Поддержка', 'Support')}</span>
            <h3>{text('Структура верха', 'Upper structure')}</h3>
            <p>
              {text(
                'Гибкая, сбалансированная или структурная опора на маршруте.',
                'Flexible, balanced, or structured support along the route.',
              )}
            </p>
          </article>
        </div>
      </section>

      <section className={styles.featured} aria-labelledby="featured-title">
        <div className={styles.featuredCopy}>
          <p className={styles.sectionKicker}>{text('Выбор маршрута', 'Route pick')}</p>
          <h2 id="featured-title">
            {text(
              'Для дня, который не заканчивается после обеда',
              'For a day that does not end after lunch',
            )}
          </h2>
          <p>
            {text(
              'Познакомьтесь с Signal 01: сравните посадку и сценарии, затем откройте карточку, чтобы выбрать цвет и доступный размер.',
              'Meet Signal 01: compare fit and everyday use, then open the product page to choose a color and an available size.',
            )}
          </p>
          <ButtonLink variant="secondary" to={paths.catalog}>
            {text('Смотреть весь каталог', 'View the full catalog')}
          </ButtonLink>
        </div>
        <ProductCard
          product={localizedFeaturedProduct}
          href={catalogProductAnchor(localizedFeaturedProduct.slug)}
        />
      </section>

      <section
        id="store-policy"
        className={styles.trust}
        aria-label={text('Условия магазина', 'Store policies')}
      >
        <div>
          <strong>{text('Примерка без спешки', 'Try without rushing')}</strong>
          <span>{text('14 дней на возврат демо-заказа', '14-day demo return')}</span>
        </div>
        <div>
          <strong>{text('Доставка по городу', 'City delivery')}</strong>
          <span>
            {text(
              'Срок и стоимость покажем до оплаты',
              'Timing and cost appear before payment',
            )}
          </span>
        </div>
        <div>
          <strong>{text('Fit-данные с источником', 'Source-aware fit data')}</strong>
          <span>
            {text(
              'Неизвестное не маскируем средним значением',
              'Unknown values are never disguised as average',
            )}
          </span>
        </div>
      </section>
    </div>
  )
}
