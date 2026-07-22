import { countStops, estimatedTotal } from '../../lib/itineraryOps'
import { formatMoney } from '../../lib/format'
import type { Itinerary } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import { LocationImage } from '../ui/LocationImage'
import styles from './OverviewCard.module.css'

interface Props {
  itinerary: Itinerary
}

export function OverviewCard({ itinerary }: Props) {
  const { meta } = itinerary
  const stops = countStops(itinerary)
  const total = estimatedTotal(itinerary)

  const chips = [
    meta.travelerType && { icon: 'tag' as const, text: meta.travelerType },
    meta.bestSeason && { icon: 'sun' as const, text: meta.bestSeason },
  ].filter(Boolean) as { icon: 'tag' | 'sun'; text: string }[]

  return (
    <section className={styles.card}>
      <LocationImage
        className={styles.hero}
        query={meta.destination}
        alt={`Photo of ${meta.destination}`}
      >
        <span className={styles.eyebrow}>
          <Icon name="map" size={15} /> Your itinerary
        </span>
        <h2 className={styles.destination}>{meta.destination}</h2>
      </LocationImage>

      <div className={styles.content}>
        {meta.summary && <p className={styles.summary}>{meta.summary}</p>}

        {(chips.length > 0 || meta.tags.length > 0) && (
          <div className={styles.chips}>
            {chips.map((c) => (
              <span key={c.text} className={styles.chip}>
                <Icon name={c.icon} size={13} />
                {c.text}
              </span>
            ))}
            {meta.tags.map((t) => (
              <span key={t} className={`${styles.chip} ${styles.tagChip}`}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div className={styles.stats}>
          <Stat
            label={itinerary.days.length === 1 ? 'Day' : 'Days'}
            value={itinerary.days.length}
          />
          <Stat label="Stops" value={stops} />
          {total > 0 && <Stat label="Est. / person" value={formatMoney(total, meta.currency)} />}
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
