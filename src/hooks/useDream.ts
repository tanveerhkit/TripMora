/**
 * Owns the "Dreaming" request lifecycle: answers → destination ideas.
 * Same guarantees as useItinerary — typed error states, retry, and a
 * stale-response guard (request id + AbortController).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiError, requestModelText } from '../lib/api'
import { buildDreamPrompt } from '../lib/dreamPrompt'
import { parseDream } from '../lib/parseDream'
import type { DestinationRec, DreamAnswers, DreamResult } from '../types/dream'
import type { ErrorInfo } from './useItinerary'

type Status = 'idle' | 'loading' | 'error' | 'ready'

interface State {
  status: Status
  result: DreamResult | null
  error: ErrorInfo | null
  requestId: number
  loadingMore: boolean
  moreError: string | null
}

type Action =
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number; result: DreamResult }
  | { type: 'fail'; requestId: number; error: ErrorInfo }
  | { type: 'startMore' }
  | { type: 'appendMore'; destinations: DestinationRec[] }
  | { type: 'failMore'; message: string }
  | { type: 'reset' }

const initialState: State = {
  status: 'idle',
  result: null,
  error: null,
  requestId: 0,
  loadingMore: false,
  moreError: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        status: 'loading',
        error: null,
        requestId: action.requestId,
        loadingMore: false,
        moreError: null,
      }
    case 'success':
      if (action.requestId !== state.requestId) return state
      return { ...state, status: 'ready', result: action.result, error: null }
    case 'fail':
      if (action.requestId !== state.requestId) return state
      return { ...state, status: 'error', error: action.error }
    case 'startMore':
      return { ...state, loadingMore: true, moreError: null }
    case 'appendMore': {
      if (!state.result) return state
      const seen = new Set(state.result.destinations.map((d) => d.name.toLowerCase()))
      const added = action.destinations.filter((d) => !seen.has(d.name.toLowerCase()))
      return {
        ...state,
        loadingMore: false,
        moreError: added.length ? null : 'No new places to add — try adjusting your answers.',
        result: { ...state.result, destinations: [...state.result.destinations, ...added] },
      }
    }
    case 'failMore':
      return { ...state, loadingMore: false, moreError: action.message }
    case 'reset':
      return { ...initialState }
    default:
      return state
  }
}

export function useDream() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const moreAbortRef = useRef<AbortController | null>(null)
  const lastAnswersRef = useRef<DreamAnswers | null>(null)
  const resultRef = useRef<DreamResult | null>(null)

  // Keep a ref of the latest result so `dreamMore` can read it without being
  // re-created (and can exclude already-shown places).
  useEffect(() => {
    resultRef.current = state.result
  }, [state.result])

  useEffect(
    () => () => {
      abortRef.current?.abort()
      moreAbortRef.current?.abort()
    },
    [],
  )

  const dream = useCallback(async (answers: DreamAnswers) => {
    abortRef.current?.abort()
    moreAbortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const myId = requestIdRef.current + 1
    requestIdRef.current = myId
    lastAnswersRef.current = answers

    dispatch({ type: 'start', requestId: myId })

    try {
      const text = await requestModelText({
        prompt: buildDreamPrompt(answers),
        mode: 'dream',
        signal: controller.signal,
      })
      if (myId !== requestIdRef.current) return

      const parsed = parseDream(text)
      if (!parsed.ok) {
        dispatch({
          type: 'fail',
          requestId: myId,
          error: { message: parsed.message, kind: parsed.kind },
        })
        return
      }
      dispatch({ type: 'success', requestId: myId, result: parsed.result })
    } catch (err) {
      if (controller.signal.aborted || myId !== requestIdRef.current) return
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Check your connection and try again.'
      dispatch({ type: 'fail', requestId: myId, error: { message, kind: 'network' } })
    }
  }, [])

  // Fetch a fresh batch of ideas and append them, excluding what's already
  // shown. Has its own loading/error state so the existing cards stay put.
  const dreamMore = useCallback(async () => {
    const answers = lastAnswersRef.current
    const current = resultRef.current
    if (!answers || !current) return

    const myId = requestIdRef.current // tie this batch to the current results
    moreAbortRef.current?.abort()
    const controller = new AbortController()
    moreAbortRef.current = controller

    dispatch({ type: 'startMore' })

    try {
      const exclude = current.destinations.map((d) =>
        d.country && d.country !== d.name ? `${d.name}, ${d.country}` : d.name,
      )
      const text = await requestModelText({
        prompt: buildDreamPrompt(answers, exclude),
        mode: 'dream',
        signal: controller.signal,
      })
      if (myId !== requestIdRef.current) return // superseded by a new search

      const parsed = parseDream(text)
      if (!parsed.ok) {
        dispatch({ type: 'failMore', message: parsed.message })
        return
      }
      dispatch({ type: 'appendMore', destinations: parsed.result.destinations })
    } catch (err) {
      if (controller.signal.aborted || myId !== requestIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Could not load more ideas. Try again.'
      dispatch({ type: 'failMore', message })
    }
  }, [])

  const retry = useCallback(() => {
    if (lastAnswersRef.current) dream(lastAnswersRef.current)
  }, [dream])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    moreAbortRef.current?.abort()
    requestIdRef.current += 1
    dispatch({ type: 'reset' })
  }, [])

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    isLoading: state.status === 'loading',
    loadingMore: state.loadingMore,
    moreError: state.moreError,
    dream,
    dreamMore,
    retry,
    reset,
  }
}
