import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import type { StepStatus } from '../../ui/Stepper'
import styles from './Questionnaire.module.css'

interface Props {
  currentStep: number
  totalSteps: number
  currentTitle: string
  labels: string[]
  onExit: () => void
  canGoToStep: (step: number) => boolean
  goToStep: (step: number) => void
  getStepStatus: (step: number) => StepStatus
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  currentTitle,
  labels,
  onExit,
  canGoToStep,
  goToStep,
  getStepStatus,
}: Props) {
  return (
    <div className={styles.progressHeader}>
      <div className={styles.progressTop}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon="chevron"
          className={styles.exitButton}
          onClick={onExit}
        >
          Back
        </Button>

        <div className={styles.progressMeta}>
          <span className={styles.progressEyebrow}>Step {currentStep} of {totalSteps}</span>
          <strong className={styles.progressTitle}>{currentTitle}</strong>
        </div>
      </div>

      <div className={styles.progressTrack} role="list" aria-label="Question progress">
        {labels.map((label, index) => {
          const step = index + 1
          const status = getStepStatus(step)
          const isActive = status === 'active'
          const isComplete = status === 'complete'
          const isDisabled = status === 'inactive' && !canGoToStep(step)

          return (
            <button
              key={label}
              type="button"
              role="listitem"
              className={[
                styles.progressStep,
                isActive ? styles.progressStepActive : '',
                isComplete ? styles.progressStepComplete : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => goToStep(step)}
              disabled={isDisabled}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${step}: ${label}`}
            >
              <span className={styles.progressStepBadge} aria-hidden="true">
                {isComplete ? <Icon name="check" size={13} /> : step}
              </span>
              <span className={styles.progressStepLabel}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
