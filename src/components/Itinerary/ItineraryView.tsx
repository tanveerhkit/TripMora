import { useCallback, useEffect, useState } from 'react'
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
import { Icon } from '../ui/Icon'
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
  const [activeDayId, setActiveDayId] = useState(itinerary.days[0]?.id ?? '')

  const totalStops = itinerary.days.reduce((total, day) => total + day.stops.length, 0)

  useEffect(() => {
    const firstDayId = itinerary.days[0]?.id ?? ''
    setActiveDayId((current) =>
      itinerary.days.some((day) => day.id === current) ? current : firstDayId,
    )

    if (typeof IntersectionObserver === 'undefined') return
    const sections = itinerary.days
      .map((day) => document.getElementById(`day-${day.id}`))
      .filter((section): section is HTMLElement => Boolean(section))
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const firstVisible = visible[0]?.target as HTMLElement | undefined
        if (firstVisible) setActiveDayId(firstVisible.id.replace('day-', ''))
      },
      { rootMargin: '-96px 0px -62% 0px', threshold: [0, 0.15, 0.5] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [itinerary.days])

  const scrollToDay = (dayId: string) => {
    const section = document.getElementById(`day-${dayId}`)
    section?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    setActiveDayId(dayId)
  }

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
      <aside className={styles.leftRail} aria-label="Trip overview">
        <div className={styles.railCard}>
          <div className={styles.railKicker}>
            <Icon name="compass" size={15} />
            <span>Trip guide</span>
          </div>
          <h1 className={styles.railDestination}>Your journey</h1>
          <p className={styles.railSummary}>
            {itinerary.meta.travelerType || 'A thoughtfully paced journey'}
          </p>

          <dl className={styles.railStats}>
            <div>
              <dt>Days</dt>
              <dd>{itinerary.days.length}</dd>
            </div>
            <div>
              <dt>Stops</dt>
              <dd>{totalStops}</dd>
            </div>
          </dl>

          <div className={styles.railDivider} />
          <nav className={styles.dayNav} aria-label="Jump to day">
            <span className={styles.dayNavLabel}>Your route</span>
            {itinerary.days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                className={`${styles.dayLink} ${activeDayId === day.id ? styles.dayLinkActive : ''}`}
                aria-current={activeDayId === day.id ? 'location' : undefined}
                aria-label={`Day ${index + 1}: ${day.title}`}
                title={day.title}
                onClick={() => scrollToDay(day.id)}
              >
                <span className={styles.dayLinkNumber}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.dayLinkCopy}>
                  <strong>Day {index + 1}</strong>
                  <small>{day.stops.length} {day.stops.length === 1 ? 'stop' : 'stops'}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className={styles.railFooter}>
            <Icon name="route" size={15} />
            <span>Follow the plan at your own pace.</span>
          </div>
        </div>
      </aside>

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
              id={`day-${day.id}`}
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
