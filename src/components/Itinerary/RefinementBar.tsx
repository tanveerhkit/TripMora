import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './RefinementBar.module.css'

interface Props {
  onRefine: (prompt: string) => void
  loading?: boolean
}

const SUGGESTIONS = [
  'Make it more relaxed',
  'Add more local food',
  'Cheaper options',
  'More hidden gems',
  'Add one more day',
]

export function RefinementBar({ onRefine, loading = false }: Props) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!trimmed || loading) return
    onRefine(trimmed)
    setValue('')
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.bar} onSubmit={submit}>
        <span className={styles.icon}>
          <Icon name="sparkles" size={18} />
        </span>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Refine this trip — e.g. “swap day 2 for a beach day”"
          aria-label="Refine your itinerary"
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon="send"
          loading={loading}
          disabled={!trimmed}
        >
          Refine
        </Button>
      </form>
      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={styles.suggestion}
            onClick={() => !loading && onRefine(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
