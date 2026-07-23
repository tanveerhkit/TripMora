/**
 * PlanBento — the "Plan your own way" grid, built on React Bits' MagicBento
 * interaction engine (star particles, cursor spotlight, border glow, tilt,
 * magnetism, click ripple) but adapted to TripMora: emerald glow instead of
 * purple, theme-aware surfaces, real content, and the two mode cards rendered
 * as accessible buttons that trigger the planning flows.
 */
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import { Icon, type IconName } from '../ui/Icon'
import type { HomeMode } from './ModeChooser'
import './PlanBento.css'

const DEFAULT_PARTICLE_COUNT = 12
const DEFAULT_SPOTLIGHT_RADIUS = 300
const DEFAULT_GLOW_COLOR = '52, 211, 153' // TripMora emerald (--brand-1)
const MOBILE_BREAKPOINT = 768

interface Card {
  kind: 'action' | 'feature'
  mode?: HomeMode
  icon: IconName
  label: string
  title: string
  description: string
}

const CARDS: Card[] = [
  {
    kind: 'action',
    mode: 'dream',
    icon: 'sparkles',
    label: 'Not sure where',
    title: 'Dreaming a trip',
    description:
      'Answer a few quick questions and get matched with destinations that fit exactly how you like to travel.',
  },
  {
    kind: 'action',
    mode: 'describe',
    icon: 'map',
    label: 'Know the place',
    title: 'Describe your trip',
    description:
      'Tell TripMora where you’re headed in your own words and get an editable day-by-day itinerary back.',
  },
  {
    kind: 'feature',
    icon: 'calendar',
    label: 'Structured',
    title: 'Day-by-day plans',
    description: 'Every trip laid out day by day, stop by stop.',
  },
  {
    kind: 'feature',
    icon: 'edit',
    label: 'Editable',
    title: 'Tweak everything',
    description: 'Reorder stops, edit times, add or remove — it’s yours.',
  },
  {
    kind: 'feature',
    icon: 'wallet',
    label: 'Practical',
    title: 'Budgets & tips',
    description: 'Cost breakdowns, packing lists and local know-how.',
  },
  {
    kind: 'feature',
    icon: 'bookmark',
    label: 'Saved',
    title: 'Always saved',
    description: 'Your trips are stored so you can pick up any time.',
  },
]

type Glow = string

const createParticleElement = (x: number, y: number, color: Glow = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div')
  el.className = 'tm-particle'
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `
  return el
}

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
})

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number,
) => {
  const rect = card.getBoundingClientRect()
  const relativeX = ((mouseX - rect.left) / rect.width) * 100
  const relativeY = ((mouseY - rect.top) / rect.height) * 100
  card.style.setProperty('--glow-x', `${relativeX}%`)
  card.style.setProperty('--glow-y', `${relativeY}%`)
  card.style.setProperty('--glow-intensity', glow.toString())
  card.style.setProperty('--glow-radius', `${radius}px`)
}

interface ParticleCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  disableAnimations?: boolean
  particleCount?: number
  glowColor?: Glow
  enableTilt?: boolean
  clickEffect?: boolean
  enableMagnetism?: boolean
  interactive?: boolean
  ariaLabel?: string
  onActivate?: () => void
}

const ParticleCard = ({
  children,
  className = '',
  style,
  disableAnimations = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = false,
  clickEffect = false,
  enableMagnetism = false,
  interactive = false,
  ariaLabel,
  onActivate,
}: ParticleCardProps) => {
  const cardRef = useRef<HTMLElement | null>(null)
  const setRef = useCallback((el: HTMLElement | null) => {
    cardRef.current = el
  }, [])
  const particlesRef = useRef<HTMLDivElement[]>([])
  const timeoutsRef = useRef<number[]>([])
  const isHoveredRef = useRef(false)
  const memoizedParticles = useRef<HTMLDivElement[]>([])
  const particlesInitialized = useRef(false)
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null)

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return
    const { width, height } = cardRef.current.getBoundingClientRect()
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor),
    )
    particlesInitialized.current = true
  }, [particleCount, glowColor])

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    magnetismAnimationRef.current?.kill()

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => particle.parentNode?.removeChild(particle),
      })
    })
    particlesRef.current = []
  }, [])

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return
    if (!particlesInitialized.current) initializeParticles()

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = window.setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return

        const clone = particle.cloneNode(true) as HTMLDivElement
        cardRef.current.appendChild(clone)
        particlesRef.current.push(clone)

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' },
        )
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })
        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        })
      }, index * 100)
      timeoutsRef.current.push(timeoutId)
    })
  }, [initializeParticles])

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return
    const element = cardRef.current

    const handleMouseEnter = () => {
      isHoveredRef.current = true
      animateParticles()
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000,
        })
      }
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false
      clearAllParticles()
      if (enableTilt) {
        gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' })
      }
      if (enableMagnetism) {
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10
        const rotateY = ((x - centerX) / centerX) * 10
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000,
        })
      }
      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05
        const magnetY = (y - centerY) * 0.05
        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      )
      const ripple = document.createElement('div')
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `
      element.appendChild(ripple)
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        },
      )
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('click', handleClick)

    return () => {
      isHoveredRef.current = false
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('click', handleClick)
      clearAllParticles()
    }
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor])

  const containerClass = `${className} tm-particle-container`
  if (interactive) {
    return (
      <button
        ref={setRef}
        type="button"
        className={containerClass}
        style={{ ...style, position: 'relative', overflow: 'hidden' }}
        aria-label={ariaLabel}
        onClick={onActivate}
      >
        {children}
      </button>
    )
  }
  return (
    <div
      ref={setRef}
      className={containerClass}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  )
}

interface SpotlightProps {
  gridRef: { current: HTMLDivElement | null }
  disableAnimations?: boolean
  enabled?: boolean
  spotlightRadius?: number
  glowColor?: Glow
}

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
}: SpotlightProps) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return

    const spotlight = document.createElement('div')
    spotlight.className = 'tm-spotlight'
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return
      const section = gridRef.current.closest('.tm-bento-section')
      const rect = section?.getBoundingClientRect()
      const mouseInside = Boolean(
        rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom,
      )

      const cards = gridRef.current.querySelectorAll<HTMLElement>('.tm-bento-card')

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
        cards.forEach((card) => card.style.setProperty('--glow-intensity', '0'))
        return
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius)
      let minDistance = Infinity

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect()
        const centerX = cardRect.left + cardRect.width / 2
        const centerY = cardRect.top + cardRect.height / 2
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2
        const effectiveDistance = Math.max(0, distance)
        minDistance = Math.min(minDistance, effectiveDistance)

        let glowIntensity = 0
        if (effectiveDistance <= proximity) glowIntensity = 1
        else if (effectiveDistance <= fadeDistance)
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity)

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, spotlightRadius)
      })

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' })

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gridRef.current
        ?.querySelectorAll<HTMLElement>('.tm-bento-card')
        .forEach((card) => card.style.setProperty('--glow-intensity', '0'))
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current)
    }
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor])

  return null
}

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return reduce
}

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

interface Props {
  onChoose: (mode: HomeMode) => void
  textAutoHide?: boolean
  enableStars?: boolean
  enableSpotlight?: boolean
  enableBorderGlow?: boolean
  disableAnimations?: boolean
  spotlightRadius?: number
  particleCount?: number
  enableTilt?: boolean
  glowColor?: Glow
  clickEffect?: boolean
  enableMagnetism?: boolean
}

export function PlanBento({
  onChoose,
  textAutoHide = false,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
}: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useMobileDetection()
  const reduce = usePrefersReducedMotion()
  const shouldDisableAnimations = disableAnimations || isMobile || reduce

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <div className="tm-bento-grid tm-bento-section" ref={gridRef}>
        {CARDS.map((card, index) => {
          const cls = [
            'tm-bento-card',
            `tm-bento-card--${card.kind}`,
            textAutoHide ? 'tm-bento-card--clamp' : '',
            enableBorderGlow ? 'tm-bento-card--glow' : '',
          ]
            .filter(Boolean)
            .join(' ')

          const cardStyle = { '--glow-color': glowColor } as CSSProperties

          const body = (
            <>
              <div className="tm-bento-card__header">
                <span className="tm-bento-card__icon">
                  <Icon name={card.icon} size={card.kind === 'action' ? 22 : 18} />
                </span>
                <span className="tm-bento-card__label">{card.label}</span>
                {card.kind === 'action' && (
                  <span className="tm-bento-card__go" aria-hidden="true">
                    <Icon name="arrow" size={18} />
                  </span>
                )}
              </div>
              <div className="tm-bento-card__content">
                <span className="tm-bento-card__title">{card.title}</span>
                <span className="tm-bento-card__description">{card.description}</span>
              </div>
            </>
          )

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                className={cls}
                style={cardStyle}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
                interactive={card.kind === 'action'}
                ariaLabel={card.kind === 'action' ? card.title : undefined}
                onActivate={card.mode ? () => onChoose(card.mode as HomeMode) : undefined}
              >
                {body}
              </ParticleCard>
            )
          }

          // No-particles fallback: still accessible actions, static features.
          return card.kind === 'action' ? (
            <button
              key={index}
              type="button"
              className={`${cls} tm-particle-container`}
              style={cardStyle}
              aria-label={card.title}
              onClick={() => card.mode && onChoose(card.mode)}
            >
              {body}
            </button>
          ) : (
            <div key={index} className={`${cls} tm-particle-container`} style={cardStyle}>
              {body}
            </div>
          )
        })}
      </div>
    </>
  )
}
