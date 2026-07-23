import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './RecoveryBar.module.css'

interface Props {
  /** how many stops are currently flagged as missed */
  missedCount: number
  onRecover: (notes: string) => void
  loading?: boolean
}

/**
 * Trip-recovery bar. Appears once a stop is flagged missed; the AI reworks the
 * remaining plan around the misses plus any extra trouble the traveler types in.
 */
export function RecoveryBar({ missedCount, onRecover, loading = false }: Props) {
  const [notes, setNotes] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    onRecover(notes.trim())
    setNotes('')
  }

  return (
    <section
      className={`${styles.wrap} ${loading ? styles.busy : ''}`}
      aria-label="Trip recovery"
      aria-busy={loading}
    >
      <div className={styles.head}>
        <span className={styles.icon}>
          <Icon name="warning" size={18} />
        </span>
        <div className={styles.headText}>
          <strong>
            {missedCount} {missedCount === 1 ? 'stop' : 'stops'} marked missed
          </strong>
          <span>Recover the trip — the AI reworks your remaining days around what you missed.</span>
        </div>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <input
          className={styles.input}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else go wrong? e.g. “day 2 rained out, flight delayed 4h”"
          aria-label="What else went wrong (optional)"
          disabled={loading}
        />
        <Button type="submit" variant="primary" size="sm" icon="retry" loading={loading}>
          {loading ? (
            <span className={styles.workingLabel}>
              Recovering
              <span className={styles.dots} aria-hidden="true" />
            </span>
          ) : (
            'Recover my trip'
          )}
        </Button>
      </form>
    </section>
  )
}
