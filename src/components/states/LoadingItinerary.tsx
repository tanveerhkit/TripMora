import { TravelerLoader } from './TravelerLoader'

interface Props {
  mode: 'generate' | 'refine' | null
}

export function LoadingItinerary({ mode }: Props) {
  return (
    <TravelerLoader
      message={mode === 'refine' ? 'Updating your itinerary…' : 'Planning your trip…'}
    />
  )
}
