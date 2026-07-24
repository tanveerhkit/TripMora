import { useMemo, useState } from 'react'
import type { DreamAnswers } from '../../../types/dream'
import Stepper, { Step, type StepperRenderProps } from '../../ui/Stepper'
import { NavigationFooter } from './NavigationFooter'
import { OptionChip } from './OptionChip'
import { ProgressHeader } from './ProgressHeader'
import { QuestionCard } from './QuestionCard'
import { QuestionHeader } from './QuestionHeader'
import { TextAreaQuestion } from './TextAreaQuestion'
import { TextQuestion } from './TextQuestion'
import { ToggleQuestion } from './ToggleQuestion'
import { QUESTIONNAIRE_STEPS } from './questionnaireConfig'
import {
  createQuestionnaireState,
  toDreamAnswers,
  type ChoiceQuestionStep,
  type QuestionnaireState,
  type QuestionnaireStep,
} from './questionnaireTypes'
import styles from './Questionnaire.module.css'

interface Props {
  onSubmit: (answers: DreamAnswers) => void
  onBack: () => void
  loading?: boolean
  initialAnswers?: DreamAnswers | null
}

const QUESTION_COUNT = QUESTIONNAIRE_STEPS.length

export function DestinationQuestionnaire({
  onSubmit,
  onBack,
  loading = false,
  initialAnswers,
}: Props) {
  const [answers, setAnswers] = useState<QuestionnaireState>(() =>
    createQuestionnaireState(initialAnswers),
  )
  const [currentStep, setCurrentStep] = useState(() =>
    findInitialStep(createQuestionnaireState(initialAnswers)),
  )
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const currentConfig = QUESTIONNAIRE_STEPS[currentStep - 1]

  const stepLabels = useMemo(
    () => QUESTIONNAIRE_STEPS.map((step) => step.indicatorLabel),
    [],
  )

  function changeStep(step: number) {
    setValidationMessage(null)
    setCurrentStep(step)
  }

  function updateAnswer<K extends keyof QuestionnaireState>(
    key: K,
    value: QuestionnaireState[K],
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setValidationMessage(null)
  }

  function validateCurrentStep(step: QuestionnaireStep) {
    return validateStep(step, answers)
  }

  function handleNext(controls: StepperRenderProps) {
    const error = validateCurrentStep(currentConfig)
    if (error) {
      setValidationMessage(error)
      return
    }
    controls.goNext()
  }

  function handleComplete() {
    const error = validateCurrentStep(currentConfig)
    if (error) {
      setValidationMessage(error)
      return
    }
    onSubmit(toDreamAnswers(answers))
  }

  return (
    <div className={styles.shell}>
      <Stepper
        currentStep={currentStep}
        onStepChange={changeStep}
        onFinalStepCompleted={handleComplete}
        canNavigateToStep={(targetStep, liveStep) => targetStep < liveStep}
        className={styles.stepper}
        progressClassName={styles.progressSlot}
        contentClassName={styles.contentSlot}
        footerClassName={styles.footerSlot}
        renderProgress={(controls) => (
          <ProgressHeader
            currentStep={controls.currentStep}
            totalSteps={controls.totalSteps}
            currentTitle={currentConfig.title}
            labels={stepLabels}
            onExit={onBack}
            canGoToStep={controls.canGoToStep}
            goToStep={controls.goToStep}
            getStepStatus={controls.getStepStatus}
          />
        )}
        renderFooter={(controls) => (
          <NavigationFooter
            isFirstStep={controls.isFirstStep}
            isLastStep={controls.isLastStep}
            loading={loading}
            onPrevious={controls.goBack}
            onNext={() => handleNext(controls)}
            onComplete={controls.complete}
          />
        )}
      >
        {QUESTIONNAIRE_STEPS.map((step, index) => (
          <Step key={step.id}>{renderStep(step, index, answers, updateAnswer, validationMessage)}</Step>
        ))}
      </Stepper>
    </div>
  )
}

function renderStep(
  step: QuestionnaireStep,
  index: number,
  answers: QuestionnaireState,
  updateAnswer: <K extends keyof QuestionnaireState>(key: K, value: QuestionnaireState[K]) => void,
  validationMessage: string | null,
) {
  const stepLabel = `Question ${index + 1} of ${QUESTION_COUNT}`

  if (step.kind === 'choice') {
    const fieldValue = answers[step.field]
    const selectedValues = Array.isArray(fieldValue) ? fieldValue : [fieldValue]

    return (
      <QuestionCard validationMessage={validationMessage}>
        <QuestionHeader
          icon={step.icon}
          stepLabel={stepLabel}
          title={step.title}
          description={step.description}
        />
        <div className={styles.optionList} role="radiogroup" aria-label={step.title}>
          {step.options.map((option, optionIndex) => (
            <OptionChip
              key={option}
              label={option}
              selected={selectedValues.includes(option)}
              selectionMode={step.multiple ? 'multiple' : 'single'}
              index={optionIndex}
              onSelect={() => updateChoice(step, option, answers, updateAnswer)}
            />
          ))}
        </div>
      </QuestionCard>
    )
  }

  if (step.kind === 'toggle') {
    return (
      <QuestionCard validationMessage={validationMessage}>
        <QuestionHeader
          icon={step.icon}
          stepLabel={stepLabel}
          title={step.title}
          description={step.description}
        />
        <ToggleQuestion
          value={answers[step.field]}
          onChange={(value) => updateAnswer(step.field, value)}
        />
      </QuestionCard>
    )
  }

  if (step.kind === 'text') {
    return (
      <QuestionCard validationMessage={validationMessage}>
        <QuestionHeader
          icon={step.icon}
          stepLabel={stepLabel}
          title={step.title}
          description={step.description}
          optional={!step.required}
        />
        <TextQuestion
          value={answers[step.field]}
          placeholder={step.placeholder}
          onChange={(value) => updateAnswer(step.field, value)}
        />
      </QuestionCard>
    )
  }

  return (
    <QuestionCard validationMessage={validationMessage}>
      <QuestionHeader
        icon={step.icon}
        stepLabel={stepLabel}
        title={step.title}
        description={step.description}
        optional={!step.required}
      />
      <TextAreaQuestion
        value={answers[step.field]}
        placeholder={step.placeholder}
        onChange={(value) => updateAnswer(step.field, value)}
      />
    </QuestionCard>
  )
}

function updateChoice(
  step: ChoiceQuestionStep,
  nextValue: string,
  answers: QuestionnaireState,
  updateAnswer: <K extends keyof QuestionnaireState>(key: K, value: QuestionnaireState[K]) => void,
) {
  if (!step.multiple) {
    updateAnswer(step.field, nextValue)
    return
  }

  const current = answers[step.field]
  const currentValues: string[] = Array.isArray(current) ? current : []
  const exists = currentValues.includes(nextValue)
  const nextValues = exists
    ? currentValues.filter((value) => value !== nextValue)
    : [...currentValues, nextValue]

  updateAnswer(step.field, nextValues as QuestionnaireState[typeof step.field])
}

function validateStep(step: QuestionnaireStep, answers: QuestionnaireState) {
  if (!step.required) return null

  if (step.kind === 'choice') {
    const value = answers[step.field]
    if (Array.isArray(value)) {
      return value.length ? null : 'Please select at least one option to continue.'
    }
    return value ? null : 'Please select one option to continue.'
  }

  if (step.kind === 'toggle') {
    return answers[step.field] === null
      ? 'Please choose Yes or No to continue.'
      : null
  }

  if (step.kind === 'text') {
    return answers[step.field].trim()
      ? null
      : 'Please enter a value to continue.'
  }

  return answers[step.field].trim()
    ? null
    : 'Please add a response to continue.'
}

function findInitialStep(state: QuestionnaireState) {
  const firstIncompleteIndex = QUESTIONNAIRE_STEPS.findIndex((step) => {
    return Boolean(validateStep(step, state))
  })

  if (firstIncompleteIndex === -1) return QUESTIONNAIRE_STEPS.length
  return firstIncompleteIndex + 1
}
