import { formatMoney } from '../../lib/format'
import type { BudgetItem } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import styles from './Blocks.module.css'

interface Props {
  items: BudgetItem[]
  currency: string
}

export function BudgetBlock({ items, currency }: Props) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((i) => i.amount), 1)
  const total = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <section className={styles.panel} aria-label="Estimated budget">
      <div className={styles.panelHead}>
        <span className={styles.panelIcon}>
          <Icon name="wallet" size={18} />
        </span>
        <h3>Estimated budget</h3>
        <span className={styles.panelCount}>per person</span>
      </div>

      <div className={styles.budgetList}>
        {items.map((item) => {
          const pct = Math.round((item.amount / max) * 100)
          return (
            <div className={styles.budgetRow} key={item.label}>
              <div className={styles.budgetRowTop}>
                <span className={styles.budgetLabel}>{item.label}</span>
                <span className={styles.budgetAmount}>
                  {formatMoney(item.amount, currency)}
                </span>
              </div>
              <div
                className={styles.bar}
                role="img"
                aria-label={`${item.label}: ${formatMoney(item.amount, currency)}`}
              >
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.budgetTotal}>
        <span>Total</span>
        <span>{formatMoney(total, currency)}</span>
      </div>
    </section>
  )
}
