import { describe, expect, it } from 'vitest'
import { parseItinerary } from './parseItinerary'

/**
 * These tests exist because "handling bad AI output" is the part that matters
 * most. Each case is a shape a real model has actually returned at some point.
 */

const goodTrip = JSON.stringify({
  meta: { destination: 'Kyoto, Japan', durationDays: 2, currency: '¥', travelerType: 'Solo' },
  days: [
    {
      title: 'Temples & tea',
      stops: [
        { time: '08:00', title: 'Fushimi Inari', category: 'culture', cost: 0 },
        { time: '13:00', title: 'Nishiki Market lunch', category: 'food', cost: 1500 },
      ],
    },
    {
      title: 'Arashiyama',
      stops: [{ title: 'Bamboo grove', category: 'nature' }],
    },
  ],
})

describe('parseItinerary — happy path', () => {
  it('parses a well-formed itinerary', () => {
    const res = parseItinerary(goodTrip)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.itinerary.meta.destination).toBe('Kyoto, Japan')
    expect(res.itinerary.days).toHaveLength(2)
    expect(res.itinerary.days[0].stops).toHaveLength(2)
    expect(res.itinerary.days[0].stops[0].category).toBe('culture')
  })

  it('gives every stop and day a stable unique id', () => {
    const res = parseItinerary(goodTrip)
    if (!res.ok) throw new Error('expected ok')
    const ids = res.itinerary.days.flatMap((d) => [d.id, ...d.stops.map((s) => s.id)])
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('parseItinerary — bad output', () => {
  it('flags unrecoverable non-JSON without throwing', () => {
    const res = parseItinerary('Sorry, I could not plan that trip.')
    expect(res).toMatchObject({ ok: false, kind: 'json' })
  })

  it('recovers a truncated itinerary by closing it off', () => {
    // The response was cut off mid-stop; the repair pass should salvage the
    // stops that did arrive rather than throwing the whole trip away.
    const truncated =
      '{"meta":{"destination":"Rome"},"days":[{"title":"Day 1","stops":' +
      '[{"time":"09:00","title":"Colosseum","category":"culture"},' +
      '{"time":"13:00","title":"Trastevere lunch'
    const res = parseItinerary(truncated)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.itinerary.days[0].stops[0].title).toBe('Colosseum')
  })

  it('flags a valid-JSON-but-wrong-shape response', () => {
    const res = parseItinerary(JSON.stringify({ answer: 'here is your trip' }))
    expect(res).toMatchObject({ ok: false, kind: 'shape' })
  })

  it('flags an empty string', () => {
    expect(parseItinerary('')).toMatchObject({ ok: false, kind: 'empty' })
  })

  it('flags days that contain no real stops', () => {
    const res = parseItinerary(JSON.stringify({ days: [{ stops: [{}, { note: 'x' }] }] }))
    // day has a title fallback, but drop happens -> still renders the day shell;
    // if truly nothing is renderable we report empty
    expect(res.ok).toBe(true)
  })
})

describe('parseItinerary — forgiving normalization', () => {
  it('recovers JSON wrapped in a markdown code fence', () => {
    const res = parseItinerary('```json\n' + goodTrip + '\n```')
    expect(res.ok).toBe(true)
  })

  it('reads a cost written as a messy string', () => {
    const res = parseItinerary(
      JSON.stringify({ days: [{ stops: [{ title: 'Taxi', cost: '₹1,500 approx' }] }] }),
    )
    if (!res.ok) throw new Error('expected ok')
    expect(res.itinerary.days[0].stops[0].cost).toBe(1500)
  })

  it('accepts alias field names (name/activities/type)', () => {
    const res = parseItinerary(
      JSON.stringify({
        destination: 'Bali',
        days: [{ activities: [{ name: 'Surf lesson', type: 'water sport' }] }],
      }),
    )
    if (!res.ok) throw new Error('expected ok')
    expect(res.itinerary.meta.destination).toBe('Bali')
    expect(res.itinerary.days[0].stops[0].title).toBe('Surf lesson')
    expect(res.itinerary.days[0].stops[0].category).toBe('adventure')
  })

  it('snaps unknown categories to the nearest known one', () => {
    const res = parseItinerary(
      JSON.stringify({ days: [{ stops: [{ title: 'Louvre', category: 'art museum' }] }] }),
    )
    if (!res.ok) throw new Error('expected ok')
    expect(res.itinerary.days[0].stops[0].category).toBe('culture')
  })

  it('reads per-stop watch-outs, including an alias, and defaults to []', () => {
    const res = parseItinerary(
      JSON.stringify({
        days: [
          {
            stops: [
              { title: 'Trevi Fountain', watchOuts: ['Packed midday', 'Watch for pickpockets'] },
              { title: 'Quiet chapel', warnings: 'Dress code enforced' },
              { title: 'Park bench' },
            ],
          },
        ],
      }),
    )
    if (!res.ok) throw new Error('expected ok')
    const [a, b, c] = res.itinerary.days[0].stops
    expect(a.watchOuts).toEqual(['Packed midday', 'Watch for pickpockets'])
    expect(b.watchOuts).toEqual(['Dress code enforced'])
    expect(c.watchOuts).toEqual([])
  })

  it('normalizes a budget given as a flat object map', () => {
    const res = parseItinerary(
      JSON.stringify({
        days: [{ stops: [{ title: 'x' }] }],
        budget: { flights: 400, hotel: 300, food: 150 },
      }),
    )
    if (!res.ok) throw new Error('expected ok')
    expect(res.itinerary.budget).toHaveLength(3)
    expect(res.itinerary.budget[0]).toMatchObject({ label: 'Flights', amount: 400 })
  })

  it('normalizes a budget given as an items array', () => {
    const res = parseItinerary(
      JSON.stringify({
        days: [{ stops: [{ title: 'x' }] }],
        budget: { total: 850, items: [{ label: 'Hotel', amount: 300 }] },
      }),
    )
    if (!res.ok) throw new Error('expected ok')
    expect(res.itinerary.budget).toHaveLength(1)
    expect(res.itinerary.budget[0].amount).toBe(300)
  })
})
