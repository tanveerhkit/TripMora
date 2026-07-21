import type { StopCategory } from '../types/itinerary'
import type { IconName } from '../components/ui/Icon'

interface CategoryMeta {
  label: string
  icon: IconName
  /** CSS custom property that holds the accent colour for this category. */
  colorVar: string
}

export const CATEGORY_META: Record<StopCategory, CategoryMeta> = {
  sightseeing: { label: 'Sightseeing', icon: 'landmark', colorVar: '--cat-sightseeing' },
  food: { label: 'Food', icon: 'food', colorVar: '--cat-food' },
  nature: { label: 'Nature', icon: 'leaf', colorVar: '--cat-nature' },
  culture: { label: 'Culture', icon: 'museum', colorVar: '--cat-culture' },
  relax: { label: 'Relax', icon: 'spa', colorVar: '--cat-relax' },
  nightlife: { label: 'Nightlife', icon: 'moon', colorVar: '--cat-nightlife' },
  shopping: { label: 'Shopping', icon: 'bag', colorVar: '--cat-shopping' },
  transport: { label: 'Transport', icon: 'route', colorVar: '--cat-transport' },
  adventure: { label: 'Adventure', icon: 'compass', colorVar: '--cat-adventure' },
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value: value as StopCategory,
  ...meta,
}))
