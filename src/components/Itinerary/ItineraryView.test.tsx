import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { parseItinerary } from '../../lib/parseItinerary'
import { ItineraryView } from './ItineraryView'

afterEach(cleanup)

const SAMPLE = JSON.stringify({
  meta: { destination: 'Lisbon, Portugal', durationDays: 2, currency: '€', travelerType: 'Backpacker' },
  days: [
    {
      title: 'Alfama & viewpoints',
      summary: 'Old town wander',
      stops: [
        { time: '09:00', title: 'Miradouro de Santa Luzia', category: 'sightseeing', cost: 0, tip: 'Go early for calm light.' },
        { time: '13:00', title: 'Time Out Market', category: 'food', cost: 15 },
      ],
    },
    { title: 'Belém', stops: [{ title: 'Jerónimos Monastery', category: 'culture', cost: 12 }] },
  ],
  budget: { items: [{ label: 'Food', amount: 60 }, { label: 'Transport', amount: 20 }] },
  packing: ['Comfortable shoes', 'Power adapter'],
  tips: ['Trams get crowded — ride early.'],
})

describe('ItineraryView', () => {
  it('renders the parsed itinerary end to end', () => {
    const parsed = parseItinerary(SAMPLE)
    if (!parsed.ok) throw new Error('sample should parse')

    render(
      <ItineraryView
        itinerary={parsed.itinerary}
        mutate={() => {}}
        onRefine={() => {}}
        onRecover={() => {}}
        refining={false}
        recovering={false}
      />,
    )

    // overview
    expect(screen.getByText('Lisbon, Portugal')).toBeTruthy()
    // day + stop content
    expect(screen.getByText('Alfama & viewpoints')).toBeTruthy()
    expect(screen.getByText('Miradouro de Santa Luzia')).toBeTruthy()
    // blocks
    expect(screen.getByText('Estimated budget')).toBeTruthy()
    expect(screen.getByText('Comfortable shoes')).toBeTruthy()
    expect(screen.getByText(/Trams get crowded/)).toBeTruthy()
  })
})
