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

function DreamLandscapeGraphic() {
  return (
    <div className="tm-bento-card__graphic-container" aria-hidden="true">
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="tm-bento-card__graphic"
        preserveAspectRatio="xMaxYMax meet"
      >
        <defs>
          <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hill1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065f46" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="hill2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <circle cx="160" cy="100" r="85" fill="url(#sunGlowGrad)" />
        <circle cx="160" cy="102" r="34" fill="#5eead4" />

        <path
          d="M30 82 Q45 70 65 82 Q78 76 90 82 L90 90 L30 90 Z"
          fill="#34d399"
          fillOpacity="0.22"
        />
        <path
          d="M200 74 Q215 64 235 74 Q248 68 260 74 L260 82 L200 82 Z"
          fill="#34d399"
          fillOpacity="0.18"
        />

        <path
          d="M0 135 Q70 100 140 125 Q210 105 280 130 L280 180 L0 180 Z"
          fill="url(#hill1Grad)"
        />

        <path
          d="M0 152 Q80 132 160 148 Q230 132 280 146 L280 180 L0 180 Z"
          fill="url(#hill2Grad)"
        />

        <path
          d="M158 136 C152 144 172 152 160 162 C150 172 190 174 175 180 L205 180 C210 168 178 162 185 154 C192 144 172 138 166 136 Z"
          fill="url(#riverGrad)"
        />
      </svg>
    </div>
  )
}

function PlanMapGraphic() {
  return (
    <div className="tm-bento-card__graphic-container" aria-hidden="true">
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="tm-bento-card__graphic"
        preserveAspectRatio="xMaxYMax meet"
      >
        <defs>
          <linearGradient id="mapFold1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="mapFold2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.75" />
          </linearGradient>
          <filter id="pinGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#34d399" floodOpacity="0.5" />
          </filter>
        </defs>

        <g transform="translate(10, 10)">
          <polygon
            points="15,65 75,45 75,160 15,180"
            fill="url(#mapFold1)"
            stroke="#10b981"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <polygon
            points="75,45 135,68 135,183 75,160"
            fill="url(#mapFold2)"
            stroke="#10b981"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <polygon
            points="135,68 195,45 195,160 135,183"
            fill="url(#mapFold1)"
            stroke="#10b981"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <polygon
            points="195,45 255,68 255,183 195,160"
            fill="url(#mapFold2)"
            stroke="#10b981"
            strokeOpacity="0.35"
            strokeWidth="1"
          />

          <line x1="75" y1="45" x2="75" y2="160" stroke="#34d399" strokeOpacity="0.25" strokeWidth="1.5" />
          <line x1="135" y1="68" x2="135" y2="183" stroke="#34d399" strokeOpacity="0.25" strokeWidth="1.5" />
          <line x1="195" y1="45" x2="195" y2="160" stroke="#34d399" strokeOpacity="0.25" strokeWidth="1.5" />

          <path
            d="M40 140 Q90 120 130 145 T215 95"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          <g transform="translate(196, 62)">
            <circle cx="18" cy="18" r="22" fill="#34d399" fillOpacity="0.35" />
            <path
              d="M 18 0 C 8.05 0 0 8.05 0 18 C 0 29.7 18 46 18 46 C 18 46 36 29.7 36 18 C 36 8.05 27.95 0 18 0 Z"
              fill="#10b981"
            />
            <circle cx="18" cy="16" r="6" fill="#022c22" />
          </g>
        </g>
      </svg>
    </div>
  )
}

interface Card {
  kind: 'action'
  mode: HomeMode
  icon: IconName
  title: string
  graphic: 'dream' | 'plan'
}

const CARDS: Card[] = [
  {
    kind: 'action',
    mode: 'dream',
    icon: 'sparkles',
    title: 'Dream a trip',
    graphic: 'dream',
  },
  {
    kind: 'action',
    mode: 'describe',
    icon: 'map',
    title: 'Plan a trip',
    graphic: 'plan',
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

const checkIsMobile = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth <= MOBILE_BREAKPOINT ||
    ('ontouchstart' in window && window.innerWidth <= 1024))

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(checkIsMobile)
  useEffect(() => {
    const check = () => setIsMobile(checkIsMobile())
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
        {CARDS.map((card) => {
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
                  <Icon name={card.icon} size={22} />
                </span>
                <span className="tm-bento-card__go" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </span>
              </div>
              <div className="tm-bento-card__content">
                <h3 className="tm-bento-card__title">{card.title}</h3>
              </div>
              {card.graphic === 'dream' ? <DreamLandscapeGraphic /> : <PlanMapGraphic />}
            </>
          )

          if (enableStars) {
            return (
              <ParticleCard
                key={card.mode}
                className={cls}
                style={cardStyle}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
                interactive={true}
                ariaLabel={card.title}
                onActivate={() => onChoose(card.mode)}
              >
                {body}
              </ParticleCard>
            )
          }

          // No-particles fallback: accessible action buttons
          return (
            <button
              key={card.mode}
              type="button"
              className={`${cls} tm-particle-container`}
              style={cardStyle}
              aria-label={card.title}
              onClick={() => onChoose(card.mode)}
            >
              {body}
            </button>
          )
        })}
      </div>
    </>
  )
}
