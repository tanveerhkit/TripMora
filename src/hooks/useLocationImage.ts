/**
 * Fetches a representative photo for a place name from Wikipedia's public API.
 * Free, no API key, and CORS-enabled — the browser calls it directly, so there
 * is nothing to route through the backend. Results (including "no image") are
 * cached in memory so a place is only ever looked up once per session.
 *
 * Optional relevance guard: for ambiguous queries (itinerary stops like "Old
 * Quarter Walking Tour") the best search hit can be unrelated (Heathrow Airport).
 * Pass `matchTerm` (+ `context` to ignore the destination name) and the image is
 * only used when the matched page title actually overlaps the term.
 */
import { useEffect, useState } from 'react'

type ImageStatus = 'idle' | 'loading' | 'loaded' | 'none' | 'error'

interface ImageState {
  status: ImageStatus
  url: string | null
}

interface Hit {
  url: string | null
  title: string | null
}

interface Options {
  /** the thing the image should actually depict, e.g. a stop title */
  matchTerm?: string
  /** words to ignore when matching (usually the destination) */
  context?: string
  /** requested thumbnail width in px (Wikipedia pithumbsize); default 800.
      hero backgrounds ask for a larger size so they stay crisp full-bleed. */
  size?: number
}

const DEFAULT_SIZE = 800

const cache = new Map<string, Hit>()
const inflight = new Map<string, Promise<Hit>>()

const STOPWORDS = new Set(['the', 'of', 'at', 'a', 'an', 'in', 'and', 'de', 'la', 'le', 'to'])

function tokenize(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Does the matched page title genuinely correspond to the term we searched? */
export function isRelevant(pageTitle: string, term: string, context: string): boolean {
  const ctx = new Set(tokenize(context))
  const termTokens = new Set(tokenize(term))
  const pageTokens = tokenize(pageTitle).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t) && !ctx.has(t),
  )
  if (pageTokens.length === 0) return false
  const matched = pageTokens.filter((t) => termTokens.has(t))
  return matched.length / pageTokens.length >= 0.6
}

function cacheKey(query: string, size: number): string {
  return `${query.trim().toLowerCase()}@${size}`
}

async function fetchFromWikipedia(query: string, size: number): Promise<Hit> {
  const q = query.trim()
  if (!q) return { url: null, title: null }

  // Use the search generator so "Bali Indonesia", "Kyoto, Japan" and "The
  // Algarve" all resolve to the right page — not just exact title matches.
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrlimit=1&gsrnamespace=0' +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=${size}&gsrsearch=` +
    encodeURIComponent(q)

  const res = await fetch(url)
  if (!res.ok) return { url: null, title: null }

  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> }
  }
  const pages = data.query?.pages
  if (!pages) return { url: null, title: null }

  const first = Object.values(pages)[0]
  return { url: first?.thumbnail?.source ?? null, title: first?.title ?? null }
}

function lookup(query: string, size: number): Promise<Hit> {
  const key = cacheKey(query, size)
  const cached = cache.get(key)
  if (cached) return Promise.resolve(cached)

  const existing = inflight.get(key)
  if (existing) return existing

  // Note: the fetch is deliberately not abortable. It is shared across every
  // component asking for the same place (and across StrictMode's double-mount),
  // so cancelling it for one caller must never reject it for the others. The
  // request is cheap, and its result is cached — callers just ignore stale
  // resolutions via a local `cancelled` flag.
  const promise = fetchFromWikipedia(query, size)
    .then((hit) => {
      cache.set(key, hit)
      inflight.delete(key)
      return hit
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

function resolveUrl(hit: Hit, opts?: Options): string | null {
  if (!hit.url) return null
  if (opts?.matchTerm) {
    if (!hit.title || !isRelevant(hit.title, opts.matchTerm, opts.context ?? '')) {
      return null
    }
  }
  return hit.url
}

export function useLocationImage(query: string, opts?: Options): ImageState {
  const matchTerm = opts?.matchTerm
  const context = opts?.context
  const size = opts?.size ?? DEFAULT_SIZE

  const [state, setState] = useState<ImageState>({ status: 'idle', url: null })

  useEffect(() => {
    const options = matchTerm ? { matchTerm, context } : undefined
    if (!query.trim()) {
      setState({ status: 'none', url: null })
      return
    }
    const key = cacheKey(query, size)
    const cached = cache.get(key)
    if (cached) {
      const url = resolveUrl(cached, options)
      setState({ status: url ? 'loaded' : 'none', url })
      return
    }

    let cancelled = false
    setState({ status: 'loading', url: null })

    lookup(query, size)
      .then((hit) => {
        if (cancelled) return
        const url = resolveUrl(hit, options)
        setState({ status: url ? 'loaded' : 'none', url })
      })
      .catch(() => {
        if (cancelled) return
        setState({ status: 'error', url: null })
      })

    return () => {
      cancelled = true
    }
  }, [query, matchTerm, context, size])

  return state
}
