import type { DreamAnswers } from '../../../types/dream'
import type { IconName } from '../../ui/Icon'

export interface QuestionnaireState {
  travelTime: ChoiceValue
  budget: ChoiceValue
  travelers: ChoiceValue
  tripStyle: ChoiceValue
  visaPreference: ChoiceValue
  foodPreference: ChoiceValue
  climate: ChoiceValue
  destinationType: ChoiceValue
  withKids: boolean | null
  withElderly: boolean | null
  travelFrom: string
  additionalNotes: string
}

export type ChoiceValue = string | string[]

export type ChoiceFieldKey =
  | 'travelTime'
  | 'budget'
  | 'travelers'
  | 'tripStyle'
  | 'visaPreference'
  | 'foodPreference'
  | 'climate'
  | 'destinationType'

export type ToggleFieldKey = 'withKids' | 'withElderly'
export type TextFieldKey = 'travelFrom'
export type TextAreaFieldKey = 'additionalNotes'
export type QuestionFieldKey =
  | ChoiceFieldKey
  | ToggleFieldKey
  | TextFieldKey
  | TextAreaFieldKey

interface BaseStep {
  id: string
  indicatorLabel: string
  title: string
  description: string
  icon: IconName
  required?: boolean
}

export interface ChoiceQuestionStep extends BaseStep {
  kind: 'choice'
  field: ChoiceFieldKey
  options: string[]
  multiple?: boolean
}

export interface ToggleQuestionStep extends BaseStep {
  kind: 'toggle'
  field: ToggleFieldKey
}

export interface TextQuestionStep extends BaseStep {
  kind: 'text'
  field: TextFieldKey
  placeholder: string
}

export interface TextAreaQuestionStep extends BaseStep {
  kind: 'textarea'
  field: TextAreaFieldKey
  placeholder: string
}

export type QuestionnaireStep =
  | ChoiceQuestionStep
  | ToggleQuestionStep
  | TextQuestionStep
  | TextAreaQuestionStep

export function createQuestionnaireState(
  initialAnswers?: DreamAnswers | null,
): QuestionnaireState {
  if (!initialAnswers) {
    return {
      travelTime: '',
      budget: '',
      travelers: '',
      tripStyle: '',
      visaPreference: '',
      foodPreference: '',
      climate: '',
      destinationType: '',
      withKids: null,
      withElderly: null,
      travelFrom: '',
      additionalNotes: '',
    }
  }

  return {
    travelTime: initialAnswers.when,
    budget: initialAnswers.budget,
    travelers: initialAnswers.company,
    tripStyle: initialAnswers.style,
    visaPreference: initialAnswers.visa,
    foodPreference: initialAnswers.food,
    climate: initialAnswers.temperature,
    destinationType: initialAnswers.terrain,
    withKids: initialAnswers.kids,
    withElderly: initialAnswers.elderly,
    travelFrom: initialAnswers.homeCountry,
    additionalNotes: initialAnswers.notes,
  }
}

export function toDreamAnswers(state: QuestionnaireState): DreamAnswers {
  return {
    when: choiceValueToText(state.travelTime),
    budget: choiceValueToText(state.budget),
    company: choiceValueToText(state.travelers),
    style: choiceValueToText(state.tripStyle),
    kids: Boolean(state.withKids),
    elderly: Boolean(state.withElderly),
    visa: choiceValueToText(state.visaPreference),
    food: choiceValueToText(state.foodPreference),
    temperature: choiceValueToText(state.climate),
    terrain: choiceValueToText(state.destinationType),
    homeCountry: state.travelFrom.trim(),
    notes: state.additionalNotes.trim(),
  }
}

export function choiceValueToText(value: ChoiceValue) {
  return Array.isArray(value) ? value.join(', ') : value
}
