import type { CSSProperties } from 'react'

import type { Cushioning, FitWidth, Product, Support } from '../model/product'
import { useLocale } from '../../../shared/i18n/locale'
import styles from './FitLine.module.scss'

const widthPositions: Record<FitWidth, number | null> = {
  narrow: 16,
  standard: 43,
  wide: 72,
  extra_wide: 92,
  unknown: null,
}

const cushioningPositions: Record<Cushioning, number | null> = {
  firm: 18,
  balanced: 50,
  soft: 84,
  unknown: null,
}

const supportPositions: Record<Support, number | null> = {
  flexible: 18,
  balanced: 50,
  structured: 84,
  unknown: null,
}

type FitLineProps = {
  fit: Product['fit']
  compact?: boolean
}

export function FitLine({ fit, compact = false }: FitLineProps) {
  const { text } = useLocale()
  const widthLabels: Record<FitWidth, string> = {
    narrow: text('узкая', 'narrow'),
    standard: text('стандартная', 'standard'),
    wide: text('широкая', 'wide'),
    extra_wide: text('очень широкая', 'extra wide'),
    unknown: text('не оценено', 'not assessed'),
  }
  const cushioningLabels: Record<Cushioning, string> = {
    firm: text('упругая', 'firm'),
    balanced: text('сбалансированная', 'balanced'),
    soft: text('мягкая', 'soft'),
    unknown: text('не оценено', 'not assessed'),
  }
  const supportLabels: Record<Support, string> = {
    flexible: text('гибкая', 'flexible'),
    balanced: text('сбалансированная', 'balanced'),
    structured: text('структурная', 'structured'),
    unknown: text('не оценено', 'not assessed'),
  }
  const tracks = [
    {
      key: 'width',
      label: text('Ширина', 'Width'),
      value: widthLabels[fit.width],
      position: widthPositions[fit.width],
    },
    {
      key: 'cushioning',
      label: text('Амортизация', 'Cushioning'),
      value: cushioningLabels[fit.cushioning],
      position: cushioningPositions[fit.cushioning],
    },
    {
      key: 'support',
      label: text('Поддержка', 'Support'),
      value: supportLabels[fit.support],
      position: supportPositions[fit.support],
    },
  ] as const

  return (
    <div
      className={`${styles.root ?? ''} ${compact ? (styles.compact ?? '') : ''}`}
      aria-label={text('Линия посадки', 'Fit line')}
    >
      {tracks.map((track) => (
        <div className={styles.row} key={track.key}>
          <div className={styles.label}>
            <span>{track.label}</span>
            <strong>{track.value}</strong>
          </div>
          <div
            className={`${styles.track ?? ''} ${track.position === null ? (styles.unknown ?? '') : ''}`}
            aria-hidden="true"
          >
            {track.position === null ? null : (
              <span
                className={styles.marker}
                style={
                  {
                    '--track-position': `${track.position}%`,
                  } as CSSProperties
                }
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
