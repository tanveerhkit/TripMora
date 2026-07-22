import { useState, type FormEvent } from 'react'
import { defaultDreamAnswers, type DreamAnswers } from '../../types/dream'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import styles from './DreamForm.module.css'

interface Props {
  onSubmit: (answers: DreamAnswers) => void
  onBack: () => void
  loading?: boolean
  initialAnswers?: DreamAnswers | null
}

const WHEN = ['Flexible', 'Next month', 'In 2-3 months', 'Spring', 'Summer', 'Autumn', 'Winter']
const BUDGET = ['Shoestring', 'Budget', 'Mid-range', 'Comfortable', 'Luxury']
const COMPANY = ['Solo', 'Couple', 'Family', 'Friends']
const STYLE = ['Adventure', 'Balanced', 'Relaxed', 'Luxury']
const VISA = ['Open to anywhere', 'Prefer visa-free / on-arrival', 'Not sure']
const FOOD = ['No preference', 'Vegetarian', 'Vegan', 'Halal', 'Jain', 'Seafood lover']
const TEMP = ['Cool', 'Mild', 'Warm', 'Hot', 'Any']
const TERRAIN = ['Beaches', 'Mountains', 'Cities', 'Nature', 'Mix']

export function DreamForm({ onSubmit, onBack, loading = false, initialAnswers }: Props) {
  const [answers, setAnswers] = useState<DreamAnswers>(
    () => initialAnswers ?? defaultDreamAnswers(),
  )

  function set<K extends keyof DreamAnswers>(key: K, value: DreamAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    onSubmit(answers)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.head}>
        <Button variant="ghost" size="sm" icon="chevron" iconOnly aria-label="Back" onClick={onBack} className={styles.back} />
        <div>
          <h1 className={styles.title}>Let&apos;s find where you should go</h1>
          <p className={styles.sub}>The more you share, the better the matches.</p>
        </div>
      </div>

      <div className={styles.questions}>
        <ChipGroup label="When do you want to travel?" options={WHEN} value={answers.when} onChange={(v) => set('when', v)} />
        <ChipGroup label="Budget" options={BUDGET} value={answers.budget} onChange={(v) => set('budget', v)} />
        <ChipGroup label="Who's going?" options={COMPANY} value={answers.company} onChange={(v) => set('company', v)} />
        <ChipGroup label="Trip style" options={STYLE} value={answers.style} onChange={(v) => set('style', v)} />
        <ChipGroup label="Visa preference" options={VISA} value={answers.visa} onChange={(v) => set('visa', v)} />
        <ChipGroup label="Food preference" options={FOOD} value={answers.food} onChange={(v) => set('food', v)} />
        <ChipGroup label="Temperature you enjoy" options={TEMP} value={answers.temperature} onChange={(v) => set('temperature', v)} />
        <ChipGroup label="Beaches or mountains?" options={TERRAIN} value={answers.terrain} onChange={(v) => set('terrain', v)} />
      </div>

      <div className={styles.toggles}>
        <Toggle label="Travelling with kids?" value={answers.kids} onChange={(v) => set('kids', v)} />
        <Toggle label="Travelling with elderly?" value={answers.elderly} onChange={(v) => set('elderly', v)} />
      </div>

      <div className={styles.textGrid}>
        <label className={styles.textField}>
          <span>Travelling from <em>(optional)</em></span>
          <input
            value={answers.homeCountry}
            onChange={(e) => set('homeCountry', e.target.value)}
            placeholder="e.g. India — helps with visa & cost"
          />
        </label>
        <label className={styles.textField}>
          <span>Anything else? <em>(optional)</em></span>
          <input
            value={answers.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. love diving, avoid long flights"
          />
        </label>
      </div>

      <div className={styles.submit}>
        <Button type="submit" variant="primary" size="lg" icon="sparkles" loading={loading}>
          {loading ? 'Finding places…' : 'Find my destinations'}
        </Button>
      </div>
    </form>
  )
}

/* ---------------------- internal controls ---------------------- */

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset className={styles.q}>
      <legend className={styles.qLabel}>{label}</legend>
      <div className={styles.chips} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt
          return (
            <button
              type="button"
              key={opt}
              role="radio"
              aria-checked={active}
              className={`${styles.chip} ${active ? styles.chipOn : ''}`}
              onClick={() => onChange(opt)}
            >
              {active && <Icon name="check" size={13} />}
              {opt}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <div className={styles.seg} role="group" aria-label={label}>
        <button
          type="button"
          className={value ? styles.segOn : ''}
          aria-pressed={value}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={!value ? styles.segOn : ''}
          aria-pressed={!value}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  )
}
