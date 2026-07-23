import { useCallback, useState } from 'react'
import {
  addDay,
  addPacking,
  addStop,
  deleteDay,
  deletePacking,
  deleteStop,
  reorderDays,
  reorderStops,
  setBudgetOption,
  togglePacking,
  updateDay,
  updateStop,
} from '../../lib/itineraryOps'
import type { Day, Itinerary, Stop } from '../../types/itinerary'
import { Button } from '../ui/Button'
import { BudgetBlock } from './BudgetBlock'
import { DayCard } from './DayCard'
import { OverviewCard } from './OverviewCard'
import { PackingChecklist } from './PackingChecklist'
import { RecoveryBar } from './RecoveryBar'
import { RefinementBar } from './RefinementBar'
import { TipsBlock } from './TipsBlock'
import styles from './ItineraryView.module.css'

interface Props {
  itinerary: Itinerary
  mutate: (fn: (it: Itinerary) => Itinerary) => void
  onRefine: (prompt: string) => void
  onRecover: (prompt: string) => void
  refining: boolean
  recovering: boolean
}

export function ItineraryView({
  itinerary,
  mutate,
  onRefine,
  onRecover,
  refining,
  recovering,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const missedStops = itinerary.days.flatMap((d) =>
    d.stops.filter((s) => s.status === 'missed'),
  )

  const handleRecover = (notes: string) => {
    const titles = missedStops
      .map((s) => s.title)
      .filter(Boolean)
      .slice(0, 12)
      .join(', ')
    const base = titles
      ? `I've marked these stops as missed: ${titles}. Rework my remaining plan to recover — refit the important ones into the time I have left, or swap in a strong nearby alternative.`
      : 'Some stops are marked missed. Rework my remaining plan to recover them.'
    onRecover(notes ? `${base} Also, what went wrong: ${notes}` : base)
  }

  const toggleCollapse = useCallback((dayId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(dayId) ? next.delete(dayId) : next.add(dayId)
      return next
    })
  }, [])

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => setCollapsed(new Set(itinerary.days.map((d) => d.id)))
  const allCollapsed = collapsed.size === itinerary.days.length && itinerary.days.length > 0

  /* stop handlers */
  const handleStopChange = (dayId: string, stopId: string, patch: Partial<Stop>) =>
    mutate((it) => updateStop(it, dayId, stopId, patch))
  const handleStopDelete = (dayId: string, stopId: string) =>
    mutate((it) => deleteStop(it, dayId, stopId))
  const handleAddStop = (dayId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(dayId)
      return next
    })
    mutate((it) => addStop(it, dayId).itinerary)
  }
  const handleReorderStops = (dayId: string, from: number, to: number) =>
    mutate((it) => reorderStops(it, dayId, from, to))

  /* day handlers */
  const handleDayChange = (dayId: string, patch: Partial<Day>) =>
    mutate((it) => updateDay(it, dayId, patch))
  const handleDayDelete = (dayId: string) => {
    if (!window.confirm('Delete this whole day?')) return
    mutate((it) => deleteDay(it, dayId))
  }
  const handleMoveDay = (index: number, direction: -1 | 1) => {
    const to = index + direction
    if (to < 0 || to >= itinerary.days.length) return
    mutate((it) => reorderDays(it, index, to))
  }
  const handleAddDay = () => mutate((it) => addDay(it).itinerary)

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <OverviewCard itinerary={itinerary} />
        {missedStops.length > 0 && (
          <RecoveryBar
            missedCount={missedStops.length}
            onRecover={handleRecover}
            loading={recovering}
          />
        )}
        <RefinementBar onRefine={onRefine} loading={refining || recovering} />

        <div className={styles.toolbar}>
          <h3 className={styles.daysTitle}>Day by day</h3>
          <div className={styles.toolbarActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={allCollapsed ? expandAll : collapseAll}
            >
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </Button>
            <Button variant="secondary" size="sm" icon="plus" onClick={handleAddDay}>
              Add day
            </Button>
          </div>
        </div>

        <div className={styles.days}>
          {itinerary.days.map((day, index) => (
            <DayCard
              key={day.id}
              day={day}
              index={index}
              total={itinerary.days.length}
              currency={itinerary.meta.currency}
              destination={itinerary.meta.destination}
              collapsed={collapsed.has(day.id)}
              onToggleCollapse={() => toggleCollapse(day.id)}
              onStopChange={(stopId, patch) => handleStopChange(day.id, stopId, patch)}
              onStopDelete={(stopId) => handleStopDelete(day.id, stopId)}
              onAddStop={() => handleAddStop(day.id)}
              onReorderStops={(from, to) => handleReorderStops(day.id, from, to)}
              onDayChange={(patch) => handleDayChange(day.id, patch)}
              onDayDelete={() => handleDayDelete(day.id)}
              onMoveDay={(direction) => handleMoveDay(index, direction)}
            />
          ))}
        </div>
      </div>

      <aside className={styles.side}>
        <BudgetBlock
          items={itinerary.budget}
          currency={itinerary.meta.currency}
          onSelectOption={(index, optionId) =>
            mutate((it) => setBudgetOption(it, index, optionId))
          }
        />
        <PackingChecklist
          items={itinerary.packing}
          onToggle={(id) => mutate((it) => togglePacking(it, id))}
          onAdd={(text) => mutate((it) => addPacking(it, text))}
          onDelete={(id) => mutate((it) => deletePacking(it, id))}
        />
        <TipsBlock tips={itinerary.tips} />
      </aside>
    </div>
  )
}
