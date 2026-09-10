import type { Money } from '../../../entities/product/model/product'
import { formatMoney } from '../../lib/formatMoney'
import { useLocale } from '../../i18n/locale'
import styles from './Price.module.scss'

type PriceProps = {
  value: Money
  label?: string
}

export function Price({ value, label }: PriceProps) {
  const { intlLocale, text } = useLocale()
  return (
    <p className={styles.price}>
      <span className="visually-hidden">{label ?? text('Цена', 'Price')}: </span>
      {formatMoney(value, intlLocale)}
    </p>
  )
}
