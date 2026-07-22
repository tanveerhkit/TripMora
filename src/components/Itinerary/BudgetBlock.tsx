import { useState } from 'react'
import { formatMoney } from '../../lib/format'
import {
  classifyBudget,
  defaultOptionId,
  kindMeta,
} from '../../lib/budgetOptions'
import type { BudgetItem } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import styles from './Blocks.module.css'

interface Props {
  items: BudgetItem[]
  currency: string
  onSelectOption: (index: number, optionId: string) => void
}

export function BudgetBlock({ items, currency, onSelectOption }: Props) {
  const [open, setOpen] = useState<number | null>(null)

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
        {items.map((item, index) => {
          const kind = item.kind ?? classifyBudget(item.label)
          const base = item.baseAmount ?? item.amount
          const selected = item.option ?? defaultOptionId(kind)
          const meta = kindMeta(kind)
          const isOpen = open === index
          const pct = Math.round((item.amount / max) * 100)

          return (
            <div className={styles.budgetRow} key={`${item.label}-${index}`}>
              <button
                type="button"
                className={styles.budgetRowTop}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span className={styles.budgetLabel}>
                  <Icon name={meta.icon} size={15} />
                  {item.label}
                </span>
                <span className={styles.budgetRight}>
                  <span className={styles.budgetAmount}>{formatMoney(item.amount, currency)}</span>
                  <Icon
                    name="chevron"
                    size={16}
                    className={`${styles.budgetChev} ${isOpen ? styles.budgetChevOpen : ''}`}
                  />
                </span>
              </button>

              <div className={styles.bar}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>

              {isOpen && (
                <div className={styles.budgetDetail}>
                  <p className={styles.budgetCovers}>{meta.covers}</p>

                  <div className={styles.optionGrid} role="radiogroup" aria-label={`${item.label} options`}>
                    {meta.options.map((opt) => {
                      const active = opt.id === selected
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          role="radio"
                          aria-checked={active}
                          className={`${styles.option} ${active ? styles.optionOn : ''}`}
                          onClick={() => onSelectOption(index, opt.id)}
                        >
                          <span className={styles.optionName}>
                            {active && <Icon name="check" size={12} />}
                            {opt.label}
                          </span>
                          <span className={styles.optionPrice}>
                            {formatMoney(Math.round(base * opt.mult), currency)}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {(() => {
                    const chosen = meta.options.find((o) => o.id === selected)
                    return chosen ? <p className={styles.optionNote}>{chosen.note}</p> : null
                  })()}

                  <p className={styles.booking}>
                    <Icon name="bulb" size={14} />
                    <span>{meta.booking}</span>
                  </p>
                </div>
              )}
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
