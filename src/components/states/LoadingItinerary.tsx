import styles from './states.module.css'

interface Props {
  mode: 'generate' | 'refine' | null
}

function SkeletonStop() {
  return (
    <div className={styles.skelRow}>
      <div className={`${styles.shimmer} ${styles.skelBadge}`} />
      <div className={styles.skelRowBody}>
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '55%' }} />
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '80%' }} />
      </div>
    </div>
  )
}

export function LoadingItinerary({ mode }: Props) {
  return (
    <div className={styles.loading} aria-live="polite" aria-busy="true">
      <div className={styles.status}>
        <span className={styles.dot} />
        {mode === 'refine' ? 'Updating your itinerary…' : 'Planning your trip…'}
      </div>

      <div className={styles.skelCard}>
        <div className={`${styles.shimmer} ${styles.lineLg}`} style={{ width: '45%' }} />
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '70%' }} />
      </div>

      {[0, 1].map((i) => (
        <div className={styles.skelCard} key={i}>
          <div className={`${styles.shimmer} ${styles.lineLg}`} style={{ width: '35%' }} />
          <SkeletonStop />
          <SkeletonStop />
          <SkeletonStop />
        </div>
      ))}
    </div>
  )
}
