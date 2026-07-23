/**
 * Owns the AI request lifecycle and the current itinerary.
 *
 * Guarantees the two things the brief calls out:
 *  - a slow/failed response never crashes the UI (typed error states), and
 *  - a stale response never overwrites a newer one (request-id + AbortController).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiError, requestModelText, type GenerateMode } from '../lib/api'
import { mergeRefined } from '../lib/itineraryOps'
import { parseItinerary, type ParseFailureKind } from '../lib/parseItinerary'
import type { Itinerary } from '../types/itinerary'

export type Status = 'idle' | 'loading' | 'error' | 'ready'
export type ErrorKind = ParseFailureKind | 'network' | 'http'

export interface ErrorInfo {
  message: string
  kind: ErrorKind
}

interface State {
  status: Status
  itinerary: Itinerary | null
  error: ErrorInfo | null
  loadingMode: GenerateMode | null
  requestId: number
}

type Action =
  | { type: 'start'; requestId: number; mode: GenerateMode }
  | { type: 'success'; requestId: number; itinerary: Itinerary; mode: GenerateMode }
  | { type: 'fail'; requestId: number; error: ErrorInfo }
  | { type: 'set'; itinerary: Itinerary }
  | { type: 'patch'; itinerary: Itinerary }
  | { type: 'reset' }

const initialState: State = {
  status: 'idle',
  itinerary: null,
  error: null,
  loadingMode: null,
  requestId: 0,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        status: 'loading',
        error: null,
        loadingMode: action.mode,
        requestId: action.requestId,
      }
    case 'success': {
      if (action.requestId !== state.requestId) return state // stale — ignore
      const itinerary =
        (action.mode === 'refine' || action.mode === 'recover') && state.itinerary
          ? mergeRefined(state.itinerary, action.itinerary)
          : action.itinerary
      return { ...state, status: 'ready', itinerary, error: null, loadingMode: null }
    }
    case 'fail':
      if (action.requestId !== state.requestId) return state // stale — ignore
      return { ...state, status: 'error', error: action.error, loadingMode: null }
    case 'set':
      return { ...state, status: 'ready', itinerary: action.itinerary, error: null }
    case 'patch':
      return { ...state, itinerary: action.itinerary }
    case 'reset':
      return { ...initialState }
    default:
      return state
  }
}

export function useItinerary() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const itineraryRef = useRef<Itinerary | null>(null)
  const lastRequestRef = useRef<{
    prompt: string
    mode: GenerateMode
    hard?: boolean
  } | null>(null)

  // Keep a ref of the latest itinerary so `run` can read it without being
  // re-created on every edit.
  useEffect(() => {
    itineraryRef.current = state.itinerary
  }, [state.itinerary])

  // Abort any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), [])

  const run = useCallback(
    async (prompt: string, mode: GenerateMode, opts: { hard?: boolean } = {}) => {
    const trimmed = prompt.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const myId = requestIdRef.current + 1
    requestIdRef.current = myId
    lastRequestRef.current = { prompt: trimmed, mode, hard: opts.hard }

    dispatch({ type: 'start', requestId: myId, mode })

    try {
      const text = await requestModelText({
        prompt: trimmed,
        mode,
        itinerary:
          mode === 'refine' || mode === 'recover' ? itineraryRef.current : undefined,
        hard: opts.hard,
        signal: controller.signal,
      })
      if (myId !== requestIdRef.current) return // a newer request superseded this one

      const parsed = parseItinerary(text)
      if (!parsed.ok) {
        dispatch({
          type: 'fail',
          requestId: myId,
          error: { message: parsed.message, kind: parsed.kind },
        })
        return
      }
      dispatch({ type: 'success', requestId: myId, itinerary: parsed.itinerary, mode })
    } catch (err) {
      if (controller.signal.aborted || myId !== requestIdRef.current) return
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Check your connection and try again.'
      dispatch({ type: 'fail', requestId: myId, error: { message, kind: 'network' } })
    }
  }, [])

  const generate = useCallback(
    (prompt: string, hard = false) => run(prompt, 'generate', { hard }),
    [run],
  )
  const refine = useCallback((prompt: string) => run(prompt, 'refine'), [run])
  const recover = useCallback((prompt: string) => run(prompt, 'recover'), [run])

  const retry = useCallback(() => {
    const last = lastRequestRef.current
    if (last) run(last.prompt, last.mode, { hard: last.hard })
  }, [run])

  const setItinerary = useCallback((itinerary: Itinerary) => {
    // Loading a saved session cancels any pending request.
    abortRef.current?.abort()
    requestIdRef.current += 1
    dispatch({ type: 'set', itinerary })
  }, [])

  const mutate = useCallback((fn: (it: Itinerary) => Itinerary) => {
    const current = itineraryRef.current
    if (!current) return
    dispatch({ type: 'patch', itinerary: fn(current) })
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    requestIdRef.current += 1
    dispatch({ type: 'reset' })
  }, [])

  return {
    status: state.status,
    itinerary: state.itinerary,
    error: state.error,
    isLoading: state.status === 'loading',
    loadingMode: state.loadingMode,
    generate,
    refine,
    recover,
    retry,
    setItinerary,
    mutate,
    reset,
  }
}
