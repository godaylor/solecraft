import type { Locale } from '../../../shared/i18n/locale'
import type { Product, ProductDetails } from './product'

const categoryLabels: Record<string, string> = {
  city: 'City',
  office: 'Office',
  weather: 'Wet weather',
  'light-training': 'Light training',
}

const useCaseLabels: Record<string, string> = {
  'city-walk': 'city walk',
  'all-day': 'all day',
  office: 'office',
  'wet-weather': 'wet weather',
  'light-training': 'light training',
}

const colorLabels: Record<string, string> = {
  black: 'Black',
  blue: 'Blue',
  burgundy: 'Burgundy',
  graphite: 'Graphite',
  mint: 'Mint',
  navy: 'Navy',
  orange: 'Orange',
  white: 'White',
  default: 'Main',
}

const colorNamesToSlugs: Record<string, string> = {
  Чёрный: 'black',
  Синий: 'blue',
  Бордовый: 'burgundy',
  Графит: 'graphite',
  Мятный: 'mint',
  'Тёмно-синий': 'navy',
  Оранжевый: 'orange',
  Белый: 'white',
  Основной: 'default',
}

const descriptions: Record<string, string> = {
  'sever-signal-01': 'A calm city sneaker for long routes and an everyday pace.',
  'sever-signal': 'A calm city sneaker for long routes and an everyday pace.',
  'forma-metro':
    'A restrained silhouette for the office, commuting, and after-work walks.',
  'volna-route': 'Soft cushioning and an easy stride for a full day in the city.',
  'krug-rain-2': 'A structured city sneaker for rainy routes and cooler days.',
  'krug-rain': 'A structured city sneaker for rainy routes and cooler days.',
  'smena-block': 'A versatile profile with a secure fit and substantial upper.',
  'luch-tempo': 'A flexible sneaker for light training, commuting, and brisk walks.',
  'sever-line-02': 'A clean design with firm cushioning for a steady city pace.',
  'forma-office-one':
    'A minimalist sneaker for understated offices and long days on foot.',
  'volna-airwalk': 'A light, soft sneaker for long walks and busy connections.',
  'krug-guard': 'A protected upper and structured support for changeable weather.',
  'smena-shift': 'A balanced city sneaker for workdays and evening routes.',
  'luch-pulse': 'A soft transition and flexible upper for unhurried light training.',
  'sever-north-03': 'A substantial city sneaker for cool weather and wet asphalt.',
  'forma-frame': 'Clean lines, moderate cushioning, and a composed office fit.',
  'volna-cloud': 'A very soft ride for walking and full, active days.',
  'krug-asphalt': 'A stable sole and firm support for a fast city pace.',
  'smena-daylight': 'A light office sneaker with soft fit and a neat profile.',
  'luch-sprint-lite': 'A light, flexible sneaker for short runs and active walks.',
  'sever-axis': 'A stable fit and balanced cushioning for the daily route.',
  'forma-softdesk': 'A soft office sneaker for people who walk between meetings.',
  'volna-river': 'A roomy toe box and flexible sole for long city walks.',
  'krug-shelter':
    'A composed weather sneaker with a protected upper and steady support.',
  'smena-cross': 'A versatile sneaker for light training and city errands.',
  'luch-flow': 'A soft, flexible profile for warm-ups and everyday movement.',
  'sever-vector': 'A structured city sneaker with a firm heel and even transition.',
  'forma-balance': 'A restrained, versatile sneaker for the office and the route home.',
  'volna-step': 'A soft, wide fit for an easy pace and long weekends.',
  'krug-rainline': 'A protected wet-weather sneaker without a heavy hiking feel.',
  'smena-pace': 'A firm fit for active walks and light training.',
  'luch-move': 'A simple, flexible sneaker for short everyday routes.',
  'sever-tram': 'A city sneaker with a partially assessed editorial fit profile.',
  'forma-outline': 'A clean office silhouette with a neutral ride.',
}

export function localizeColorName(
  colorSlug: string | undefined,
  fallback: string,
  locale: Locale,
): string {
  if (locale === 'ru') return fallback
  const slug = colorSlug ?? colorNamesToSlugs[fallback]
  return (slug && colorLabels[slug]) || fallback
}

function localizeBase<T extends Product | ProductDetails>(
  product: T,
  locale: Locale,
): T {
  const fit = {
    ...product.fit,
    sourceNote:
      product.fit.provenance === 'editorial_demo'
        ? locale === 'ru'
          ? 'Детерминированный демо-каталог Solecraft'
          : 'Solecraft deterministic demo catalog'
        : product.fit.sourceNote,
  }
  if (locale === 'ru') return { ...product, fit }
  return {
    ...product,
    category: {
      ...product.category,
      name: categoryLabels[product.category.slug] ?? product.category.name,
    },
    title: `${product.brand.name} ${product.model} sneakers`,
    description:
      descriptions[product.slug] ??
      `${product.brand.name} ${product.model} for everyday city movement.`,
    fit,
    useCases: product.useCases.map((useCase) => ({
      ...useCase,
      label: useCaseLabels[useCase.slug] ?? useCase.label,
    })),
  }
}

export function localizeProduct(product: Product, locale: Locale): Product {
  const localized = localizeBase(product, locale)
  if (locale === 'ru') return localized
  return {
    ...localized,
    defaultVariant: {
      ...localized.defaultVariant,
      color: {
        ...localized.defaultVariant.color,
        name: localizeColorName(
          localized.defaultVariant.color.slug,
          localized.defaultVariant.color.name,
          locale,
        ),
      },
    },
    image: {
      ...localized.image,
      alt: `${localized.brand.name} ${localized.model}, side view`,
    },
  }
}

export function localizeProductDetails(
  product: ProductDetails,
  locale: Locale,
): ProductDetails {
  const localized = localizeBase(product, locale)
  if (locale === 'ru') {
    return {
      ...localized,
      sizeGuide: localized.sizeGuide.map((entry) => ({
        ...entry,
        ...(entry.provenance === 'editorial_demo'
          ? { sourceNote: 'Детерминированная демо-таблица Solecraft' }
          : entry.sourceNote
            ? { sourceNote: entry.sourceNote }
            : {}),
      })),
    }
  }
  return {
    ...localized,
    variants: localized.variants.map((variant) => ({
      ...variant,
      color: {
        ...variant.color,
        name: localizeColorName(variant.color.slug, variant.color.name, locale),
      },
      media: variant.media.map((media, index) => ({
        ...media,
        alt: `${localized.brand.name} ${localized.model}, view ${index + 1}`,
      })),
    })),
    sizeGuide: localized.sizeGuide.map((entry) => ({
      ...entry,
      ...(entry.provenance === 'editorial_demo'
        ? { sourceNote: 'Solecraft deterministic demo size guide' }
        : entry.sourceNote
          ? { sourceNote: entry.sourceNote }
          : {}),
    })),
  }
}
