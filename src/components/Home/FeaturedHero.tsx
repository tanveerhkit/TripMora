import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useLocationImage } from '../../hooks/useLocationImage'
import { getAtmosphere } from '../../lib/atmosphere'
import { Icon } from '../ui/Icon'
import { SpecularButton } from '../ui/SpecularButton'
import styles from './FeaturedHero.module.css'

interface Destination {
  name: string
  country: string
  query: string
  days: number
  blurb: string
}

const DESTINATIONS: Destination[] = [
  {
    name: 'Kashmir',
    country: 'India',
    query: 'Dal Lake',
    days: 6,
    blurb:
      'Glide across mirror-still Dal Lake by shikara, wake in a carved houseboat and watch snow settle on the Pir Panjal - the Himalayan valley they call paradise on earth.',
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    query: 'Kyoto',
    days: 5,
    blurb:
      "Thousand-year-old temples, silent bamboo groves and lantern-lit lanes - Japan's old capital keeps time with the seasons.",
  },
  {
    name: 'Dubai',
    country: 'UAE',
    query: 'Dubai Marina',
    days: 5,
    blurb:
      'Glass towers soar above the desert, abras cross the creek to spice-scented souks and the Gulf coast unrolls into golden dunes - Dubai does glamour at full volume.',
  },
  {
    name: 'Kerala',
    country: 'India',
    query: 'Kerala',
    days: 6,
    blurb:
      "Glide the palm-fringed backwaters, sip cardamom tea up in the hills and slow right down on India's lush tropical coast.",
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

const ROTATE_MS = 7000
const EASE = [0.16, 1, 0.3, 1] as const

const getIsMobile = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024))

interface Props {
  onOpenPlanner: () => void
}

export function FeaturedHero({ onOpenPlanner }: Props) {
  const count = DESTINATIONS.length
  const [isMobile, setIsMobile] = useState(getIsMobile)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const active = DESTINATIONS[index]
  const atmosphere = getAtmosphere({
    destination: active.name,
    country: active.country,
    summary: active.blurb,
  })
  const heroTint = {
    explore: '#55d396',
    mountain: '#a5e6ff',
    rain: '#7dd3fc',
    forest: '#86efac',
    tropical: '#67e8f9',
    desert: '#fbbf24',
    city: '#d8b4fe',
  }[atmosphere.id]

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % count)
  }, [count])

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + count) % count)
  }, [count])

  useEffect(() => {
    if (paused || reduce) return
    const id = window.setInterval(goNext, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, reduce, goNext])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const bgX = useSpring(useTransform(mx, (v) => v * -28), { stiffness: 60, damping: 18 })
  const bgY = useSpring(useTransform(my, (v) => v * -28), { stiffness: 60, damping: 18 })

  const onMouseMove = (e: ReactMouseEvent) => {
    if (reduce || isMobile) return
    const r = heroRef.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const resetParallax = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      data-atmosphere={atmosphere.id}
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onMouseMove={onMouseMove}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        resetParallax()
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current
        touchStartX.current = null
        if (start == null) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 44) {
          if (dx < 0) goNext()
          else goPrev()
        }
      }}
    >
      <motion.div className={styles.bg} style={isMobile ? undefined : { x: bgX, y: bgY }} aria-hidden="true">
        {DESTINATIONS.map((d, i) => (
          <HeroLayer
            key={d.name}
            query={d.query}
            active={i === index}
            reduce={Boolean(reduce)}
            isMobile={isMobile}
          />
        ))}
      </motion.div>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.progress} aria-hidden="true">
        <div className={styles.rail}>
          {DESTINATIONS.map((d, i) => (
            <button
              key={d.name}
              type="button"
              tabIndex={-1}
              className={`${styles.tick} ${i === index ? styles.tickOn : ''}`}
              onClick={() => setIndex(i)}
            >
              <span className={styles.tickNum}>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
        <span className={styles.railCount}>
          <b>{String(index + 1).padStart(2, '0')}</b> / {String(count).padStart(2, '0')}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.name}
              className={styles.copy}
              initial={{ opacity: 0, y: reduce ? 0 : 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -18 }}
              transition={{ duration: isMobile ? 0.2 : 0.55, ease: EASE }}
            >
              <span className={styles.badge}>
                <Icon name="sparkles" size={14} />
                Featured destination
              </span>
              <h1 className={styles.title}>{active.name}</h1>
              <span className={styles.country}>
                <Icon name="map" size={16} />
                {active.country}
              </span>
              <p className={styles.blurb}>{active.blurb}</p>
            </motion.div>
          </AnimatePresence>

          <div className={styles.ctas}>
            <SpecularButton
              size="md"
              radius={100}
              tint={heroTint}
              tintOpacity={0.92}
              textColor="#071510"
              lineColor="#ffffff"
              baseColor={heroTint}
              intensity={1.1}
              proximity={280}
              className={styles.specularCta}
              onClick={onOpenPlanner}
            >
              <span className={styles.ctaInner}>
                Plan a trip
                <Icon name="arrow" size={18} className={styles.primaryArrow} />
              </span>
            </SpecularButton>
          </div>

          <div className={styles.dots}>
            {DESTINATIONS.map((d, i) => (
              <button
                key={d.name}
                type="button"
                className={`${styles.dot} ${i === index ? styles.dotOn : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Show ${d.name}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {active.name}, {active.country}. Destination {index + 1} of {count}.
      </p>
    </section>
  )
}

function HeroLayer({
  query,
  active,
  reduce,
  isMobile,
}: {
  query: string
  active: boolean
  reduce: boolean
  isMobile: boolean
}) {
  const { url } = useLocationImage(query, { size: isMobile ? 800 : 1600 })

  return (
    <motion.div
      className={styles.bgLayer}
      style={{ backgroundImage: url ? `url("${url}")` : undefined }}
      initial={false}
      animate={{ opacity: active ? 1 : 0, scale: active && !isMobile ? 1.06 : 1 }}
      transition={{
        opacity: { duration: reduce || isMobile ? 0.25 : 0.85, ease: 'easeInOut' },
        scale: { duration: reduce || isMobile ? 0 : 9, ease: 'easeOut' },
      }}
    />
  )
}

