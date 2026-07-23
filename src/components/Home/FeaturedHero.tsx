import { useCallback, useEffect, useState } from 'react'
import { useLocationImage } from '../../hooks/useLocationImage'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './FeaturedHero.module.css'

interface Destination {
  name: string
  country: string
  /** Wikipedia lookup term for the background photo */
  query: string
  /** rough trip length, folded into the "Plan a trip" prompt */
  days: number
  blurb: string
}

// A curated rotation of photogenic places with strong Wikipedia lead images.
const DESTINATIONS: Destination[] = [
  {
    name: 'Bali',
    country: 'Indonesia',
    query: 'Bali',
    days: 6,
    blurb:
      'Volcanic ridges, emerald rice terraces and surf-bar sunsets — the island of the gods pairs temple mornings with beach-club afternoons.',
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    query: 'Kyoto',
    days: 5,
    blurb:
      'Thousand-year-old temples, bamboo groves and lantern-lit lanes — Japan’s old capital keeps time with the seasons.',
  },
  {
    name: 'Santorini',
    country: 'Greece',
    query: 'Santorini',
    days: 4,
    blurb:
      'Whitewashed villages spill down caldera cliffs above the Aegean, where the sunsets over Oia are worth the trip alone.',
  },
  {
    name: 'Kerala',
    country: 'India',
    query: 'Kerala',
    days: 6,
    blurb:
      'Glide the palm-fringed backwaters, sip cardamom tea up in the hills and slow right down on India’s lush tropical coast.',
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    query: 'Marrakech',
    days: 5,
    blurb:
      'Lose yourself in the souks, cool off in tiled riad courtyards and watch the medina glow as the sun drops behind the Atlas.',
  },
]

const ROTATE_MS = 6000
// Larger than the card default so the full-bleed background stays crisp.
const HERO_SIZE = 1280

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  )
}

interface Props {
  /** fires with a ready-made prompt for the featured place */
  onPlan: (prompt: string) => void
}

export function FeaturedHero({ onPlan }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = DESTINATIONS.length

  const go = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count],
  )

  // Auto-advance, unless the pointer/focus is inside the hero or the user has
  // asked for reduced motion.
  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, count])

  const active = DESTINATIONS[index]

  const handlePlan = () => {
    onPlan(`${active.days} days in ${active.name}, ${active.country}`)
  }

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.bg} aria-hidden="true">
        {DESTINATIONS.map((d, i) => (
          <HeroBackground key={d.name} query={d.query} active={i === index} />
        ))}
        <div className={styles.scrim} />
      </div>

      <div className={styles.inner}>
        {/* keyed by index so the copy replays its entrance on each change */}
        <div className={styles.copy} key={index}>
          <span className={styles.eyebrow}>
            <Icon name="sparkles" size={14} />
            Featured destination
          </span>
          <h1 className={styles.name}>{active.name}</h1>
          <span className={styles.country}>
            <Icon name="map" size={15} />
            {active.country}
          </span>
          <p className={styles.blurb}>{active.blurb}</p>
          <Button variant="primary" size="lg" className={styles.cta} onClick={handlePlan}>
            Plan a trip
            <Icon name="arrow" size={18} />
          </Button>
        </div>

        <div className={styles.cards}>
          {DESTINATIONS.map((d, i) => (
            <DestinationCard
              key={d.name}
              dest={d}
              active={i === index}
              onSelect={() => go(i)}
            />
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <span className={styles.counter} aria-hidden="true">
          <b>{String(index + 1).padStart(2, '0')}</b>
          <i>/</i>
          {String(count).padStart(2, '0')}
        </span>

        <div className={styles.dots}>
          {DESTINATIONS.map((d, i) => (
            <button
              key={d.name}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotOn : ''}`}
              onClick={() => go(i)}
              aria-label={`Show ${d.name}`}
              aria-current={i === index}
            />
          ))}
        </div>

        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={() => go(index - 1)}
            aria-label="Previous destination"
          >
            <Icon name="chevron" size={18} className={styles.prevIcon} />
          </button>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={() => go(index + 1)}
            aria-label="Next destination"
          >
            <Icon name="chevron" size={18} className={styles.nextIcon} />
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {active.name}, {active.country}. Destination {index + 1} of {count}.
      </p>
    </section>
  )
}

function HeroBackground({ query, active }: { query: string; active: boolean }) {
  const { url } = useLocationImage(query, { size: HERO_SIZE })
  return (
    <div
      className={`${styles.bgLayer} ${active ? styles.bgOn : ''}`}
      style={url ? { backgroundImage: `url("${url}")` } : undefined}
    />
  )
}

function DestinationCard({
  dest,
  active,
  onSelect,
}: {
  dest: Destination
  active: boolean
  onSelect: () => void
}) {
  const { url } = useLocationImage(dest.query, { size: HERO_SIZE })
  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.cardOn : ''}`}
      onClick={onSelect}
      aria-label={`${dest.name}, ${dest.country}`}
      aria-current={active}
    >
      <span
        className={styles.cardImg}
        style={url ? { backgroundImage: `url("${url}")` } : undefined}
      >
        {!url && (
          <span className={styles.cardFallback} aria-hidden="true">
            <Icon name="map" size={20} />
          </span>
        )}
      </span>
      <span className={styles.cardLabel}>
        <b>{dest.name}</b>
        <span>{dest.country}</span>
      </span>
    </button>
  )
}
