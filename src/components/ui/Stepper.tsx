import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './Stepper.module.css'

export type StepStatus = 'inactive' | 'active' | 'complete'

export interface StepperRenderProps {
  currentStep: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  canGoToStep: (step: number) => boolean
  getStepStatus: (step: number) => StepStatus
  goToStep: (step: number) => void
  goBack: () => void
  goNext: () => void
  complete: () => void
}

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  currentStep: number
  onStepChange: (step: number) => void
  onFinalStepCompleted?: () => void
  canNavigateToStep?: (targetStep: number, currentStep: number) => boolean
  renderProgress?: (props: StepperRenderProps) => ReactNode
  renderFooter?: (props: StepperRenderProps) => ReactNode
  progressClassName?: string
  contentClassName?: string
  footerClassName?: string
}

export default function Stepper({
  children,
  currentStep,
  onStepChange,
  onFinalStepCompleted = () => {},
  canNavigateToStep = (targetStep, liveStep) => targetStep !== liveStep,
  renderProgress,
  renderFooter,
  className = '',
  progressClassName = '',
  contentClassName = '',
  footerClassName = '',
  ...rest
}: StepperProps) {
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const [direction, setDirection] = useState(0)
  const previousStep = useRef(currentStep)

  useEffect(() => {
    if (previousStep.current !== currentStep) {
      setDirection(currentStep > previousStep.current ? 1 : -1)
      previousStep.current = currentStep
    }
  }, [currentStep])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  const getStepStatus = (step: number): StepStatus => {
    if (step === currentStep) return 'active'
    return step < currentStep ? 'complete' : 'inactive'
  }

  const canGoToStep = (step: number) =>
    step >= 1 &&
    step <= totalSteps &&
    canNavigateToStep(step, currentStep)

  const goToStep = (step: number) => {
    if (canGoToStep(step)) onStepChange(step)
  }

  const goBack = () => {
    if (!isFirstStep) onStepChange(currentStep - 1)
  }

  const goNext = () => {
    if (!isLastStep) onStepChange(currentStep + 1)
  }

  const complete = () => {
    if (isLastStep) onFinalStepCompleted()
  }

  const controls: StepperRenderProps = {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    canGoToStep,
    getStepStatus,
    goToStep,
    goBack,
    goNext,
    complete,
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} {...rest}>
      <div className={[styles.progressSlot, progressClassName].filter(Boolean).join(' ')}>
        {renderProgress ? renderProgress(controls) : <DefaultProgress {...controls} />}
      </div>

      <StepContentWrapper
        currentStep={currentStep}
        direction={direction}
        className={[styles.contentSlot, contentClassName].filter(Boolean).join(' ')}
      >
        {stepsArray[currentStep - 1]}
      </StepContentWrapper>

      <div className={[styles.footerSlot, footerClassName].filter(Boolean).join(' ')}>
        {renderFooter ? renderFooter(controls) : <DefaultFooter {...controls} />}
      </div>
    </div>
  )
}

function StepContentWrapper({
  currentStep,
  direction,
  children,
  className,
}: {
  currentStep: number
  direction: number
  children: ReactNode
  className: string
}) {
  const [parentHeight, setParentHeight] = useState(0)

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: parentHeight }}
      transition={{ type: 'spring', duration: 0.42, bounce: 0.14 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        <SlideTransition
          key={currentStep}
          direction={direction}
          onHeightReady={(height) => setParentHeight(height)}
        >
          {children}
        </SlideTransition>
      </AnimatePresence>
    </motion.div>
  )
}

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight)
  }, [children, onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      className={styles.slide}
    >
      {children}
    </motion.div>
  )
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '10%' : '-10%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-8%' : '8%',
    opacity: 0,
  }),
}

export function Step({ children }: { children: ReactNode }) {
  return <div className={styles.step}>{children}</div>
}

function DefaultProgress({
  totalSteps,
  getStepStatus,
  goToStep,
  canGoToStep,
}: StepperRenderProps) {
  return (
    <div className={styles.defaultProgress}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1
        const status = getStepStatus(step)

        return (
          <button
            key={step}
            type="button"
            className={[
              styles.defaultIndicator,
              status === 'active'
                ? styles.defaultIndicatorActive
                : status === 'complete'
                  ? styles.defaultIndicatorComplete
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={status === 'inactive' && !canGoToStep(step)}
            onClick={() => goToStep(step)}
            aria-current={status === 'active' ? 'step' : undefined}
            aria-label={`Step ${step}`}
          >
            {status === 'complete' ? '✓' : step}
          </button>
        )
      })}
    </div>
  )
}

function DefaultFooter({ isFirstStep, isLastStep, goBack, goNext, complete }: StepperRenderProps) {
  return (
    <div className={styles.defaultFooter}>
      <button type="button" onClick={goBack} disabled={isFirstStep}>
        Previous
      </button>
      <button type="button" onClick={isLastStep ? complete : goNext}>
        {isLastStep ? 'Complete' : 'Next'}
      </button>
    </div>
  )
}
