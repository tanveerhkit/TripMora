/**
 * localStorage-backed persistence for saved trips. Everything is defensive:
 * private-mode, disabled storage, quota errors and corrupt data all degrade to
 * "no saved sessions" rather than throwing.
 */
import type { Itinerary } from '../types/itinerary'

const SESSIONS_KEY = 'tripmora.sessions.v1'
const THEME_KEY = 'tripmora.theme'

export interface StoredSession {
  id: string
  prompt: string
  itinerary: Itinerary
  createdAt: number
  updatedAt: number
}

function canUseStorage(): boolean {
  try {
    const k = '__tm_test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

export function loadSessions(): StoredSession[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Light shape check — ignore anything that doesn't look like a session.
    return parsed.filter(
      (s): s is StoredSession =>
        s &&
        typeof s.id === 'string' &&
        s.itinerary &&
        Array.isArray(s.itinerary.days),
    )
  } catch {
    return []
  }
}

export function saveSessions(sessions: StoredSession[]): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    // Quota or serialization failure — drop the oldest and retry once.
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 10)))
    } catch {
      /* give up silently; the app still works in-memory */
    }
  }
}

export type ThemeChoice = 'light' | 'dark'

export function loadTheme(): ThemeChoice | null {
  if (!canUseStorage()) return null
  const value = localStorage.getItem(THEME_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function saveTheme(theme: ThemeChoice): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}
