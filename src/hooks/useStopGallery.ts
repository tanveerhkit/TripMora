/**
 * Resolves a set of photos for an itinerary — the destination itself plus its
 * notable stops — into `{ image, text }` items for the CircularGallery.
 *
 * Generic stops ("Lunch at a local eatery") get no relevant image and are
 * dropped by the relevance guard, so the gallery only ever shows real places.
 */
import { useEffect, useState } from 'react'
import type { Itinerary } from '../types/itinerary'
import { resolveLocationImage } from './useLocationImage'

export interface GalleryItem {
  image: string
  text: string
}

const MAX_ITEMS = 12
const IMG_SIZE = 800

export function useStopGallery(itinerary: Itinerary): GalleryItem[] {
  const [items, setItems] = useState<GalleryItem[]>([])
  const id = itinerary.id

  useEffect(() => {
    let cancelled = false
    const dest = itinerary.meta.destination.trim()

    // Build a de-duplicated queue: the destination first, then stop titles.
    const seen = new Set<string>()
    const queue: { query: string; text: string; matchTerm?: string }[] = []

    if (dest) {
      seen.add(dest.toLowerCase())
      queue.push({ query: dest, text: dest })
    }
    for (const day of itinerary.days) {
      for (const stop of day.stops) {
        const title = stop.title.trim()
        const key = title.toLowerCase()
        if (!title || seen.has(key)) continue
        seen.add(key)
        queue.push({ query: `${title} ${dest}`.trim(), text: title, matchTerm: title })
        if (queue.length >= MAX_ITEMS) break
      }
      if (queue.length >= MAX_ITEMS) break
    }

    Promise.all(
      queue.map(async (q) => {
        const image = await resolveLocationImage(q.query, {
          size: IMG_SIZE,
          matchTerm: q.matchTerm,
          context: dest,
        })
        return image ? { image, text: q.text } : null
      }),
    ).then((results) => {
      if (cancelled) return
      const next = results.filter((r): r is GalleryItem => r !== null)
      // Only publish once we actually have photos — keeps the static fallback
      // (and avoids a no-op state update when nothing resolves, e.g. offline).
      if (next.length) setItems(next)
    })

    return () => {
      cancelled = true
    }
    // Keyed by itinerary id — the gallery is a stable overview, it doesn't need
    // to re-resolve on every in-place stop edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return items
}
