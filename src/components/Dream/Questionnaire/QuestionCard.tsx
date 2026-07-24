import type { ReactNode } from 'react'
import { Icon } from '../../ui/Icon'
import styles from './Questionnaire.module.css'

interface Props {
  children: ReactNode
  validationMessage?: string | null
}

export function QuestionCard({ children, validationMessage }: Props) {
  return (
    <section className={styles.card}>
      <div className={styles.cardInner}>{children}</div>
      {validationMessage && (
        <div className={styles.validation} role="alert">
          <Icon name="warning" size={18} />
          <span>{validationMessage}</span>
        </div>
      )}
    </section>
  )
}
