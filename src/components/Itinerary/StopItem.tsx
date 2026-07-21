import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CATEGORY_META, CATEGORY_OPTIONS } from '../../lib/categories'
import { formatDuration, formatMoney } from '../../lib/format'
import type { Stop, StopCategory } from '../../types/itinerary'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import styles from './StopItem.module.css'

interface Props {
  stop: Stop
  currency: string
  onChange: (patch: Partial<Stop>) => void
  onDelete: () => void
}

export function StopItem({ stop, currency, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)

  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const meta = CATEGORY_META[stop.category]
  const hasDetails = Boolean(stop.description || stop.tip)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.stop} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.rail}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={styles.grip}
          aria-label={`Reorder ${stop.title}`}
          {...attributes}
          {...listeners}
        >
          <Icon name="grip" size={18} />
        </button>
        <span
          className={styles.badge}
          style={{ color: `var(${meta.colorVar})` }}
          title={meta.label}
        >
          <Icon name={meta.icon} size={18} />
        </span>
      </div>

      {editing ? (
        <StopEditor
          stop={stop}
          onSave={(patch) => {
            onChange(patch)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className={styles.body}>
          <div className={styles.headline}>
            <div className={styles.titleWrap}>
              {stop.time && <span className={styles.time}>{stop.time}</span>}
              <h4 className={styles.title}>{stop.title}</h4>
            </div>
            <div className={styles.rowActions}>
              <Button
                variant="ghost"
                size="sm"
                icon="edit"
                iconOnly
                aria-label="Edit stop"
                onClick={() => setEditing(true)}
              />
              <Button
                variant="danger"
                size="sm"
                icon="trash"
                iconOnly
                aria-label="Delete stop"
                onClick={onDelete}
              />
              {hasDetails && (
                <button
                  type="button"
                  className={`${styles.disclosure} ${expanded ? styles.open : ''}`}
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                  onClick={() => setExpanded((v) => !v)}
                >
                  <Icon name="chevron" size={18} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.tag} style={{ color: `var(${meta.colorVar})` }}>
              {meta.label}
            </span>
            {stop.durationMin ? (
              <span className={styles.metaItem}>
                <Icon name="clock" size={14} />
                {formatDuration(stop.durationMin)}
              </span>
            ) : null}
            {stop.cost !== null ? (
              <span className={styles.metaItem}>
                <Icon name="coin" size={14} />
                {stop.cost === 0 ? 'Free' : formatMoney(stop.cost, currency)}
              </span>
            ) : null}
          </div>

          {hasDetails && expanded && (
            <div className={styles.details}>
              {stop.description && <p className={styles.desc}>{stop.description}</p>}
              {stop.tip && (
                <p className={styles.tip}>
                  <Icon name="bulb" size={15} />
                  <span>{stop.tip}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

/* ------------------------- inline editor ------------------------- */

function StopEditor({
  stop,
  onSave,
  onCancel,
}: {
  stop: Stop
  onSave: (patch: Partial<Stop>) => void
  onCancel: () => void
}) {
  const [time, setTime] = useState(stop.time)
  const [title, setTitle] = useState(stop.title)
  const [category, setCategory] = useState<StopCategory>(stop.category)
  const [duration, setDuration] = useState(stop.durationMin?.toString() ?? '')
  const [cost, setCost] = useState(stop.cost?.toString() ?? '')
  const [description, setDescription] = useState(stop.description)
  const [tip, setTip] = useState(stop.tip)

  function save() {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    const durNum = duration.trim() === '' ? null : Number.parseInt(duration, 10)
    const costNum = cost.trim() === '' ? null : Number.parseFloat(cost)
    onSave({
      time: time.trim(),
      title: cleanTitle,
      category,
      durationMin: durNum !== null && Number.isFinite(durNum) ? durNum : null,
      cost: costNum !== null && Number.isFinite(costNum) ? costNum : null,
      description: description.trim(),
      tip: tip.trim(),
    })
  }

  return (
    <div className={styles.editor}>
      <div className={styles.editGrid}>
        <label className={styles.editField} style={{ gridColumn: 'span 1' }}>
          <span>Time</span>
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="09:00" />
        </label>
        <label className={styles.editField} style={{ gridColumn: 'span 3' }}>
          <span>Title</span>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <label className={styles.editField} style={{ gridColumn: 'span 2' }}>
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as StopCategory)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.editField} style={{ gridColumn: 'span 1' }}>
          <span>Minutes</span>
          <input
            value={duration}
            inputMode="numeric"
            onChange={(e) => setDuration(e.target.value)}
            placeholder="90"
          />
        </label>
        <label className={styles.editField} style={{ gridColumn: 'span 1' }}>
          <span>Cost</span>
          <input
            value={cost}
            inputMode="numeric"
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
        </label>
      </div>
      <label className={styles.editField}>
        <span>Description</span>
        <textarea
          value={description}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className={styles.editField}>
        <span>Tip</span>
        <input value={tip} onChange={(e) => setTip(e.target.value)} />
      </label>
      <div className={styles.editActions}>
        <Button variant="primary" size="sm" icon="check" onClick={save} disabled={!title.trim()}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
