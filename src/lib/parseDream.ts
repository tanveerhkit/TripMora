/**
 * Parse + normalize the model's "where should I go" output for Dreaming mode.
 * Same philosophy as parseItinerary: strict about structure (a destinations
 * array), forgiving about every field.
 */
import { z } from 'zod'
import { uid } from '../types/itinerary'
import type { DestinationRec, DreamResult } from '../types/dream'
import {
  asArr,
  asObj,
  clamp,
  extractJson,
  firstStr,
  normalizeStringList,
  num,
  str,
} from './safe'

export type DreamFailureKind = 'json' | 'shape' | 'empty'

export type DreamParseResult =
  | { ok: true; result: DreamResult }
  | { ok: false; kind: DreamFailureKind; message: string }

const rootSchema = z
  .object({
    destinations: z.array(z.unknown()).min(1, 'No destinations were suggested.'),
  })
  .passthrough()

function normalizeDestination(raw: unknown): DestinationRec | null {
  const o = asObj(raw)
  const name = firstStr(o.name, o.city, o.destination, o.place, o.title)
  const country = firstStr(o.country, o.nation)
  if (!name && !country) return null // nothing to label the card with

  return {
    id: uid(),
    name: clamp(name || country, 80),
    country: clamp(country, 60),
    matchReason: clamp(firstStr(o.matchReason, o.reason, o.why, o.description, o.summary), 400),
    bestSeason: clamp(firstStr(o.bestSeason, o.season, o.bestTime), 60),
    estCost: num(o.estCost ?? o.cost ?? o.estimatedCost ?? o.budget ?? o.price),
    costLevel: clamp(firstStr(o.costLevel, o.priceLevel, o.affordability), 24),
    safety: clamp(firstStr(o.safety, o.safetyNote), 160),
    safetyLevel: clamp(firstStr(o.safetyLevel, o.safetyRating), 24),
    visa: clamp(firstStr(o.visa, o.visaRequirement, o.visaRequirements, o.visaInfo), 120),
    currency: clamp(firstStr(o.currency, o.localCurrency), 24),
    weather: clamp(firstStr(o.weather, o.climate, o.temperature), 120),
    internet: clamp(firstStr(o.internet, o.internetSpeed, o.wifi, o.connectivity), 40),
    crowdLevel: clamp(firstStr(o.crowdLevel, o.crowd, o.crowdPrediction), 24),
    festivals: normalizeStringList(o.festivals ?? o.events ?? o.festival, 6),
    suggestedDays: num(o.suggestedDays ?? o.days ?? o.duration ?? o.recommendedDays),
    tags: normalizeStringList(o.tags ?? o.highlights ?? o.interests, 8),
  }
}

export function parseDream(text: string): DreamParseResult {
  if (!text || !text.trim()) {
    return { ok: false, kind: 'empty', message: 'The AI returned an empty response.' }
  }

  let data: unknown
  try {
    data = JSON.parse(extractJson(text))
  } catch {
    return { ok: false, kind: 'json', message: "The AI's response wasn't valid JSON. Try again." }
  }

  const gate = rootSchema.safeParse(data)
  if (!gate.success) {
    return {
      ok: false,
      kind: 'shape',
      message: "The AI's response didn't include any destination ideas.",
    }
  }

  const root = gate.data as Record<string, unknown>
  const destinations = asArr(root.destinations)
    .map(normalizeDestination)
    .filter((d): d is DestinationRec => d !== null)

  if (destinations.length === 0) {
    return { ok: false, kind: 'empty', message: 'No usable destinations came back. Try again.' }
  }

  const result: DreamResult = {
    id: uid(),
    createdAt: Date.now(),
    currency: firstStr(root.currency, '$') || '$',
    summary: clamp(firstStr(root.summary, root.overview, root.intro), 400),
    destinations,
  }

  return { ok: true, result }
}
