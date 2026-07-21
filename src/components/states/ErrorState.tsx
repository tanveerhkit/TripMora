import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import type { ErrorInfo } from '../../hooks/useItinerary'
import styles from './states.module.css'

interface Props {
  error: ErrorInfo
  onRetry: () => void
  onStartOver: () => void
}

const KIND_LABEL: Record<ErrorInfo['kind'], string> = {
  json: 'bad response',
  shape: 'unexpected format',
  empty: 'empty result',
  network: 'connection',
  http: 'service error',
}

export function ErrorState({ error, onRetry, onStartOver }: Props) {
  return (
    <div className={styles.state} role="alert">
      <div className={`${styles.stateIcon} ${styles.err}`}>
        <Icon name="warning" size={28} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--sp-2)', justifyItems: 'center' }}>
        <span className={styles.kindTag}>{KIND_LABEL[error.kind]}</span>
        <h3>That didn&apos;t work</h3>
        <p>{error.message}</p>
      </div>
      <div className={styles.actions}>
        <Button variant="primary" icon="retry" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          Start over
        </Button>
      </div>
    </div>
  )
}
