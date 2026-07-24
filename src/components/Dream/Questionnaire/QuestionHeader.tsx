import { Icon, type IconName } from '../../ui/Icon'
import styles from './Questionnaire.module.css'

interface Props {
  icon: IconName
  stepLabel: string
  title: string
  description: string
  optional?: boolean
}

export function QuestionHeader({
  icon,
  stepLabel,
  title,
  description,
  optional = false,
}: Props) {
  return (
    <header className={styles.questionHeader}>
      <div className={styles.questionBadgeRow}>
        <span className={styles.questionBadge}>
          <Icon name={icon} size={15} />
          {stepLabel}
        </span>
        <span className={styles.questionMeta}>{optional ? 'Optional' : 'Required'}</span>
      </div>
      <div className={styles.questionCopy}>
        <h1 className={styles.questionTitle}>{title}</h1>
        <p className={styles.questionDescription}>{description}</p>
      </div>
    </header>
  )
}
