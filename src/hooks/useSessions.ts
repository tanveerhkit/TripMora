/** Saved trips, backed by localStorage. Newest first. */
import { useCallback, useEffect, useState } from 'react'
import { loadSessions, saveSessions, type StoredSession } from '../lib/storage'
import type { Itinerary } from '../types/itinerary'

export function useSessions() {
  const [sessions, setSessions] = useState<StoredSession[]>(() => loadSessions())

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  /** Create or update the session that owns this itinerary (keyed by id). */
  const upsert = useCallback((prompt: string, itinerary: Itinerary) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === itinerary.id)
      const entry: StoredSession = {
        id: itinerary.id,
        prompt,
        itinerary,
        createdAt: idx >= 0 ? prev[idx].createdAt : itinerary.createdAt,
        updatedAt: itinerary.updatedAt,
      }
      const next = idx >= 0 ? prev.map((s, i) => (i === idx ? entry : s)) : [entry, ...prev]
      return next.sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }, [])

  const remove = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearAll = useCallback(() => setSessions([]), [])

  return { sessions, upsert, remove, clearAll }
}
