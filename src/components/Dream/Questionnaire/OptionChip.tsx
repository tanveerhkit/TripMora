import { motion } from 'framer-motion'
import { Icon } from '../../ui/Icon'
import styles from './Questionnaire.module.css'

interface Props {
  label: string
  selected: boolean
  onSelect: () => void
  selectionMode?: 'single' | 'multiple'
  index?: number
}

export function OptionChip({
  label,
  selected,
  onSelect,
  selectionMode = 'single',
  index = 0,
}: Props) {
  return (
    <motion.button
      type="button"
      role={selectionMode === 'single' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      className={[styles.optionChip, selected ? styles.optionChipSelected : '']
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className={styles.optionChipLabel}>{label}</span>
      <span className={styles.optionChipIcon} aria-hidden="true">
        {selected ? <Icon name="check" size={14} /> : null}
      </span>
    </motion.button>
  )
}
