/**
 * Defensive accessors for turning unknown model JSON into safe values.
 * Shared by both the itinerary and the dream-mode parsers — none of these throw.
 */

export function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

export function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

export function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return fallback
}

/** First non-empty string among the candidates. */
export function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    const s = str(v)
    if (s) return s
  }
  return ''
}

/** Pull a finite number out of a number or a messy string ("₹1,500 approx"). */
export function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const match = v.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
    if (match) {
      const n = parseFloat(match[0])
      return Number.isFinite(n) ? n : null
    }
  }
  return null
}

export function clamp(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

export function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Extract a JSON object from model text that may be wrapped in prose or code
 * fences, even when JSON mode was requested.
 */
export function extractJson(text: string): string {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()

  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1)
  }
  return t
}

export function normalizeStringList(raw: unknown, max: number): string[] {
  return asArr(raw)
    .map((v) => {
      if (typeof v === 'string') return v.trim()
      const o = asObj(v)
      return firstStr(o.item, o.name, o.label, o.text, o.tip)
    })
    .filter((s) => s.length > 0)
    .map((s) => clamp(s, 160))
    .slice(0, max)
}
