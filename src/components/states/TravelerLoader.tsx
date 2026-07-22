import styles from './states.module.css'

interface Props {
  /** e.g. "Planning your trip…" */
  message: string
}

/**
 * A looping "traveler on the move" loading animation: a little backpacker runs
 * in place — arms and legs swinging, body bobbing — over a scrolling road with
 * clouds drifting past. Replaces the static skeleton so waiting feels alive.
 * Honors prefers-reduced-motion (falls back to a still figure).
 */
export function TravelerLoader({ message }: Props) {
  return (
    <div className={styles.travelWrap} aria-live="polite" aria-busy="true">
      <svg
        className={styles.scene}
        viewBox="0 0 160 120"
        role="img"
        aria-label={message}
      >
        {/* drifting clouds */}
        <g className={styles.clouds}>
          <path className={styles.cloud1} d="M20 28 a7 7 0 0 1 13-2 6 6 0 0 1 9 5 z" />
          <path className={styles.cloud2} d="M96 20 a6 6 0 0 1 11-2 5 5 0 0 1 7 4 z" />
        </g>

        {/* scrolling road */}
        <line className={styles.road} x1="-20" y1="101" x2="180" y2="101" />

        {/* soft shadow that pulses with the stride */}
        <ellipse className={styles.shadow} cx="80" cy="103" rx="20" ry="4" />

        {/* the runner */}
        <g className={styles.runner}>
          {/* back limbs (slightly muted for depth) */}
          <path className={`${styles.limb} ${styles.legBack}`} d="M80 74 c 4 6 -4 12 0 18" />
          <path className={`${styles.limb} ${styles.armBack}`} d="M80 53 c 3 4 -3 8 0 12" />

          {/* backpack */}
          <rect className={styles.pack} x="63" y="52" width="14" height="19" rx="5" />
          <line className={styles.packStrap} x1="70" y1="58" x2="70" y2="65" />

          {/* torso + head */}
          <line className={styles.torso} x1="80" y1="51" x2="80" y2="74" />
          <circle className={styles.head} cx="80" cy="42" r="8" />

          {/* front limbs */}
          <path className={`${styles.limb} ${styles.legFront}`} d="M80 74 c 5 6 -5 12 0 18" />
          <path className={`${styles.limb} ${styles.armFront}`} d="M80 53 c 4 4 -4 8 0 12" />
        </g>
      </svg>

      <p className={styles.travelMsg}>{message}</p>
    </div>
  )
}
