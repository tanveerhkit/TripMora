import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './TripForm.module.css'

interface Props {
  onSubmit: (prompt: string, hard: boolean) => void
  loading?: boolean
  initialValue?: string
}

const EXAMPLES = [
  '5 relaxed days in Kyoto for a solo traveler who loves food, temples and quiet mornings',
  'Family trip to Bali for a week with two young kids — beaches, easy activities, mid budget',
  '3-day budget backpacking in Lisbon: hidden gems, local food, nothing too touristy',
  'Romantic long weekend in Paris — art, cosy cafes and one special dinner',
]

const MAX = 2000

export function TripForm({ onSubmit, loading = false, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue)
  const [hard, setHard] = useState(false)
  const trimmed = value.trim()

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!trimmed || loading) return
    onSubmit(trimmed, hard)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit()
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="trip-input" className={styles.label}>
        Describe your trip
      </label>
      <div className={styles.field}>
        <textarea
          id="trip-input"
          className={styles.textarea}
          placeholder="e.g. 4 days in Rome for two — history, pasta, and a sunset viewpoint. Mid budget."
          value={value}
          maxLength={MAX}
          rows={4}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          autoFocus
        />
        <div className={styles.fieldFooter}>
          <span className={styles.hint}>
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to plan
          </span>
          <span className={styles.count}>
            {value.length}/{MAX}
          </span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={hard}
        className={`${styles.hardToggle} ${hard ? styles.hardOn : ''}`}
        onClick={() => setHard((h) => !h)}
        disabled={loading}
      >
        <span className={styles.hardSwitch}>
          <span className={styles.hardKnob} />
        </span>
        <span className={styles.hardText}>
          <strong>
            <Icon name="flame" size={15} /> Hard mode
          </strong>
          <span>Cram in more places than usually fit — a tight, fast-paced plan.</span>
        </span>
      </button>

      <div className={styles.submitRow}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={hard ? 'flame' : 'sparkles'}
          loading={loading}
          disabled={!trimmed}
        >
          {loading ? 'Planning…' : hard ? 'Plan the hard way' : 'Plan my trip'}
        </Button>
      </div>

      <div className={styles.examples}>
        <span className={styles.examplesLabel}>
          <Icon name="bulb" size={15} /> Try one of these
        </span>
        <div className={styles.chips}>
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              className={styles.chip}
              onClick={() => setValue(ex)}
              disabled={loading}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
