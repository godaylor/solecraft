import type { FitWidth } from '../../entities/product/model/product'
import type { Locale } from '../../shared/i18n/locale'

export type CatalogOption<T extends string = string> = {
  value: T
  label: string
}

export const brandOptions = [
  { value: 'forma', label: 'ФОРМА' },
  { value: 'krug', label: 'КРУГ' },
  { value: 'luch', label: 'ЛУЧ' },
  { value: 'sever', label: 'СЕВЕР' },
  { value: 'smena', label: 'СМЕНА' },
  { value: 'volna', label: 'ВОЛНА' },
] as const satisfies readonly CatalogOption[]

export const useCaseOptions = [
  { value: 'all-day', label: 'Весь день' },
  { value: 'city-walk', label: 'Городская прогулка' },
  { value: 'light-training', label: 'Лёгкая тренировка' },
  { value: 'office', label: 'Офис' },
  { value: 'wet-weather', label: 'Мокрая погода' },
] as const satisfies readonly CatalogOption[]

export const sizeOptions = [
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '42.5',
  '43',
  '44',
  '45',
  '46',
] as const

export const widthOptions = [
  { value: 'narrow', label: 'Узкая' },
  { value: 'standard', label: 'Стандартная' },
  { value: 'wide', label: 'Широкая' },
  { value: 'extra_wide', label: 'Очень широкая' },
  { value: 'unknown', label: 'Не оценено' },
] as const satisfies readonly CatalogOption<FitWidth>[]

export const colorOptions = [
  { value: 'black', label: 'Чёрный' },
  { value: 'blue', label: 'Синий' },
  { value: 'burgundy', label: 'Бордовый' },
  { value: 'graphite', label: 'Графит' },
  { value: 'mint', label: 'Мятный' },
  { value: 'navy', label: 'Тёмно-синий' },
  { value: 'orange', label: 'Оранжевый' },
  { value: 'white', label: 'Белый' },
] as const satisfies readonly CatalogOption[]

export const priceOptions = [
  1_000_000, 1_100_000, 1_200_000, 1_300_000, 1_400_000, 1_500_000, 1_600_000,
  1_700_000, 1_800_000,
] as const

const useCaseEnglish: Record<string, string> = {
  'all-day': 'All day',
  'city-walk': 'City walk',
  'light-training': 'Light training',
  office: 'Office',
  'wet-weather': 'Wet weather',
}

const widthEnglish: Record<string, string> = {
  narrow: 'Narrow',
  standard: 'Standard',
  wide: 'Wide',
  extra_wide: 'Extra wide',
  unknown: 'Not assessed',
}

const colorEnglish: Record<string, string> = {
  black: 'Black',
  blue: 'Blue',
  burgundy: 'Burgundy',
  graphite: 'Graphite',
  mint: 'Mint',
  navy: 'Navy',
  orange: 'Orange',
  white: 'White',
}

function localizeOptions<T extends string>(
  options: readonly CatalogOption<T>[],
  labels: Record<string, string>,
  locale: Locale,
): readonly CatalogOption<T>[] {
  return locale === 'ru'
    ? options
    : options.map((option) => ({
        ...option,
        label: labels[option.value] ?? option.label,
      }))
}

export const getUseCaseOptions = (locale: Locale) =>
  localizeOptions(useCaseOptions, useCaseEnglish, locale)

export const getWidthOptions = (locale: Locale) =>
  localizeOptions(widthOptions, widthEnglish, locale)

export const getColorOptions = (locale: Locale) =>
  localizeOptions(colorOptions, colorEnglish, locale)
