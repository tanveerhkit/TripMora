/**
 * "Dreaming" mode — the user hasn't picked a destination yet. They answer a few
 * questions and the AI suggests where to go. These are the clean app-facing
 * types; `parseDream` normalizes the raw model output into them.
 */

export interface DreamAnswers {
  when: string
  budget: string
  company: string // Solo / Couple / Family / Friends
  style: string // Adventure / Balanced / Relaxed / Luxury
  kids: boolean
  elderly: boolean
  visa: string
  food: string
  temperature: string
  terrain: string // Beaches / Mountains / Cities / Nature / Mix
  homeCountry: string
  notes: string
}

export interface DestinationRec {
  id: string
  name: string
  country: string
  matchReason: string
  bestSeason: string
  /** approx total per person for a typical trip, in the result's comparison currency */
  estCost: number | null
  costLevel: string // Budget / Moderate / Premium
  safety: string
  safetyLevel: string // High / Moderate / Caution
  visa: string
  currency: string // the destination's local currency
  weather: string
  internet: string
  crowdLevel: string // Low / Moderate / High
  festivals: string[]
  suggestedDays: number | null
  tags: string[]
}

export interface DreamResult {
  id: string
  createdAt: number
  /** currency used for the cross-destination cost comparison, e.g. "$" */
  currency: string
  summary: string
  destinations: DestinationRec[]
}

export function defaultDreamAnswers(): DreamAnswers {
  return {
    when: 'Flexible',
    budget: 'Mid-range',
    company: 'Solo',
    style: 'Balanced',
    kids: false,
    elderly: false,
    visa: 'Open to anywhere',
    food: 'No preference',
    temperature: 'Any',
    terrain: 'Mix',
    homeCountry: '',
    notes: '',
  }
}
