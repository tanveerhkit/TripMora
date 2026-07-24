import styles from './Questionnaire.module.css'

interface Props {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function TextAreaQuestion({ value, placeholder, onChange }: Props) {
  return (
    <div className={styles.textControl}>
      <textarea
        className={styles.textArea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        aria-label="Anything else?"
      />
      <p className={styles.fieldHint}>
        Add preferences like pacing, flight tolerance, food priorities, or specific interests.
      </p>
    </div>
  )
}
