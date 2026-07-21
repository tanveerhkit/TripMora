/**
 * Pure, immutable operations on an Itinerary. Every function returns a new
 * object (never mutates), and bumps `updatedAt`. Components call these through
 * the `mutate` helper on the useItinerary hook, which keeps the UI logic tiny.
 */
import {
  emptyDay,
  emptyStop,
  packingItem,
  type Day,
  type Itinerary,
  type PackingItem,
  type Stop,
} from '../types/itinerary'

function touch(it: Itinerary): Itinerary {
  return { ...it, updatedAt: Date.now() }
}

function mapDays(it: Itinerary, fn: (day: Day) => Day): Itinerary {
  return touch({ ...it, days: it.days.map(fn) })
}

/** Move an item within an array immutably. */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/* ----------------------------- stops ----------------------------- */

export function updateStop(
  it: Itinerary,
  dayId: string,
  stopId: string,
  patch: Partial<Stop>,
): Itinerary {
  return mapDays(it, (day) =>
    day.id !== dayId
      ? day
      : {
          ...day,
          stops: day.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)),
        },
  )
}

export function deleteStop(it: Itinerary, dayId: string, stopId: string): Itinerary {
  return mapDays(it, (day) =>
    day.id !== dayId ? day : { ...day, stops: day.stops.filter((s) => s.id !== stopId) },
  )
}

export function addStop(it: Itinerary, dayId: string): { itinerary: Itinerary; newStopId: string } {
  const stop = emptyStop()
  const itinerary = mapDays(it, (day) =>
    day.id !== dayId ? day : { ...day, stops: [...day.stops, stop] },
  )
  return { itinerary, newStopId: stop.id }
}

export function reorderStops(
  it: Itinerary,
  dayId: string,
  from: number,
  to: number,
): Itinerary {
  return mapDays(it, (day) =>
    day.id !== dayId ? day : { ...day, stops: arrayMove(day.stops, from, to) },
  )
}

/* ------------------------------ days ----------------------------- */

export function updateDay(it: Itinerary, dayId: string, patch: Partial<Day>): Itinerary {
  return mapDays(it, (day) => (day.id === dayId ? { ...day, ...patch } : day))
}

export function deleteDay(it: Itinerary, dayId: string): Itinerary {
  return touch({ ...it, days: it.days.filter((d) => d.id !== dayId) })
}

export function addDay(it: Itinerary): { itinerary: Itinerary; newDayId: string } {
  const day = emptyDay(it.days.length)
  return { itinerary: touch({ ...it, days: [...it.days, day] }), newDayId: day.id }
}

export function reorderDays(it: Itinerary, from: number, to: number): Itinerary {
  return touch({ ...it, days: arrayMove(it.days, from, to) })
}

/* ---------------------------- packing ---------------------------- */

export function togglePacking(it: Itinerary, itemId: string): Itinerary {
  return touch({
    ...it,
    packing: it.packing.map((p) => (p.id === itemId ? { ...p, done: !p.done } : p)),
  })
}

export function addPacking(it: Itinerary, text: string): Itinerary {
  const trimmed = text.trim()
  if (!trimmed) return it
  return touch({ ...it, packing: [...it.packing, packingItem(trimmed)] })
}

export function deletePacking(it: Itinerary, itemId: string): Itinerary {
  return touch({ ...it, packing: it.packing.filter((p) => p.id !== itemId) })
}

/* --------------------------- refinement -------------------------- */

/**
 * Merge a refined itinerary from the AI back over the previous one:
 * keep the stable id/createdAt and carry over which packing items were
 * already checked (matched by text), so a refinement doesn't wipe local state.
 */
export function mergeRefined(prev: Itinerary, next: Itinerary): Itinerary {
  const doneByText = new Map<string, boolean>()
  for (const p of prev.packing) doneByText.set(p.text.toLowerCase(), p.done)

  const packing: PackingItem[] = next.packing.map((p) =>
    doneByText.get(p.text.toLowerCase()) ? { ...p, done: true } : p,
  )

  return {
    ...next,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: Date.now(),
    packing,
  }
}

/* ---------------------------- derived ---------------------------- */

export function estimatedTotal(it: Itinerary): number {
  if (it.budget.length) {
    return it.budget.reduce((sum, b) => sum + b.amount, 0)
  }
  // fall back to summing per-stop costs
  return it.days.reduce(
    (sum, d) => sum + d.stops.reduce((s, stop) => s + (stop.cost ?? 0), 0),
    0,
  )
}

export function countStops(it: Itinerary): number {
  return it.days.reduce((n, d) => n + d.stops.length, 0)
}
