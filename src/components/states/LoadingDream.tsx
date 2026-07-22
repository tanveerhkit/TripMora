import styles from './states.module.css'

export function LoadingDream() {
  return (
    <div className={styles.loading} aria-live="polite" aria-busy="true">
      <div className={styles.status}>
        <span className={styles.dot} />
        Matching you to destinations…
      </div>
      <div className={styles.dreamGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div className={styles.skelCard} key={i}>
            <div className={`${styles.shimmer} ${styles.lineLg}`} style={{ width: '50%' }} />
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '90%' }} />
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '70%' }} />
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
