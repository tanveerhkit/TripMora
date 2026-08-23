import type { AtmosphereId } from '../../lib/atmosphere'
import styles from './AtmosphereBackdrop.module.css'

interface Props {
  atmosphere: AtmosphereId
}

const PARTICLES = ['one', 'two', 'three', 'four', 'five', 'six'] as const

export function AtmosphereBackdrop({ atmosphere }: Props) {
  return (
    <div className={styles.backdrop} data-atmosphere={atmosphere} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.haze} />
      <div className={styles.wave} />
      <div className={`${styles.wave} ${styles.waveTwo}`} />
      <div className={styles.cityGrid} />
      <div className={styles.particles}>
        {PARTICLES.map((particle) => (
          <span key={particle} className={`${styles.particle} ${styles[particle]}`} />
        ))}
      </div>
    </div>
  )
}
