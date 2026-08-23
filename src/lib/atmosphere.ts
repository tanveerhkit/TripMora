export type AtmosphereId =
  | 'explore'
  | 'mountain'
  | 'rain'
  | 'forest'
  | 'tropical'
  | 'desert'
  | 'city'

export interface AtmosphereInput {
  atmosphere?: AtmosphereId
  destination?: string
  country?: string
  summary?: string
  bestSeason?: string
  when?: string
  weather?: string
  terrain?: string
  temperature?: string
  tags?: string[]
  style?: string
}

export interface AtmosphereTheme {
  id: AtmosphereId
  label: string
  description: string
}

export const ATMOSPHERES: Record<AtmosphereId, AtmosphereTheme> = {
  explore: {
    id: 'explore',
    label: 'Open road',
    description: 'A luminous planning space for wherever you want to go next.',
  },
  mountain: {
    id: 'mountain',
    label: 'Alpine air',
    description: 'Icy light, quiet altitude, and crisp mountain mornings.',
  },
  rain: {
    id: 'rain',
    label: 'After the rain',
    description: 'Cool blue light, soft mist, and a city reflected in the street.',
  },
  forest: {
    id: 'forest',
    label: 'Wild & green',
    description: 'Layered greens, warm earth, and a slower path through nature.',
  },
  tropical: {
    id: 'tropical',
    label: 'Tidal warmth',
    description: 'Turquoise water, sun-washed sand, and an easy island rhythm.',
  },
  desert: {
    id: 'desert',
    label: 'Golden hour',
    description: 'Copper light, long shadows, and the quiet scale of the desert.',
  },
  city: {
    id: 'city',
    label: 'City lights',
    description: 'Midnight glass, electric accents, and a plan with momentum.',
  },
}

const MATCHERS: Array<[AtmosphereId, RegExp]> = [
  [
    'rain',
    /rain|rainy|monsoon|drizzle|mist|misty|storm|showers|wet|cloudy|overcast|humid|seattle|london|vancouver|reykjavik|coorg/i,
  ],
  [
    'mountain',
    /mountain|alpine|himalaya|himalayan|snow|snowy|winter|glacier|ski|altitude|valley|peak|highland|everest|kashmir|ladakh|bhutan|swiss alps|patagonia/i,
  ],
  [
    'tropical',
    /beach|tropical|island|palm|coast|coastal|lagoon|reef|sea|ocean|sunset|bali|kerala|goa|maldives|hawaii|phuket|seychelles|caribbean/i,
  ],
  [
    'forest',
    /forest|jungle|nature|green|woodland|bamboo|tea garden|tea hill|rainforest|waterfall|lake|garden|hiking|trail|safari|kyoto|shimla|ooty|darjeeling/i,
  ],
  [
    'desert',
    /desert|dune|sand|sahara|oasis|medina|souks|marrakech|morocco|dubai|abu dhabi|rajasthan|jaisalmer|wadi/i,
  ],
  [
    'city',
    /city|urban|skyline|nightlife|neon|rooftop|shopping|modern|metropolitan|tokyo|new york|singapore|hong kong|paris|seoul|l.a.|los angeles/i,
  ],
]

export function getAtmosphere(input: AtmosphereInput | string | null | undefined): AtmosphereTheme {
  if (!input) return ATMOSPHERES.explore
  if (typeof input !== 'string' && input.atmosphere && input.atmosphere in ATMOSPHERES) {
    return ATMOSPHERES[input.atmosphere]
  }

  const text =
    typeof input === 'string'
      ? input
      : [
          input.destination,
          input.country,
          input.summary,
          input.bestSeason,
          input.when,
          input.weather,
          input.terrain,
          input.temperature,
          input.style,
          ...(input.tags ?? []),
        ]
          .filter(Boolean)
          .join(' ')

  for (const [id, matcher] of MATCHERS) {
    if (matcher.test(text)) return ATMOSPHERES[id]
  }

  return ATMOSPHERES.explore
}
