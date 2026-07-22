import { describe, expect, it } from 'vitest'
import { parseItinerary } from './parseItinerary'
import {
  addStop,
  arrayMove,
  deleteStop,
  mergeRefined,
  reorderDays,
  reorderStops,
  setBudgetOption,
  togglePacking,
  updateStop,
} from './itineraryOps'
import type { Itinerary } from '../types/itinerary'

function sample(): Itinerary {
  const res = parseItinerary(
    JSON.stringify({
      meta: { destination: 'Porto', currency: '€' },
      days: [
        {
          title: 'Day one',
          stops: [
            { title: 'A', category: 'food' },
            { title: 'B', category: 'nature' },
            { title: 'C', category: 'culture' },
          ],
        },
        { title: 'Day two', stops: [{ title: 'D' }] },
      ],
      packing: ['Shoes', 'Charger'],
    }),
  )
  if (!res.ok) throw new Error('sample failed to parse')
  return res.itinerary
}

describe('itineraryOps', () => {
  it('arrayMove moves an item without mutating the source', () => {
    const src = [1, 2, 3, 4]
    expect(arrayMove(src, 0, 2)).toEqual([2, 3, 1, 4])
    expect(src).toEqual([1, 2, 3, 4])
  })

  it('reorders stops within a day', () => {
    const it = sample()
    const dayId = it.days[0].id
    const next = reorderStops(it, dayId, 0, 2)
    expect(next.days[0].stops.map((s) => s.title)).toEqual(['B', 'C', 'A'])
    // original untouched (immutability)
    expect(it.days[0].stops.map((s) => s.title)).toEqual(['A', 'B', 'C'])
  })

  it('updates a single stop', () => {
    const it = sample()
    const { id: dayId } = it.days[0]
    const { id: stopId } = it.days[0].stops[1]
    const next = updateStop(it, dayId, stopId, { title: 'Bravo', cost: 42 })
    expect(next.days[0].stops[1].title).toBe('Bravo')
    expect(next.days[0].stops[1].cost).toBe(42)
  })

  it('deletes a stop', () => {
    const it = sample()
    const dayId = it.days[0].id
    const stopId = it.days[0].stops[0].id
    const next = deleteStop(it, dayId, stopId)
    expect(next.days[0].stops.map((s) => s.title)).toEqual(['B', 'C'])
  })

  it('adds an empty stop and returns its id', () => {
    const it = sample()
    const dayId = it.days[0].id
    const { itinerary, newStopId } = addStop(it, dayId)
    expect(itinerary.days[0].stops).toHaveLength(4)
    expect(itinerary.days[0].stops.at(-1)?.id).toBe(newStopId)
  })

  it('reorders days', () => {
    const it = sample()
    const next = reorderDays(it, 0, 1)
    expect(next.days.map((d) => d.title)).toEqual(['Day two', 'Day one'])
  })

  it('toggles a packing item', () => {
    const it = sample()
    const id = it.packing[0].id
    const next = togglePacking(it, id)
    expect(next.packing[0].done).toBe(true)
  })

  it('classifies budget lines and recalculates when an option is chosen', () => {
    const parsed = parseItinerary(
      JSON.stringify({
        days: [{ stops: [{ title: 'x' }] }],
        budget: { items: [{ label: 'Transportation', amount: 4000 }] },
      }),
    )
    if (!parsed.ok) throw new Error('expected ok')
    const it = parsed.itinerary
    // default option is "train" (1.0x) so amount stays at the AI estimate
    expect(it.budget[0].kind).toBe('transport')
    expect(it.budget[0].baseAmount).toBe(4000)
    expect(it.budget[0].amount).toBe(4000)

    const flight = setBudgetOption(it, 0, 'flight')
    expect(flight.budget[0].option).toBe('flight')
    expect(flight.budget[0].amount).toBe(7600) // 4000 * 1.9

    const bus = setBudgetOption(it, 0, 'bus')
    expect(bus.budget[0].amount).toBe(2200) // 4000 * 0.55
  })

  it('mergeRefined keeps id/createdAt and preserves checked packing', () => {
    const prev = sample()
    const withChecked = togglePacking(prev, prev.packing[0].id) // "Shoes" done
    const refined = sample() // fresh (different ids), same packing text
    const merged = mergeRefined(withChecked, refined)

    expect(merged.id).toBe(prev.id)
    expect(merged.createdAt).toBe(prev.createdAt)
    const shoes = merged.packing.find((p) => p.text === 'Shoes')
    expect(shoes?.done).toBe(true)
  })
})
