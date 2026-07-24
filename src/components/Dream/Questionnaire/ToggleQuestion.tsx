import { motion } from 'framer-motion'
import styles from './Questionnaire.module.css'

interface Props {
  value: boolean | null
  onChange: (value: boolean) => void
}

export function ToggleQuestion({ value, onChange }: Props) {
  return (
    <div className={styles.toggleGrid} role="radiogroup" aria-label="Toggle selection">
      {[
        { label: 'Yes', checked: value === true, nextValue: true },
        { label: 'No', checked: value === false, nextValue: false },
      ].map((item, index) => (
        <motion.button
          key={item.label}
          type="button"
          role="radio"
          aria-checked={item.checked}
          className={[styles.toggleOption, item.checked ? styles.toggleOptionSelected : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(item.nextValue)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className={styles.toggleLabel}>{item.label}</span>
          <span className={styles.toggleHint}>
            {item.label === 'Yes' ? 'We will factor that into destination fit.' : 'We can optimize more freely.'}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
