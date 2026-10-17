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

const demoProductSlugs = new Set([
  'sever-signal-01',
  'sever-signal',
  'forma-metro',
  'volna-route',
  'krug-rain-2',
  'krug-rain',
  'smena-block',
  'luch-tempo',
  'sever-line-02',
  'forma-office-one',
  'volna-airwalk',
  'krug-guard',
  'smena-shift',
  'luch-pulse',
  'sever-north-03',
  'forma-frame',
  'volna-cloud',
  'krug-asphalt',
  'smena-daylight',
  'luch-sprint-lite',
  'sever-axis',
  'forma-softdesk',
  'volna-river',
  'krug-shelter',
  'smena-cross',
  'luch-flow',
  'sever-vector',
  'forma-balance',
  'volna-step',
  'krug-rainline',
  'smena-pace',
  'luch-move',
  'sever-tram',
  'forma-outline',
])
const silhouetteDescriptions: Record<string, { ru: string; en: string }> = {
  '01': {
    ru: 'Сетчатый верх, контрастные панели и скульптурная подошва. Выразительный силуэт для повседневных сочетаний.',
    en: 'Mesh textures, contrasting panels and a sculpted sole. An expressive silhouette for everyday outfits.',
  },
  '02': {
    ru: 'Лаконичный низкий силуэт с фактурными панелями и ровной линией подошвы. Чистые формы без лишних деталей.',
    en: 'A pared-back low profile with textured panels and a clean sole line. Simple shapes, considered details.',
  },
  '03': {
    ru: 'Сетчатая фактура и волнообразная многослойная подошва. Заметная форма с небольшими цветовыми акцентами.',
    en: 'A mesh texture and a wave-shaped layered sole. A distinctive shape with small color accents.',
  },
  '04': {
    ru: 'Многослойные панели, рельефная подошва и яркие детали шнуровки. Городской силуэт с характером outdoor-обуви.',
    en: 'Layered panels, a textured outsole and bright lacing details. A city silhouette with an outdoor influence.',
  },
  '05': {
    ru: 'Геометричные накладки и угловатая подошва. Фактурный верх и собранный профиль в духе городских ретро-кроссовок.',
    en: 'Geometric overlays and an angular sole. A textured upper and a composed, retro-inspired city profile.',
  },
  '06': {
    ru: 'Низкий профиль, сетчатые вставки и сегментированная подошва. Небольшие контрастные детали завершают силуэт.',
    en: 'A low profile, mesh inserts and a segmented sole. Small contrasting details complete the silhouette.',
  },
  '07': {
    ru: 'Контурные накладки обрамляют сетчатые панели. Графичный силуэт дополнен угловатой светлой подошвой.',
    en: 'Contoured overlays frame the mesh panels. A graphic silhouette finished with an angular light-colored sole.',
  },
  '08': {
    ru: 'Спокойные линии, сетчатая фактура и тонкий акцент вдоль подошвы. Минималистичный взгляд на городские кроссовки.',
    en: 'Quiet lines, mesh texture and a subtle accent along the sole. A minimalist take on the city sneaker.',
  },
  '09': {
    ru: 'Крупная сетчатая фактура, плавные накладки и объёмная подошва. Мягкие линии создают цельный современный силуэт.',
    en: 'An open mesh texture, flowing overlays and a substantial sole. Rounded lines create a cohesive modern silhouette.',
  },
  '10': {
    ru: 'Контрастные слои, петли для шнуровки и рельефный протектор. Насыщенный деталями силуэт с outdoor-настроением.',
    en: 'Contrasting layers, lacing loops and a textured tread. A detailed silhouette with an outdoor spirit.',
  },
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
          ? 'Условные показатели для знакомства с подбором; свойства обуви не подтверждены'
          : 'Illustrative fit values for exploring the store; shoe properties are not verified'
        : product.fit.sourceNote,
  }
  const mediaSource =
    'image' in product
      ? product.image.src
      : (product.variants.find((variant) => variant.isDefault) ?? product.variants[0])
          ?.media[0]?.src
  const family = mediaSource?.match(/solecraft-(\d{2})/)?.[1]
  const visualDescription = family
    ? silhouetteDescriptions[family]?.[locale]
    : undefined
  const demoDescription =
    demoProductSlugs.has(product.slug) && visualDescription
      ? visualDescription
      : demoProductSlugs.has(product.slug)
        ? locale === 'ru'
          ? 'Модель демонстрационного каталога. Несколько моделей используют общий дизайн обуви; на фото показан выбранный цвет. Посадка и сценарии использования условные, а не подтверждённые свойства изделия.'
          : 'A demo catalog model. Several models share a shoe design; the image shows the selected color. Fit values and use cases are illustrative, not verified product properties.'
        : undefined
  if (locale === 'ru')
    return {
      ...product,
      fit,
      ...(demoDescription
        ? {
            title: `${product.brand.name} ${product.model}`,
            description: demoDescription,
          }
        : {}),
    }
  return {
    ...product,
    category: {
      ...product.category,
      name: categoryLabels[product.category.slug] ?? product.category.name,
    },
    title: `${product.brand.name} ${product.model} sneakers`,
    description:
      demoDescription ??
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
      alt:
        locale === 'ru'
          ? `${localized.brand.name} ${localized.model}, цвет «${localized.defaultVariant.color.name}», вид сбоку`
          : `${localized.brand.name} ${localized.model}, ${localizeColorName(localized.defaultVariant.color.slug, localized.defaultVariant.color.name, locale)}, side view`,
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
      variants: localized.variants.map((variant) => ({
        ...variant,
        media: variant.media.map((media) => ({
          ...media,
          alt: `${localized.brand.name} ${localized.model}, цвет «${variant.color.name}», вид сбоку`,
        })),
      })),
      sizeGuide: localized.sizeGuide.map((entry) => ({
        ...entry,
        ...(entry.provenance === 'editorial_demo'
          ? { sourceNote: 'Пример размерной таблицы, не данные производителя' }
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
        alt: `${localized.brand.name} ${localized.model}, ${localizeColorName(variant.color.slug, variant.color.name, locale)}, view ${index + 1}`,
      })),
    })),
    sizeGuide: localized.sizeGuide.map((entry) => ({
      ...entry,
      ...(entry.provenance === 'editorial_demo'
        ? { sourceNote: 'Example size guide, not manufacturer data' }
        : entry.sourceNote
          ? { sourceNote: entry.sourceNote }
          : {}),
    })),
  }
}
