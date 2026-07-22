/**
 * The clean, app-facing itinerary model.
 *
 * Every field is required and defaulted (no scattered `undefined` checks in the
 * UI). The AI never produces this shape directly — `parseItinerary` normalizes
 * whatever the model returns into this, generating stable ids and safe defaults.
 */

export const STOP_CATEGORIES = [
  'sightseeing',
  'food',
  'nature',
  'culture',
  'relax',
  'nightlife',
  'shopping',
  'transport',
  'adventure',
] as const

export type StopCategory = (typeof STOP_CATEGORIES)[number]

export interface Stop {
  id: string
  /** e.g. "08:10" or "Morning" — empty string if unknown. */
  time: string
  title: string
  description: string
  category: StopCategory
  /** estimated minutes at the stop, or null if unknown */
  durationMin: number | null
  /** estimated cost per person in the trip currency, or null */
  cost: number | null
  /** a short local-guide style tip ("go early, queue is shorter") */
  tip: string
}

export interface Day {
  id: string
  title: string
  summary: string
  stops: Stop[]
}

export type BudgetKind =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'misc'

export interface BudgetItem {
  label: string
  /** the current (possibly re-chosen) amount that counts toward the total */
  amount: number
  /** the AI's original estimate, which options scale from */
  baseAmount?: number
  kind?: BudgetKind
  /** id of the currently selected option for this category */
  option?: string
}

export interface PackingItem {
  id: string
  text: string
  done: boolean
}

export interface TripMeta {
  destination: string
  durationDays: number
  travelerType: string
  bestSeason: string
  /** currency symbol or short code to prefix amounts, e.g. "₹", "$", "€" */
  currency: string
  summary: string
  tags: string[]
}

export interface Itinerary {
  id: string
  createdAt: number
  updatedAt: number
  meta: TripMeta
  days: Day[]
  budget: BudgetItem[]
  packing: PackingItem[]
  tips: string[]
}

/** Small id helper — crypto.randomUUID with a graceful fallback. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function emptyStop(): Stop {
  return {
    id: uid(),
    time: '',
    title: '',
    description: '',
    category: 'sightseeing',
    durationMin: null,
    cost: null,
    tip: '',
  }
}

export function emptyDay(index: number): Day {
  return {
    id: uid(),
    title: `Day ${index + 1}`,
    summary: '',
    stops: [],
  }
}

export function packingItem(text: string): PackingItem {
  return { id: uid(), text, done: false }
}
