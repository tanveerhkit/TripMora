import { useEffect, useState } from 'react'
import { countStops, estimatedTotal } from '../../lib/itineraryOps'
import { formatMoney } from '../../lib/format'
import { useStopGallery } from '../../hooks/useStopGallery'
import type { Itinerary } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import { LocationImage } from '../ui/LocationImage'
import { CircularGallery } from '../ui/CircularGallery'
import styles from './OverviewCard.module.css'

interface Props {
  itinerary: Itinerary
}

function supportsWebGL(): boolean {
  return (
    typeof WebGLRenderingContext !== 'undefined' || typeof WebGL2RenderingContext !== 'undefined'
  )
}

export function OverviewCard({ itinerary }: Props) {
  const { meta } = itinerary
  const stops = countStops(itinerary)
  const total = estimatedTotal(itinerary)
  const gallery = useStopGallery(itinerary)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const sync = () => setIsCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const useGallery = supportsWebGL() && gallery.length >= 3 && !isCompact

  const chips = [
    meta.travelerType && { icon: 'tag' as const, text: meta.travelerType },
    meta.bestSeason && { icon: 'sun' as const, text: meta.bestSeason },
  ].filter(Boolean) as { icon: 'tag' | 'sun'; text: string }[]

  const header = (
    <>
      <span className={styles.eyebrow}>
        <Icon name="map" size={15} /> Your itinerary
      </span>
      <h2 className={styles.destination}>{meta.destination}</h2>
    </>
  )

  return (
    <section className={styles.card}>
      {useGallery ? (
        <div className={styles.gallery}>
          <CircularGallery
            items={gallery}
            bend={2.6}
            textColor="#ffffff"
            borderRadius={0.06}
            font="600 26px Inter"
            scrollEase={0.03}
          />
          <div className={styles.galleryOverlay}>{header}</div>
        </div>
      ) : (
        <LocationImage
          className={styles.hero}
          query={meta.destination}
          alt={`Photo of ${meta.destination}`}
        >
          {header}
        </LocationImage>
      )}

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
