import type { KeyboardEvent } from 'react'
import styles from './Questionnaire.module.css'

interface Props {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function TextQuestion({ value, placeholder, onChange }: Props) {
  function preventSubmitOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.preventDefault()
  }

  return (
    <div className={styles.textControl}>
      <input
        className={styles.textInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={preventSubmitOnEnter}
        placeholder={placeholder}
        aria-label="Travelling from"
      />
      <p className={styles.fieldHint}>A country or city is enough. Leave it blank if you prefer.</p>
    </div>
  )
}
