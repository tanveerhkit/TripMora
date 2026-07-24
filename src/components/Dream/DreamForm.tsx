import type { DreamAnswers } from '../../types/dream'
import { DestinationQuestionnaire } from './Questionnaire/DestinationQuestionnaire'

interface Props {
  onSubmit: (answers: DreamAnswers) => void
  onBack: () => void
  loading?: boolean
  initialAnswers?: DreamAnswers | null
}

export function DreamForm(props: Props) {
  return <DestinationQuestionnaire {...props} />
}
