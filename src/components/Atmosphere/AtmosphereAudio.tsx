import { useEffect, useRef, useState } from 'react'
import type { AtmosphereId } from '../../lib/atmosphere'
import { ATMOSPHERES } from '../../lib/atmosphere'
import { Icon } from '../ui/Icon'
import styles from './AtmosphereAudio.module.css'

const AUDIO_SOURCES: Record<AtmosphereId, string> = {
  explore: '/audio/explore-ambient.mp3',
  mountain: '/audio/mountain-ambient.mp3',
  rain: '/audio/rain-ambient.mp3',
  forest: '/audio/forest-ambient.mp3',
  tropical: '/audio/tropical-ambient.mp3',
  desert: '/audio/desert-ambient.mp3',
  city: '/audio/city-nightlife-ambient.mp3',
}

interface Props {
  atmosphere: AtmosphereId
}

export function AtmosphereAudio({ atmosphere }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const enabledRef = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const theme = ATMOSPHERES[atmosphere]

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = AUDIO_SOURCES[atmosphere]
    audio.loop = true
    audio.volume = 0.16

    const stop = () => {
      if (!audio.paused || audio.readyState > 0) audio.pause()
      audio.currentTime = 0
    }

    const playWhenReady = () => {
      if (!enabledRef.current) return
      audio.play().catch(() => setEnabled(false))
    }

    audio.addEventListener('canplay', playWhenReady)
    if (enabledRef.current) {
      audio.load()
      playWhenReady()
    }

    return () => {
      audio.removeEventListener('canplay', playWhenReady)
      stop()
    }
  }, [atmosphere])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (enabled) {
      audio.play().catch(() => setEnabled(false))
    } else if (!audio.paused || audio.readyState > 0) {
      audio.pause()
    }
  }, [enabled])

  const toggle = () => {
    setEnabled((value) => !value)
  }

  return (
    <aside className={styles.wrap} aria-label="Destination ambience">
      <audio ref={audioRef} preload="none" aria-hidden="true" />
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
