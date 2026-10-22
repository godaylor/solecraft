import { useId } from 'react'

import { useLocale } from '../../i18n/locale'
import { useTheme, type Theme } from '../../theme/theme'
import { Icon } from '../Icon/Icon'
import styles from './ThemeControl.module.scss'

type ThemeControlProps = {
  variant?: 'compact' | 'expanded'
}

const choices = ['light', 'dark', 'system'] as const
const icons = { light: 'sun', dark: 'moon', system: 'monitor' } as const

export function ThemeControl({ variant = 'compact' }: ThemeControlProps) {
  const { theme, setTheme } = useTheme()
  const { text } = useLocale()
  const id = useId()
  const labels = {
    light: text('Светлая', 'Light'),
    dark: text('Тёмная', 'Dark'),
    system: text('Системная', 'System'),
  }
  const label = text('Тема оформления', 'Appearance')

  if (variant === 'expanded') {
    return (
      <fieldset className={styles.expanded}>
        <legend>{label}</legend>
        <div className={styles.choices}>
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={theme === choice}
              onClick={() => setTheme(choice)}
            >
              <Icon name={icons[choice]} />
              {labels[choice]}
            </button>
          ))}
        </div>
      </fieldset>
    )
  }

  return (
    <div className={styles.compact}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <Icon name={icons[theme]} />
      <select
        id={id}
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {labels[choice]}
          </option>
        ))}
      </select>
    </div>
  )
}
