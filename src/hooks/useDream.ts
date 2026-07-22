/**
 * Owns the "Dreaming" request lifecycle: answers → destination ideas.
 * Same guarantees as useItinerary — typed error states, retry, and a
 * stale-response guard (request id + AbortController).
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiError, requestModelText } from '../lib/api'
import { buildDreamPrompt } from '../lib/dreamPrompt'
import { parseDream } from '../lib/parseDream'
import type { DreamAnswers, DreamResult } from '../types/dream'
import type { ErrorInfo } from './useItinerary'

type Status = 'idle' | 'loading' | 'error' | 'ready'

interface State {
  status: Status
  result: DreamResult | null
  error: ErrorInfo | null
  requestId: number
}

type Action =
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number; result: DreamResult }
  | { type: 'fail'; requestId: number; error: ErrorInfo }
  | { type: 'reset' }

const initialState: State = { status: 'idle', result: null, error: null, requestId: 0 }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, status: 'loading', error: null, requestId: action.requestId }
    case 'success':
      if (action.requestId !== state.requestId) return state
      return { ...state, status: 'ready', result: action.result, error: null }
    case 'fail':
      if (action.requestId !== state.requestId) return state
      return { ...state, status: 'error', error: action.error }
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
  const lastAnswersRef = useRef<DreamAnswers | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const dream = useCallback(async (answers: DreamAnswers) => {
    abortRef.current?.abort()
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

  const retry = useCallback(() => {
    if (lastAnswersRef.current) dream(lastAnswersRef.current)
  }, [dream])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    requestIdRef.current += 1
    dispatch({ type: 'reset' })
  }, [])

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    isLoading: state.status === 'loading',
    dream,
    retry,
    reset,
  }
}
