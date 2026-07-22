/**
 * Turns each budget line into an interactive choice. The AI gives a single
 * estimate per category; here we model realistic options (e.g. flight vs train)
 * as multipliers off that estimate, plus what the line covers and how to book it.
 *
 * The multipliers are heuristics — every amount is clearly an estimate — but the
 * behaviour is real: pick an option and the whole budget recalculates.
 */
import type { IconName } from '../components/ui/Icon'
import type { BudgetKind } from '../types/itinerary'

export interface BudgetOption {
  id: string
  label: string
  /** cost relative to the AI's estimate; the default option is 1.0 */
  mult: number
  note: string
}

interface KindMeta {
  icon: IconName
  covers: string
  booking: string
  defaultOption: string
  options: BudgetOption[]
}

const KINDS: Record<BudgetKind, KindMeta> = {
  transport: {
    icon: 'route',
    covers: 'Getting there and getting around — intercity travel plus local transit.',
    booking: 'Compare fares early; midweek departures are usually the cheapest.',
    defaultOption: 'train',
    options: [
      { id: 'flight', label: 'Flight', mult: 1.9, note: 'Fastest over long distances. Compare on Skyscanner or Google Flights and book 3–6 weeks ahead.' },
      { id: 'train', label: 'Train', mult: 1.0, note: 'Scenic and city-centre to city-centre. Book early for saver fares on the national rail site.' },
      { id: 'bus', label: 'Bus / Coach', mult: 0.55, note: 'The cheapest option. Overnight coaches can even save you a hotel night.' },
      { id: 'cab', label: 'Car / Cab', mult: 1.5, note: 'Door-to-door and flexible. Split with your group to bring the per-head cost down.' },
    ],
  },
  accommodation: {
    icon: 'bed',
    covers: 'Where you sleep each night, across the whole trip.',
    booking: 'Booking.com or Agoda; filter for review scores of 8+ and free cancellation.',
    defaultOption: 'midrange',
    options: [
      { id: 'hostel', label: 'Hostel', mult: 0.42, note: 'Dorms or cheap private rooms. Great for meeting people — try Hostelworld.' },
      { id: 'budget', label: 'Budget hotel', mult: 0.7, note: 'Simple private rooms with the basics covered.' },
      { id: 'midrange', label: 'Mid-range', mult: 1.0, note: 'Comfortable 3★ hotels or well-reviewed apartments.' },
      { id: 'boutique', label: 'Boutique / 4★', mult: 1.6, note: 'Design hotels and prime locations.' },
      { id: 'luxury', label: 'Luxury / 5★', mult: 2.6, note: 'Full-service resorts and top-tier stays.' },
    ],
  },
  food: {
    icon: 'food',
    covers: 'Meals, snacks and drinks for the trip.',
    booking: 'Eat where locals queue; lunch set-menus are far cheaper than dinner.',
    defaultOption: 'casual',
    options: [
      { id: 'street', label: 'Street food', mult: 0.5, note: 'Markets and stalls — cheapest and often the tastiest.' },
      { id: 'casual', label: 'Casual local', mult: 1.0, note: 'Everyday local restaurants and cafes.' },
      { id: 'mixed', label: 'Mix it up', mult: 1.5, note: 'Casual most days with a few nicer meals.' },
      { id: 'fine', label: 'Fine dining', mult: 2.4, note: 'Standout restaurants and tasting menus.' },
    ],
  },
  activities: {
    icon: 'ticket',
    covers: 'Sights, tickets, tours and experiences.',
    booking: 'GetYourGuide or Viator; buy skip-the-line tickets for the busy sights.',
    defaultOption: 'highlights',
    options: [
      { id: 'free', label: 'Free & self-guided', mult: 0.4, note: 'Parks, viewpoints and free museum days.' },
      { id: 'highlights', label: 'Key highlights', mult: 1.0, note: 'The must-see paid attractions.' },
      { id: 'guided', label: 'Guided tours', mult: 1.6, note: 'Day tours and hosted experiences.' },
      { id: 'premium', label: 'Premium / private', mult: 2.4, note: 'Private guides and special experiences.' },
    ],
  },
  shopping: {
    icon: 'bag',
    covers: 'Souvenirs, gifts and any shopping.',
    booking: 'Set a limit up front; check duty-free allowances before you buy.',
    defaultOption: 'some',
    options: [
      { id: 'minimal', label: 'Minimal', mult: 0.35, note: 'A few small souvenirs.' },
      { id: 'some', label: 'Some shopping', mult: 1.0, note: 'Gifts and a couple of keepsakes.' },
      { id: 'splurge', label: 'Splurge', mult: 1.9, note: 'Room in the budget for bigger buys.' },
    ],
  },
  misc: {
    icon: 'wallet',
    covers: 'SIM, tips, local transport top-ups, insurance and a safety buffer.',
    booking: 'Keep a small emergency buffer — roughly 10% of the trip cost.',
    defaultOption: 'standard',
    options: [
      { id: 'lean', label: 'Lean', mult: 0.6, note: 'Bare essentials only.' },
      { id: 'standard', label: 'Standard', mult: 1.0, note: 'Comfortable buffer for the odds and ends.' },
      { id: 'comfortable', label: 'Comfortable', mult: 1.6, note: 'Extra room so nothing is a surprise.' },
    ],
  },
}

const CLASSIFY: Array<[RegExp, BudgetKind]> = [
  [/flight|transport|travel|transfer|train|bus|taxi|cab|fuel|metro|commute|getting around|car\b/i, 'transport'],
  [/hotel|accommodation|stay|lodging|hostel|airbnb|room|resort|night/i, 'accommodation'],
  [/food|meal|dining|eat|restaurant|drink|cafe|cuisine/i, 'food'],
  [/activit|tour|attraction|experience|ticket|entrance|sightsee|excursion|entry/i, 'activities'],
  [/shop|souvenir|gift/i, 'shopping'],
]

export function classifyBudget(label: string): BudgetKind {
  for (const [re, kind] of CLASSIFY) {
    if (re.test(label)) return kind
  }
  return 'misc'
}

export function kindMeta(kind: BudgetKind): KindMeta {
  return KINDS[kind]
}

export function optionsFor(kind: BudgetKind): BudgetOption[] {
  return KINDS[kind].options
}

export function defaultOptionId(kind: BudgetKind): string {
  return KINDS[kind].defaultOption
}

export function getOption(kind: BudgetKind, id: string): BudgetOption | undefined {
  return KINDS[kind].options.find((o) => o.id === id)
}
