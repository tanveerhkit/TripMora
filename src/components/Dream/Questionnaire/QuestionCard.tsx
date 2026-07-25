import type { ReactNode } from 'react'
import { Icon } from '../../ui/Icon'
import { BorderGlow } from '../../ui/BorderGlow'
import styles from './Questionnaire.module.css'

interface Props {
  children: ReactNode
  validationMessage?: string | null
}

export function QuestionCard({ children, validationMessage }: Props) {
  return (
    <BorderGlow
      borderRadius={24}
      glowColor="150 70 60"
      colors={['#55d396', '#169a50', '#34d399']}
      backgroundColor="transparent"
      edgeSensitivity={30}
      glowRadius={36}
      glowIntensity={1.0}
      className={styles.questionCardGlow}
    >
      <section className={styles.card}>
        <div className={styles.cardInner}>{children}</div>
        {validationMessage && (
          <div className={styles.validation} role="alert">
            <Icon name="warning" size={18} />
            <span>{validationMessage}</span>
          </div>
        )}
      </section>
    </BorderGlow>
  )
}
