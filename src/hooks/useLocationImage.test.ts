import { describe, expect, it } from 'vitest'
import { isRelevant } from './useLocationImage'

// The relevance guard is what stops an itinerary stop from showing a wrong
// photo (a Hanoi walking tour must not render a Heathrow Airport image).
describe('isRelevant', () => {
  const ctx = 'Hanoi'

  it('accepts a page that matches the stop name', () => {
    expect(isRelevant('Ho Chi Minh Mausoleum', 'Ho Chi Minh Mausoleum', ctx)).toBe(true)
    expect(isRelevant('Temple of Literature, Hanoi', 'Temple of Literature', ctx)).toBe(true)
    expect(isRelevant('Nishiki Market', 'Nishiki Market', 'Kyoto')).toBe(true)
  })

  it('matches across diacritics', () => {
    expect(isRelevant('Hoàn Kiếm Lake', 'Hoan Kiem Lake', ctx)).toBe(true)
  })

  it('rejects an unrelated best-guess result', () => {
    expect(isRelevant('Heathrow Airport', 'Old Quarter Walking Tour', ctx)).toBe(false)
    expect(isRelevant('Pho', 'Lunch at a local eatery', ctx)).toBe(false)
    expect(
      isRelevant('Bangkok Marriott Hotel', 'Dinner at a rooftop bar', 'Bangkok'),
    ).toBe(false)
  })

  it('rejects a match that is only the destination name', () => {
    // page "Bangkok" for a Bangkok stop — no specific overlap beyond the city
    expect(isRelevant('Bangkok', 'Dinner at a rooftop bar', 'Bangkok')).toBe(false)
  })
})
