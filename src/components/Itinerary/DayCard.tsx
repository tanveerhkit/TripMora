import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Day, Stop } from '../../types/itinerary'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { StopItem } from './StopItem'
import styles from './DayCard.module.css'

interface Props {
  day: Day
  index: number
  total: number
  currency: string
  destination: string
  collapsed: boolean
  onToggleCollapse: () => void
  onStopChange: (stopId: string, patch: Partial<Stop>) => void
  onStopDelete: (stopId: string) => void
  onAddStop: () => void
  onReorderStops: (from: number, to: number) => void
  onDayChange: (patch: Partial<Day>) => void
  onDayDelete: () => void
  onMoveDay: (direction: -1 | 1) => void
}

export function DayCard({
  day,
  index,
  total,
  currency,
  destination,
  collapsed,
  onToggleCollapse,
  onStopChange,
  onStopDelete,
  onAddStop,
  onReorderStops,
  onDayChange,
  onDayDelete,
  onMoveDay,
}: Props) {
  const [editing, setEditing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = day.stops.findIndex((s) => s.id === active.id)
    const to = day.stops.findIndex((s) => s.id === over.id)
    if (from !== -1 && to !== -1) onReorderStops(from, to)
  }

  return (
    <section className={styles.day} aria-label={`Day ${index + 1}: ${day.title}`}>
      <header className={styles.header}>
        <span className={styles.dayNo} aria-hidden="true">
          {index + 1}
        </span>

        <button
          type="button"
          className={styles.titleBtn}
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          <span className={styles.titleText}>
            {editing ? 'Editing day' : day.title}
            <Icon
              name="chevron"
              size={18}
              className={`${styles.chev} ${collapsed ? '' : styles.chevOpen}`}
            />
          </span>
          {!editing && day.summary && <span className={styles.summary}>{day.summary}</span>}
        </button>

        <div className={styles.headerActions}>
          <div className={styles.moveGroup}>
            <Button
              variant="ghost"
              size="sm"
              icon="chevron"
              iconOnly
              aria-label="Move day up"
              className={styles.up}
              disabled={index === 0}
              onClick={() => onMoveDay(-1)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon="chevron"
              iconOnly
              aria-label="Move day down"
              disabled={index === total - 1}
              onClick={() => onMoveDay(1)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon="edit"
            iconOnly
            aria-label="Edit day"
            onClick={() => setEditing((v) => !v)}
          />
          <Button
            variant="danger"
            size="sm"
            icon="trash"
            iconOnly
            aria-label="Delete day"
            onClick={onDayDelete}
          />
        </div>
      </header>

      {editing && (
        <div className={styles.dayEditor}>
          <label className={styles.editField}>
            <span>Day title</span>
            <input
              value={day.title}
              onChange={(e) => onDayChange({ title: e.target.value })}
            />
          </label>
          <label className={styles.editField}>
            <span>Summary</span>
            <input
              value={day.summary}
              onChange={(e) => onDayChange({ summary: e.target.value })}
              placeholder="One line about the day"
            />
          </label>
          <Button variant="primary" size="sm" icon="check" onClick={() => setEditing(false)}>
            Done
          </Button>
        </div>
      )}

      {!collapsed && (
        <div className={styles.bodyWrap}>
          {day.stops.length === 0 ? (
            <p className={styles.emptyDay}>No stops yet — add one below.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={day.stops.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className={styles.stops}>
                  {day.stops.map((stop) => (
                    <StopItem
                      key={stop.id}
                      stop={stop}
                      currency={currency}
                      destination={destination}
                      onChange={(patch) => onStopChange(stop.id, patch)}
                      onDelete={() => onStopDelete(stop.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <Button variant="subtle" size="sm" icon="plus" onClick={onAddStop} className={styles.addStop}>
            Add stop
          </Button>
        </div>
      )}
    </section>
  )
}
