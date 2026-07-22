import { formatMoney } from '../../lib/format'
import type { DestinationRec } from '../../types/dream'
import { Button } from '../ui/Button'
import { Icon, type IconName } from '../ui/Icon'
import { LocationImage } from '../ui/LocationImage'
import styles from './DreamResults.module.css'

interface Props {
  dest: DestinationRec
  currency: string
  maxCost: number
  rank: number
  onPlan: () => void
}

function levelClass(level: string, kind: 'safety' | 'crowd'): string {
  const l = level.toLowerCase()
  if (kind === 'safety') {
    if (l.includes('high') || l.includes('very')) return styles.good
    if (l.includes('caution') || l.includes('low')) return styles.bad
    return styles.mid
  }
  // crowd: low is good, high is "busy"
  if (l.includes('low')) return styles.good
  if (l.includes('high')) return styles.bad
  return styles.mid
}

export function DestinationCard({ dest, currency, maxCost, rank, onPlan }: Props) {
  const costPct = dest.estCost && maxCost > 0 ? Math.round((dest.estCost / maxCost) * 100) : 0

  const facts: { icon: IconName; label: string; value: string; dot?: string }[] = [
    dest.bestSeason && { icon: 'calendar' as const, label: 'Best time', value: dest.bestSeason },
    dest.weather && { icon: 'cloud' as const, label: 'Weather', value: dest.weather },
    dest.safetyLevel && {
      icon: 'shield' as const,
      label: 'Safety',
      value: dest.safetyLevel,
      dot: levelClass(dest.safetyLevel, 'safety'),
    },
    dest.crowdLevel && {
      icon: 'users' as const,
      label: 'Crowds',
      value: dest.crowdLevel,
      dot: levelClass(dest.crowdLevel, 'crowd'),
    },
    dest.visa && { icon: 'passport' as const, label: 'Visa', value: dest.visa },
    dest.currency && { icon: 'coin' as const, label: 'Currency', value: dest.currency },
    dest.internet && { icon: 'wifi' as const, label: 'Internet', value: dest.internet },
    dest.suggestedDays
      ? { icon: 'clock' as const, label: 'Suggested', value: `${dest.suggestedDays} days` }
      : null,
  ].filter(Boolean) as { icon: IconName; label: string; value: string; dot?: string }[]

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <LocationImage
          query={[dest.name, dest.country].filter(Boolean).join(', ')}
          alt={`Photo of ${dest.name}`}
        />
        <span className={styles.rank} aria-hidden="true">
          {rank}
        </span>
        {dest.costLevel && <span className={styles.costLevel}>{dest.costLevel}</span>}
        <div className={styles.nameOnImage}>
          <h3 className={styles.name}>{dest.name}</h3>
          {dest.country && dest.country !== dest.name && (
            <span className={styles.country}>
              <Icon name="globe" size={13} /> {dest.country}
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        {dest.matchReason && <p className={styles.reason}>{dest.matchReason}</p>}

        <dl className={styles.facts}>
        {facts.map((f) => (
          <div className={styles.fact} key={f.label}>
            <dt className={styles.factLabel}>
              <Icon name={f.icon} size={14} />
              {f.label}
            </dt>
            <dd className={styles.factValue}>
              {f.dot && <span className={`${styles.dot} ${f.dot}`} aria-hidden="true" />}
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {dest.estCost !== null && (
        <div className={styles.costRow}>
          <div className={styles.costTop}>
            <span className={styles.costLabel}>Est. per person</span>
            <span className={styles.costValue}>{formatMoney(dest.estCost, currency)}</span>
          </div>
          <div className={styles.costBar}>
            <div className={styles.costFill} style={{ width: `${Math.max(costPct, 6)}%` }} />
          </div>
        </div>
      )}

      {dest.festivals.length > 0 && (
        <div className={styles.festivals}>
          <Icon name="sparkles" size={14} />
          <span>{dest.festivals.join(' · ')}</span>
        </div>
      )}

        <Button variant="primary" size="md" icon="map" onClick={onPlan} className={styles.planBtn}>
          Plan this trip
        </Button>
      </div>
    </article>
  )
}
