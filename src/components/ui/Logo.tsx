import styles from './Logo.module.css'

/**
 * Animated brand mark — a compass whose needle slowly sweeps like it's finding
 * north, nodding to navigation / trip planning. Spins livelier on hover.
 * Decorative: the accessible name lives on the brand button that wraps it.
 */
export function Logo() {
  return (
    <span className={styles.logo} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none">
        <circle className={styles.ring} cx="12" cy="12" r="8.6" />
        <g className={styles.needle}>
          <path className={styles.north} d="M12 4.5 15 12 9 12Z" />
          <path className={styles.south} d="M12 19.5 15 12 9 12Z" />
        </g>
        <circle className={styles.pivot} cx="12" cy="12" r="1.4" />
      </svg>
    </span>
  )
}
