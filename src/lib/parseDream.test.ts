import { describe, expect, it } from 'vitest'
import { parseDream } from './parseDream'

const good = JSON.stringify({
  summary: 'Three warm, budget-friendly picks for a solo foodie.',
  currency: '$',
  destinations: [
    {
      name: 'Chiang Mai',
      country: 'Thailand',
      matchReason: 'Cheap, safe and a street-food paradise.',
      bestSeason: 'Nov–Feb',
      estCost: 700,
      costLevel: 'Budget',
      safetyLevel: 'High',
      visa: 'Visa-free for many passports',
      currency: 'THB',
      weather: 'Warm and dry',
      internet: 'Fast',
      crowdLevel: 'Moderate',
      festivals: ['Yi Peng lantern festival'],
      suggestedDays: 5,
    },
    { name: 'Lisbon', country: 'Portugal', estCost: '1,200 approx' },
  ],
})

describe('parseDream', () => {
  it('parses well-formed destination ideas', () => {
    const res = parseDream(good)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.result.destinations).toHaveLength(2)
    expect(res.result.destinations[0].name).toBe('Chiang Mai')
    expect(res.result.destinations[0].festivals).toEqual(['Yi Peng lantern festival'])
  })

  it('reads a stringy cost', () => {
    const res = parseDream(good)
    if (!res.ok) throw new Error('expected ok')
    expect(res.result.destinations[1].estCost).toBe(1200)
  })

  it('flags malformed JSON', () => {
    expect(parseDream('{ nope')).toMatchObject({ ok: false, kind: 'json' })
  })

  it('flags wrong shape', () => {
    expect(parseDream(JSON.stringify({ hello: 'world' }))).toMatchObject({
      ok: false,
      kind: 'shape',
    })
  })

  it('flags empty input', () => {
    expect(parseDream('')).toMatchObject({ ok: false, kind: 'empty' })
  })

  it('recovers JSON wrapped in a code fence and alias fields', () => {
    const res = parseDream('```json\n' + JSON.stringify({
      destinations: [{ city: 'Bali', nation: 'Indonesia', reason: 'Beaches + budget' }],
    }) + '\n```')
    if (!res.ok) throw new Error('expected ok')
    expect(res.result.destinations[0].name).toBe('Bali')
    expect(res.result.destinations[0].country).toBe('Indonesia')
    expect(res.result.destinations[0].matchReason).toBe('Beaches + budget')
  })
})
