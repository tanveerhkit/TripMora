import { useEffect, useRef, useState } from 'react'
import type { AtmosphereId } from '../../lib/atmosphere'
import { ATMOSPHERES } from '../../lib/atmosphere'
import { Icon } from '../ui/Icon'
import styles from './AtmosphereAudio.module.css'

const TARGET_VOLUME = 0.16
const CROSSFADE_MS = 900

const AUDIO_SOURCES: Record<AtmosphereId, { opus: string; mp3: string }> = {
  explore: { opus: '/audio/explore-ambient.ogg', mp3: '/audio/explore-ambient.mp3' },
  mountain: { opus: '/audio/mountain-ambient.ogg', mp3: '/audio/mountain-ambient.mp3' },
  rain: { opus: '/audio/rain-ambient.ogg', mp3: '/audio/rain-ambient.mp3' },
  forest: { opus: '/audio/forest-ambient.ogg', mp3: '/audio/forest-ambient.mp3' },
  tropical: { opus: '/audio/tropical-ambient.ogg', mp3: '/audio/tropical-ambient.mp3' },
  desert: { opus: '/audio/desert-ambient.ogg', mp3: '/audio/desert-ambient.mp3' },
  city: { opus: '/audio/city-nightlife-ambient.ogg', mp3: '/audio/city-nightlife-ambient.mp3' },
}

interface Props {
  atmosphere: AtmosphereId
}

function getPreferredSource(audio: HTMLAudioElement, atmosphere: AtmosphereId) {
  return audio.canPlayType('audio/ogg; codecs="opus"') ? AUDIO_SOURCES[atmosphere].opus : AUDIO_SOURCES[atmosphere].mp3
}

function stopAndReset(audio: HTMLAudioElement | null) {
  if (!audio) return
  try {
    audio.pause()
    audio.currentTime = 0
  } catch {
    // Media APIs can throw in unsupported environments; the UI should remain usable.
  }
  audio.volume = 0
  audio.removeAttribute('src')
}

export function AtmosphereAudio({ atmosphere }: Props) {
  const decksRef = useRef<Array<HTMLAudioElement | null>>([null, null])
  const activeDeckRef = useRef(0)
  const enabledRef = useRef(false)
  const requestRef = useRef(0)
  const fadeFrameRef = useRef<number | null>(null)
  const pendingCleanupRef = useRef<(() => void) | null>(null)
  const [enabled, setEnabled] = useState(false)
  const theme = ATMOSPHERES[atmosphere]

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    const decks = decksRef.current
    const active = decks[activeDeckRef.current]
    const inactive = decks[1 - activeDeckRef.current]
    if (!active || !inactive) return

    const requestId = ++requestRef.current
    if (fadeFrameRef.current !== null) {
      window.cancelAnimationFrame(fadeFrameRef.current)
      fadeFrameRef.current = null
    }
    pendingCleanupRef.current?.()
    pendingCleanupRef.current = null

    // Keep the currently audible deck stable if the user changes destinations rapidly.
    if (enabledRef.current) active.volume = TARGET_VOLUME
    stopAndReset(inactive)
    inactive.src = getPreferredSource(inactive, atmosphere)
    inactive.loop = true
    inactive.preload = 'none'
    inactive.volume = 0

    if (!enabledRef.current) {
      stopAndReset(active)
      active.src = getPreferredSource(active, atmosphere)
      active.loop = true
      active.preload = 'none'
      activeDeckRef.current = 0
      return
    }

    let usingFallback = false
    let started = false
    let disposed = false

    const cleanup = () => {
      disposed = true
      inactive.removeEventListener('canplay', startPlayback)
      inactive.removeEventListener('error', handleError)
    }

    const failPlayback = () => {
      if (disposed || requestId !== requestRef.current) return
      cleanup()
      setEnabled(false)
    }

    const handleError = () => {
      if (disposed || requestId !== requestRef.current) return
      if (!usingFallback && !inactive.src.endsWith('.mp3')) {
        usingFallback = true
        started = false
        inactive.src = AUDIO_SOURCES[atmosphere].mp3
        inactive.load()
        if (inactive.readyState >= 3) startPlayback()
        return
      }
      failPlayback()
    }

    const startFade = () => {
      const startedAt = performance.now()
      const animate = (now: number) => {
        if (disposed || requestId !== requestRef.current || !enabledRef.current) return
        const progress = Math.min(1, (now - startedAt) / CROSSFADE_MS)
        active.volume = TARGET_VOLUME * (1 - progress)
        inactive.volume = TARGET_VOLUME * progress
        if (progress < 1) {
          fadeFrameRef.current = window.requestAnimationFrame(animate)
          return
        }
        active.pause()
        active.currentTime = 0
        active.volume = 0
        activeDeckRef.current = 1 - activeDeckRef.current
        fadeFrameRef.current = null
        cleanup()
      }
      fadeFrameRef.current = window.requestAnimationFrame(animate)
    }

    const startPlayback = () => {
      if (started || disposed || requestId !== requestRef.current || !enabledRef.current) return
      started = true
      let playResult: Promise<void> | void
      try {
        playResult = inactive.play?.()
      } catch {
        handleError()
        return
      }
      if (playResult && typeof playResult.then === 'function') {
        playResult.then(startFade).catch(handleError)
      } else {
        startFade()
      }
    }

    inactive.addEventListener('canplay', startPlayback)
    inactive.addEventListener('error', handleError)
    pendingCleanupRef.current = cleanup
    inactive.load()
    // Calling play() here both satisfies already-granted media permission and prompts
    // browsers to fetch a deck whose preload was intentionally none while muted.
    startPlayback()

    return () => {
      cleanup()
      if (fadeFrameRef.current !== null) {
        window.cancelAnimationFrame(fadeFrameRef.current)
        fadeFrameRef.current = null
      }
    }
  }, [atmosphere])

  useEffect(() => {
    const active = decksRef.current[activeDeckRef.current]
    if (!active) return

    if (enabled) {
      active.volume = TARGET_VOLUME
      active.load()
      const playResult = active.play?.()
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          if (active.src.endsWith('.ogg')) {
            active.src = AUDIO_SOURCES[atmosphere].mp3
            active.load()
            active.play?.().catch(() => setEnabled(false))
          } else {
            setEnabled(false)
          }
        })
      }
    } else {
      if (fadeFrameRef.current !== null) {
        window.cancelAnimationFrame(fadeFrameRef.current)
        fadeFrameRef.current = null
      }
      pendingCleanupRef.current?.()
      pendingCleanupRef.current = null
      decksRef.current.forEach((audio) => {
        if (!audio) return
        try {
          audio.pause()
          audio.currentTime = 0
        } catch {
          // Ignore unsupported media operations while preserving the source for the next opt-in.
        }
        audio.volume = 0
      })
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      requestRef.current += 1
      if (fadeFrameRef.current !== null) window.cancelAnimationFrame(fadeFrameRef.current)
      pendingCleanupRef.current?.()
      decksRef.current.forEach(stopAndReset)
    }
  }, [])

  const toggle = () => {
    setEnabled((value) => !value)
  }

  return (
    <aside className={styles.wrap} aria-label="Destination ambience">
      {[0, 1].map((deck) => (
        <audio
          key={deck}
          ref={(node) => {
            decksRef.current[deck] = node
          }}
          preload="none"
          aria-hidden="true"
        />
      ))}
      <button
        type="button"
        className={`${styles.control} ${enabled ? styles.active : ''}`}
        aria-pressed={enabled}
        aria-label={`${enabled ? 'Mute' : 'Play'} ${theme.label} ambience`}
        onClick={toggle}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name={enabled ? 'volume' : 'volumeOff'} size={16} />
        </span>
        <span className={styles.copy}>
          <span className={styles.status}>{enabled ? 'Ambience on' : 'Play ambience'}</span>
          <span className={styles.theme}>{theme.label}</span>
        </span>
        <span className={styles.pulse} aria-hidden="true" />
      </button>
    </aside>
  )
}

export { AUDIO_SOURCES, CROSSFADE_MS }
