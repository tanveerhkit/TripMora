/**
 * POST /api/generate — the only place the AI key is ever used.
 *
 * Runs as a Vercel serverless function (Node runtime). The browser sends a
 * trip description (or a refinement instruction + the current itinerary); we
 * call Groq's free, OpenAI-compatible chat API in JSON mode and hand the raw
 * model text back to the client, which parses/validates it.
 *
 * Env:
 *   GROQ_API_KEY  (required) — from https://console.groq.com/keys
 *   GROQ_MODEL    (optional) — defaults to a capable free model
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const UPSTREAM_TIMEOUT_MS = 30_000
const MAX_PROMPT_CHARS = 2000

export const config = { maxDuration: 30 }

const SCHEMA_HINT = `Return ONLY a single minified JSON object (no markdown, no prose) with this exact shape:
{
  "meta": {
    "destination": string,
    "durationDays": number,
    "travelerType": string,      // infer one: Solo, Family, Couple, Backpacker, Luxury, Budget, Honeymoon, Business, Adventure, Senior, Foodie
    "bestSeason": string,
    "currency": string,          // a symbol suited to the destination, e.g. "$", "€", "£", "¥", "₹"
    "summary": string,           // 1-2 sentences on the trip's vibe
    "tags": string[]             // interests reflected, e.g. ["food","history","nature"]
  },
  "days": [
    {
      "title": string,           // a short theme for the day
      "summary": string,         // one line
      "stops": [
        {
          "time": string,        // "08:10" (24h) or a part of day like "Morning"
          "title": string,       // the place or activity
          "description": string, // 1-2 concrete sentences
          "category": string,    // one of: sightseeing, food, nature, culture, relax, nightlife, shopping, transport, adventure
          "durationMin": number, // minutes spent here
          "cost": number,        // approx per-person cost in the chosen currency (0 if free)
          "tip": string          // a smart local tip: best time, how to skip a queue, a scam to avoid
        }
      ]
    }
  ],
  "budget": { "total": number, "items": [ { "label": string, "amount": number } ] },
  "packing": string[],           // 5-10 practical items tuned to the destination and season
  "tips": string[]               // 3-5 safety / money / etiquette tips
}`

const GENERATE_SYSTEM = `You are TripMora, an expert AI travel planner.
Turn the user's free-form description into a realistic, well-sequenced day-by-day itinerary.

Rules:
- ${SCHEMA_HINT}
- 3 to 6 stops per day, in a sensible order (group by area, respect opening hours, avoid backtracking).
- Give realistic times that flow through the day, and honest approximate costs.
- Add a genuinely useful "tip" to most stops (e.g. "go by 8am, queues triple after 10").
- If the user didn't say how many days, pick a sensible 3-5.
- Infer the traveler type and interests from their words and reflect them.
- Keep each day achievable; don't cram. Never leave "days" empty.
- Output valid JSON only. Do not wrap it in code fences.`

const REFINE_SYSTEM = `You are TripMora, editing an existing travel itinerary.
You are given the current itinerary as JSON and a change request.
Apply ONLY what the user asked for and keep everything else exactly as it was.

Rules:
- ${SCHEMA_HINT}
- Return the COMPLETE updated itinerary in the same schema (not a diff).
- Preserve unrelated days, stops, wording, costs and order.
- Output valid JSON only. Do not wrap it in code fences.`

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  // Fallback: read the raw stream (some runtimes don't pre-parse).
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

function buildMessages(body) {
  const mode = body.mode === 'refine' ? 'refine' : 'generate'
  const prompt = String(body.prompt || '').slice(0, MAX_PROMPT_CHARS).trim()

  if (mode === 'refine') {
    const current = body.itinerary ? JSON.stringify(body.itinerary) : '{}'
    return [
      { role: 'system', content: REFINE_SYSTEM },
      {
        role: 'user',
        content: `Current itinerary:\n${current}\n\nChange request:\n${prompt}`,
      },
    ]
  }

  return [
    { role: 'system', content: GENERATE_SYSTEM },
    { role: 'user', content: `Plan this trip:\n${prompt}` },
  ]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error:
        'The server is missing GROQ_API_KEY. Add it in your environment (see README) and redeploy.',
    })
  }

  const body = await readJsonBody(req)
  if (!body) {
    return res.status(400).json({ error: 'Request body was not valid JSON.' })
  }

  const prompt = String(body.prompt || '').trim()
  if (!prompt) {
    return res.status(400).json({ error: 'Please describe your trip first.' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: buildMessages(body),
        temperature: 0.6,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      const status = upstream.status === 429 ? 429 : 502
      const message =
        upstream.status === 429
          ? 'The AI is rate-limited right now. Wait a moment and retry.'
          : `The AI service returned an error (${upstream.status}).`
      // Log detail server-side only; never leak keys or raw upstream to client.
      console.error('Groq upstream error', upstream.status, detail.slice(0, 500))
      return res.status(status).json({ error: message })
    }

    const data = await upstream.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: 'The AI returned an empty response.' })
    }

    return res.status(200).json({ content })
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'The AI took too long to respond. Try again.' })
    }
    console.error('generate handler error', err)
    return res.status(502).json({ error: 'Could not reach the AI service. Try again.' })
  } finally {
    clearTimeout(timeout)
  }
}
