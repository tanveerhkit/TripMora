import { Button } from '../../ui/Button'
import styles from './Questionnaire.module.css'

interface Props {
  isFirstStep: boolean
  isLastStep: boolean
  loading?: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
}

export function NavigationFooter({
  isFirstStep,
  isLastStep,
  loading = false,
  onPrevious,
  onNext,
  onComplete,
}: Props) {
  return (
    <div className={styles.navigationFooter}>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className={styles.footerButton}
        onClick={onPrevious}
        disabled={isFirstStep || loading}
      >
        Previous
      </Button>

      <Button
        type="button"
        variant="primary"
        size="lg"
        icon={isLastStep ? 'sparkles' : 'arrow'}
        className={styles.footerButton}
        onClick={isLastStep ? onComplete : onNext}
        loading={loading}
      >
        {isLastStep ? 'Find My Destinations' : 'Next'}
      </Button>
    </div>
  )
}
