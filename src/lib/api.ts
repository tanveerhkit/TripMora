/**
 * Thin client for the /api/generate serverless route.
 *
 * Returns the raw model text (a string that should be JSON); parsing/validation
 * lives in parseItinerary so there is a single source of truth. Includes a small
 * automatic retry for transient failures, on top of the manual "Retry" button.
 */
import type { Itinerary } from '../types/itinerary'

export type GenerateMode = 'generate' | 'refine' | 'dream' | 'recover'

export interface GenerateArgs {
  prompt: string
  mode: GenerateMode
  itinerary?: Itinerary | null
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number
  retryable: boolean
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    // 429 / 5xx and network-level (0) failures are worth retrying.
    this.retryable = status === 0 || status === 429 || status >= 500
  }
}

/** Strip client-only bookkeeping before sending the itinerary upstream. */
function itineraryForServer(itinerary: Itinerary): unknown {
  return {
    meta: itinerary.meta,
    days: itinerary.days.map((d) => ({
      title: d.title,
      summary: d.summary,
      stops: d.stops.map((s) => ({
        time: s.time,
        title: s.title,
        description: s.description,
        category: s.category,
        durationMin: s.durationMin,
        cost: s.cost,
        tip: s.tip,
        // so 'recover' knows which stops the traveler missed
        status: s.status,
      })),
    })),
    budget: itinerary.budget.map((b) => ({ label: b.label, amount: b.amount })),
    packing: itinerary.packing.map((p) => p.text),
    tips: itinerary.tips,
  }
}

async function requestOnce(args: GenerateArgs): Promise<string> {
  let res: Response
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: args.prompt,
        mode: args.mode,
        itinerary:
          (args.mode === 'refine' || args.mode === 'recover') && args.itinerary
            ? itineraryForServer(args.itinerary)
            : undefined,
      }),
      signal: args.signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    // Network error / server unreachable.
    throw new ApiError('Could not reach the server. Check your connection.', 0)
  }

  let payload: { content?: string; error?: string } | null = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  if (!res.ok) {
    throw new ApiError(payload?.error || `Request failed (${res.status}).`, res.status)
  }
  if (typeof payload?.content !== 'string') {
    throw new ApiError('The AI returned an unexpected response.', 502)
  }
  return payload.content
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Calls the route with up to `maxRetries` extra attempts on transient errors,
 * using a short exponential-ish backoff. Aborts are never retried.
 */
export async function requestModelText(
  args: GenerateArgs,
  maxRetries = 1,
): Promise<string> {
  let attempt = 0
  for (;;) {
    try {
      return await requestOnce(args)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err
      const retryable = err instanceof ApiError && err.retryable
      if (!retryable || attempt >= maxRetries || args.signal?.aborted) throw err
      attempt += 1
      await wait(600 * attempt)
    }
  }
}
