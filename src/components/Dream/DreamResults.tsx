import type { DestinationRec, DreamResult } from '../../types/dream'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { DestinationCard } from './DestinationCard'
import styles from './DreamResults.module.css'

interface Props {
  result: DreamResult
  onPlan: (dest: DestinationRec) => void
  onAdjust: () => void
}

export function DreamResults({ result, onPlan, onAdjust }: Props) {
  const maxCost = Math.max(...result.destinations.map((d) => d.estCost ?? 0), 1)

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            <Icon name="sparkles" size={15} /> Where you could go
          </span>
          <h2 className={styles.title}>
            {result.destinations.length} {result.destinations.length === 1 ? 'match' : 'matches'} for you
          </h2>
          {result.summary && <p className={styles.summary}>{result.summary}</p>}
        </div>
        <Button variant="secondary" size="sm" icon="edit" onClick={onAdjust}>
          Adjust answers
        </Button>
      </header>

      <p className={styles.compareNote}>
        <Icon name="coin" size={14} /> Costs are rough per-person estimates in {result.currency},
        shown on the same scale so you can compare.
      </p>

      <div className={styles.grid}>
        {result.destinations.map((dest, i) => (
          <DestinationCard
            key={dest.id}
            dest={dest}
            currency={result.currency}
            maxCost={maxCost}
            rank={i + 1}
            onPlan={() => onPlan(dest)}
          />
        ))}
      </div>
    </div>
  )
}
