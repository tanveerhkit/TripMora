/**
 * Fetches a representative photo for a place name from Wikipedia's public API.
 * Free, no API key, and CORS-enabled — the browser calls it directly, so there
 * is nothing to route through the backend. Results (including "no image") are
 * cached in memory so a place is only ever looked up once per session.
 */
import { useEffect, useState } from 'react'

type ImageStatus = 'idle' | 'loading' | 'loaded' | 'none' | 'error'

interface ImageState {
  status: ImageStatus
  url: string | null
}

const cache = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

function cacheKey(query: string): string {
  return query.trim().toLowerCase()
}

async function fetchFromWikipedia(query: string, signal: AbortSignal): Promise<string | null> {
  const q = query.trim()
  if (!q) return null

  // Use the search generator so "Bali Indonesia", "Kyoto, Japan" and "The
  // Algarve" all resolve to the right page — not just exact title matches.
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrlimit=1&gsrnamespace=0' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=800&gsrsearch=' +
    encodeURIComponent(q)

  const res = await fetch(url, { signal })
  if (!res.ok) return null

  const data = (await res.json()) as {
    query?: { pages?: Record<string, { thumbnail?: { source?: string } }> }
  }
  const pages = data.query?.pages
  if (!pages) return null

  const first = Object.values(pages)[0]
  return first?.thumbnail?.source ?? null
}

function lookup(query: string, signal: AbortSignal): Promise<string | null> {
  const key = cacheKey(query)
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null)

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = fetchFromWikipedia(query, signal)
    .then((url) => {
      cache.set(key, url)
      inflight.delete(key)
      return url
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

export function useLocationImage(query: string): ImageState {
  const [state, setState] = useState<ImageState>({ status: 'idle', url: null })

  useEffect(() => {
    const key = cacheKey(query)
    if (!key) {
      setState({ status: 'none', url: null })
      return
    }
    if (cache.has(key)) {
      const url = cache.get(key) ?? null
      setState({ status: url ? 'loaded' : 'none', url })
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading', url: null })

    lookup(query, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) return
        setState({ status: url ? 'loaded' : 'none', url })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ status: 'error', url: null })
      })

    return () => controller.abort()
  }, [query])

  return state
}
