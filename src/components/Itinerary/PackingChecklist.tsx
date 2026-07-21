import { useState, type FormEvent } from 'react'
import type { PackingItem } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import styles from './Blocks.module.css'

interface Props {
  items: PackingItem[]
  onToggle: (id: string) => void
  onAdd: (text: string) => void
  onDelete: (id: string) => void
}

export function PackingChecklist({ items, onToggle, onAdd, onDelete }: Props) {
  const [text, setText] = useState('')
  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value)
    setText('')
  }

  return (
    <section className={styles.panel} aria-label="Packing checklist">
      <div className={styles.panelHead}>
        <span className={styles.panelIcon}>
          <Icon name="suitcase" size={18} />
        </span>
        <h3>Packing list</h3>
        <span className={styles.panelCount}>
          {done}/{items.length}
        </span>
      </div>

      {items.length > 0 && (
        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      )}

      <ul className={styles.checkList}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`${styles.checkItem} ${item.done ? styles.done : ''}`}
          >
            <button
              type="button"
              className={styles.check}
              onClick={() => onToggle(item.id)}
              aria-pressed={item.done}
            >
              <span className={`${styles.box} ${item.done ? styles.boxOn : ''}`}>
                <Icon name="check" size={13} />
              </span>
              <span className={styles.checkText}>{item.text}</span>
            </button>
            <button
              type="button"
              className={styles.removeItem}
              aria-label={`Remove ${item.text}`}
              onClick={() => onDelete(item.id)}
            >
              <Icon name="close" size={15} />
            </button>
          </li>
        ))}
      </ul>

      <form className={styles.addRow} onSubmit={submit}>
        <input
          className={styles.addInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item…"
          aria-label="Add packing item"
        />
        <button
          type="submit"
          className={styles.removeItem}
          style={{ opacity: 1, color: 'var(--accent)' }}
          aria-label="Add item"
        >
          <Icon name="plus" size={18} />
        </button>
      </form>
    </section>
  )
}
