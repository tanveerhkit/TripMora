import {
  useCallback,
  useEffect,
  useLayoutEffect,
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

  useEffect(() => {
    const check = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const repeatCount = isMobile ? 3 : 5
  const extendedDestinations = Array.from({ length: repeatCount }, () => DESTINATIONS).flat()
  const startOffset = count * Math.floor(repeatCount / 2)

  const [displayIndex, setDisplayIndex] = useState(startOffset)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()

  const realIndex = ((displayIndex % count) + count) % count
  const active = DESTINATIONS[realIndex]

  const heroRef = useRef<HTMLElement>(null)
  const touchStartX = useRef<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  const goNext = useCallback(() => setDisplayIndex((p) => p + 1), [])
  const goPrev = useCallback(() => setDisplayIndex((p) => p - 1), [])

  const goToRealIndex = useCallback(
    (targetReal: number) => {
      const currentReal = ((displayIndex % count) + count) % count
      let diff = targetReal - currentReal
      if (diff > count / 2) diff -= count
      if (diff < -count / 2) diff += count
      setDisplayIndex((prev) => prev + diff)
    },
    [displayIndex, count],
  )

  useEffect(() => {
    if (paused || reduce || isMobile) return
    const id = window.setInterval(() => setDisplayIndex((p) => p + 1), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, reduce, isMobile])

  useEffect(() => {
    const minBound = count
    const maxBound = count * (repeatCount - 1)
    if (displayIndex >= maxBound || displayIndex <= minBound) {
      const norm = count * Math.floor(repeatCount / 2) + realIndex
      setDisplayIndex(norm)
    }
  }, [displayIndex, count, realIndex, repeatCount])

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

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => {
      const cards = el.children
      if (cards.length < 2) return
      const first = cards[0] as HTMLElement
      const second = cards[1] as HTMLElement
      setStep(second.offsetLeft - first.offsetLeft)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <section
      ref={heroRef}
      className={styles.hero}
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
    >
      <motion.div className={styles.bg} style={isMobile ? undefined : { x: bgX, y: bgY }} aria-hidden="true">
        {DESTINATIONS.map((d, i) => (
          <HeroLayer
            key={d.name}
            query={d.query}
            active={i === realIndex}
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
              className={`${styles.tick} ${i === realIndex ? styles.tickOn : ''}`}
              onClick={() => goToRealIndex(i)}
            >
              <span className={styles.tickNum}>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
        <span className={styles.railCount}>
          <b>{String(realIndex + 1).padStart(2, '0')}</b> / {String(count).padStart(2, '0')}
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
              tint="#19d3a6"
              tintOpacity={0.92}
              textColor="#04140e"
              lineColor="#ffffff"
              baseColor="#0a3b2d"
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
        </div>

        <div
          className={styles.right}
          style={{ touchAction: 'pan-y' }}
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
          <div className={styles.viewport} style={{ touchAction: 'pan-y' }}>
            <motion.div
              ref={trackRef}
              className={styles.track}
              style={{ touchAction: 'pan-y' }}
              animate={{ x: -displayIndex * step }}
              transition={{ duration: reduce || isMobile ? 0.25 : 0.7, ease: EASE }}
            >
              {extendedDestinations.map((d, i) => (
                <DestinationCard
                  key={`${d.name}-${i}`}
                  dest={d}
                  index={i}
                  displayIndex={displayIndex}
                  active={i === displayIndex}
                  z={i === displayIndex ? count + 2 : Math.max(1, count - Math.abs(i - displayIndex))}
                  reduce={Boolean(reduce)}
                  isMobile={isMobile}
                  onSelect={() => setDisplayIndex(i)}
                />
              ))}
            </motion.div>
          </div>

          <div className={styles.dots}>
            {DESTINATIONS.map((d, i) => (
              <button
                key={d.name}
                type="button"
                className={`${styles.dot} ${i === realIndex ? styles.dotOn : ''}`}
                onClick={() => goToRealIndex(i)}
                aria-label={`Show ${d.name}`}
                aria-current={i === realIndex}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {active.name}, {active.country}. Destination {realIndex + 1} of {count}.
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

  if (isMobile && !active) return null

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

function DestinationCard({
  dest,
  index,
  displayIndex,
  active,
  z,
  reduce,
  isMobile,
  onSelect,
}: {
  dest: Destination
  index: number
  displayIndex: number
  active: boolean
  z: number
  reduce: boolean
  isMobile: boolean
  onSelect: () => void
}) {
  const isNear = Math.abs(index - displayIndex) <= (isMobile ? 2 : 4)
  const { url } = useLocationImage(isNear ? dest.query : '', { size: isMobile ? 400 : 800 })

  if (isMobile) {
    return (
      <button
        type="button"
        className={`${styles.card} ${active ? styles.cardOn : ''}`}
        style={{ zIndex: z, touchAction: 'pan-y' }}
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
              <Icon name="map" size={22} />
            </span>
          )}
        </span>
        <span className={styles.cardMeta}>
          <b>{dest.name}</b>
          <span>{dest.country}</span>
        </span>
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      className={`${styles.card} ${active ? styles.cardOn : ''}`}
      style={{ zIndex: z }}
      onClick={onSelect}
      aria-label={`${dest.name}, ${dest.country}`}
      aria-current={active}
      animate={reduce ? undefined : { scale: active ? 1.06 : 0.92, y: active ? -6 : 8 }}
      whileHover={reduce ? undefined : { y: active ? -14 : 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
      <span
        className={styles.cardImg}
        style={url ? { backgroundImage: `url("${url}")` } : undefined}
      >
        {!url && (
          <span className={styles.cardFallback} aria-hidden="true">
            <Icon name="map" size={22} />
          </span>
        )}
      </span>
      <span className={styles.cardMeta}>
        <b>{dest.name}</b>
        <span>{dest.country}</span>
      </span>
    </motion.button>
  )
}

