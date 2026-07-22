/**
 * Turns whatever the model returned (a string that is *supposed* to be JSON)
 * into a clean, validated `Itinerary` — or a typed failure the UI can act on.
 *
 * The philosophy: be strict about *structure* (we need a days array) but
 * forgiving about *details* (a weird category, a cost written as "₹500", a stop
 * called `name` instead of `title`). One malformed field must never throw away
 * the whole trip.
 */
import { z } from 'zod'
import {
  STOP_CATEGORIES,
  packingItem,
  uid,
  type BudgetItem,
  type Day,
  type Itinerary,
  type PackingItem,
  type Stop,
  type StopCategory,
  type TripMeta,
} from '../types/itinerary'
import {
  asArr,
  asObj,
  clamp,
  extractJson,
  firstStr,
  normalizeStringList,
  num,
  str,
  titleCase,
} from './safe'

export { extractJson }

export type ParseFailureKind = 'json' | 'shape' | 'empty'

export type ParseResult =
  | { ok: true; itinerary: Itinerary }
  | { ok: false; kind: ParseFailureKind; message: string }

/* ------------------------------------------------------------------ *
 * Structural gate — the one thing we truly require: a days array.
 * ------------------------------------------------------------------ */
const rootSchema = z
  .object({
    days: z.array(z.unknown()).min(1, 'The itinerary has no days.'),
  })
  .passthrough()

/* ------------------------------------------------------------------ *
 * Category mapping — models invent their own category words; snap them
 * to our known set by keyword instead of rejecting the stop.
 * ------------------------------------------------------------------ */
const CATEGORY_KEYWORDS: Array<[RegExp, StopCategory]> = [
  [/food|restaurant|dining|cafe|coffee|breakfast|lunch|dinner|meal|eat|cuisine|snack|brunch/, 'food'],
  [/nature|park|beach|hike|hiking|mountain|trail|garden|lake|waterfall|forest|island|outdoor/, 'nature'],
  [/museum|temple|church|mosque|shrine|history|historic|heritage|art|gallery|culture|monument|palace|castle/, 'culture'],
  [/spa|relax|rest|wellness|massage|chill|leisure|pool|hotel|check.?in/, 'relax'],
  [/night|bar|club|pub|cocktail|party|live music/, 'nightlife'],
  [/shop|market|mall|bazaar|souvenir|boutique|store/, 'shopping'],
  [/transport|transfer|flight|airport|train|bus|drive|taxi|metro|ferry|cruise|travel|commute/, 'transport'],
  [/adventure|activity|tour|experience|sport|dive|surf|kayak|zip|safari|trek|climb|ride/, 'adventure'],
  [/sightsee|landmark|viewpoint|attraction|square|tower|bridge|observ|scenic/, 'sightseeing'],
]

function toCategory(raw: unknown, titleHint: string): StopCategory {
  const value = str(raw).toLowerCase()
  if ((STOP_CATEGORIES as readonly string[]).includes(value)) {
    return value as StopCategory
  }
  const haystack = `${value} ${titleHint}`.toLowerCase()
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(haystack)) return cat
  }
  return 'sightseeing'
}

/* ------------------------------------------------------------------ *
 * Field-level normalizers.
 * ------------------------------------------------------------------ */
function normalizeStop(raw: unknown): Stop | null {
  const o = asObj(raw)
  const title = firstStr(o.title, o.name, o.place, o.activity, o.stop, o.location)
  if (!title) return null // a stop with nothing to show is dropped, not fatal

  return {
    id: uid(),
    time: firstStr(o.time, o.startTime, o.start, o.when),
    title: clamp(title, 140),
    description: clamp(firstStr(o.description, o.details, o.desc, o.info), 600),
    category: toCategory(o.category ?? o.type ?? o.kind, title),
    durationMin: num(o.durationMin ?? o.duration ?? o.durationMinutes ?? o.minutes),
    cost: num(o.cost ?? o.costEstimate ?? o.price ?? o.estimatedCost ?? o.budget),
    tip: clamp(firstStr(o.tip, o.tips, o.note, o.advice, o.proTip), 400),
  }
}

function normalizeDay(raw: unknown, index: number): Day {
  const o = asObj(raw)
  const stops = asArr(o.stops ?? o.activities ?? o.items ?? o.plan ?? o.schedule)
    .map(normalizeStop)
    .filter((s): s is Stop => s !== null)

  const dayNo = num(o.day) ?? index + 1
  const title = firstStr(o.title, o.theme, o.name) || `Day ${dayNo}`

  return {
    id: uid(),
    title: clamp(title, 120),
    summary: clamp(firstStr(o.summary, o.description, o.overview), 400),
    stops,
  }
}

function normalizeBudget(raw: unknown): BudgetItem[] {
  const container = asObj(raw)
  const arr = Array.isArray(raw)
    ? raw
    : asArr(container.items ?? container.breakdown ?? container.categories)

  let items: BudgetItem[] = arr
    .map((it) => {
      const o = asObj(it)
      const label = firstStr(o.label, o.category, o.name, o.item)
      const amount = num(o.amount ?? o.cost ?? o.value ?? o.price)
      return label && amount !== null ? { label: clamp(label, 40), amount } : null
    })
    .filter((b): b is BudgetItem => b !== null)

  // Fallback: a flat map like { flights: 500, hotel: 300 }.
  if (items.length === 0 && raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const skip = new Set(['total', 'currency', 'items', 'breakdown', 'categories', 'notes'])
    items = Object.entries(container)
      .map(([k, v]) => {
        const amount = num(v)
        return !skip.has(k.toLowerCase()) && amount !== null
          ? { label: titleCase(k), amount }
          : null
      })
      .filter((b): b is BudgetItem => b !== null)
  }

  return items.slice(0, 24)
}

function normalizePacking(raw: unknown): PackingItem[] {
  return normalizeStringList(raw, 40).map((text) => packingItem(text))
}

function normalizeMeta(root: Record<string, unknown>, dayCount: number): TripMeta {
  const meta = asObj(root.meta ?? root.trip ?? root.overview)
  const currency = firstStr(meta.currency, root.currency) || '$'

  return {
    destination:
      firstStr(meta.destination, root.destination, meta.location, root.location, meta.title) ||
      'Your trip',
    durationDays: num(meta.durationDays ?? root.durationDays ?? meta.days) ?? dayCount,
    travelerType: firstStr(meta.travelerType, root.travelerType, meta.type, meta.style),
    bestSeason: firstStr(meta.bestSeason, root.bestSeason, meta.season),
    currency: currency.length > 4 ? currency.slice(0, 4) : currency,
    summary: clamp(firstStr(meta.summary, root.summary, meta.description), 400),
    tags: normalizeStringList(meta.tags ?? root.tags ?? meta.interests, 12),
  }
}

/* ------------------------------------------------------------------ *
 * The public entry point.
 * ------------------------------------------------------------------ */
export function parseItinerary(text: string): ParseResult {
  if (!text || !text.trim()) {
    return { ok: false, kind: 'empty', message: 'The AI returned an empty response.' }
  }

  let data: unknown
  try {
    data = JSON.parse(extractJson(text))
  } catch {
    return {
      ok: false,
      kind: 'json',
      message: "The AI's response was not valid JSON. Try again.",
    }
  }

  const gate = rootSchema.safeParse(data)
  if (!gate.success) {
    return {
      ok: false,
      kind: 'shape',
      message: "The AI's response didn't include a usable day-by-day plan.",
    }
  }

  const root = gate.data as Record<string, unknown>
  const days = asArr(root.days)
    .map((d, i) => normalizeDay(d, i))
    .filter((d) => d.stops.length > 0 || d.title)

  if (days.length === 0) {
    return {
      ok: false,
      kind: 'empty',
      message: 'The plan came back without any stops. Try rephrasing your trip.',
    }
  }

  const now = Date.now()
  const itinerary: Itinerary = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    meta: normalizeMeta(root, days.length),
    days,
    budget: normalizeBudget(root.budget ?? root.costs ?? root.estimatedBudget),
    packing: normalizePacking(root.packing ?? root.packingList ?? root.pack),
    tips: normalizeStringList(root.tips ?? root.notes ?? root.advice ?? root.safety, 12),
  }

  return { ok: true, itinerary }
}
