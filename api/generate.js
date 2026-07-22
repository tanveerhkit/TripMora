/**
 * POST /api/generate — the only place the AI keys are ever used.
 *
 * Runs as a Vercel serverless function (Node runtime). The browser sends a
 * trip description (or a refinement instruction + the current itinerary); we
 * call Groq's free, OpenAI-compatible chat API in JSON mode and hand the raw
 * model text back to the client, which parses/validates it.
 *
 * Groq is fast but its free tier has a small per-minute token budget, so when a
 * request is rate-limited (429) we transparently fall back to Google Gemini,
 * whose free tier allows far more tokens per minute. Gemini exposes an
 * OpenAI-compatible endpoint, so the same request/response shape works for both.
 *
 * Env:
 *   GROQ_API_KEY        (required) — from https://console.groq.com/keys
 *   GROQ_MODEL          (optional) — primary Groq model, defaults to a capable one
 *   GROQ_FALLBACK_MODEL (optional) — smaller Groq model, used only when no
 *                                    GEMINI_API_KEY is set
 *   GEMINI_API_KEY      (optional) — from https://aistudio.google.com/apikey;
 *                                    the preferred fallback when Groq is
 *                                    rate-limited or erroring
 *   GEMINI_MODEL        (optional) — Gemini fallback model, defaults to gemini-2.5-flash
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// Gemini's OpenAI-compatibility layer — same body/response shape as Groq.
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
// A smaller/faster Groq model — only used as a fallback if no Gemini key is set.
const FALLBACK_MODEL = 'llama-3.1-8b-instant'
// Gemini's fast, capable free-tier model with a very generous per-minute budget.
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const UPSTREAM_TIMEOUT_MS = 30_000
const MAX_PROMPT_CHARS = 2000
// Cap on generated tokens. Groq reserves this against its per-minute budget up
// front (not just what's actually used), so keeping it lean eases rate limits
// while still leaving room for a full multi-day itinerary.
const MAX_OUTPUT_TOKENS = 3000

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

const DREAM_SCHEMA_HINT = `Return ONLY a single minified JSON object (no markdown, no prose) with this exact shape:
{
  "summary": string,               // 1-2 sentences framing your picks for this traveler
  "currency": string,              // a single currency symbol used for cost comparison, e.g. "$"
  "destinations": [
    {
      "name": string,              // city or region
      "country": string,
      "matchReason": string,       // why it fits THIS traveler's answers (concrete, 1-2 sentences)
      "bestSeason": string,        // best time to visit
      "estCost": number,           // approx total per person for a typical trip, in the chosen currency
      "costLevel": string,         // one of: Budget, Moderate, Premium
      "safety": string,            // one short sentence
      "safetyLevel": string,       // one of: High, Moderate, Caution
      "visa": string,              // visa requirement (use the traveler's home country if given)
      "currency": string,          // the destination's local currency
      "weather": string,           // expected weather around the chosen time
      "internet": string,          // one of: Fast, Good, Patchy
      "crowdLevel": string,        // one of: Low, Moderate, High (for the chosen time)
      "festivals": string[],       // 0-3 notable events around that time
      "suggestedDays": number,     // a sensible trip length
      "tags": string[]             // 2-4 short interest tags
    }
  ]
}`

const DREAM_SYSTEM = `You are TripMora, a destination advisor for travelers who haven't decided where to go.
From the traveler's answers, suggest where they should travel.

Rules:
- ${DREAM_SCHEMA_HINT}
- Return 4 to 6 real destinations, ranked best-fit first.
- Genuinely respect their budget, who's travelling (kids/elderly), style, visa needs,
  food preference, temperature and terrain preferences.
- Use the SAME comparison currency for every "estCost" so they can be compared.
- Be realistic and specific; avoid generic filler. Never return an empty list.
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
  const mode =
    body.mode === 'refine' ? 'refine' : body.mode === 'dream' ? 'dream' : 'generate'
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

  if (mode === 'dream') {
    return [
      { role: 'system', content: DREAM_SYSTEM },
      { role: 'user', content: `Traveler's answers:\n${prompt}` },
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

  const messages = buildMessages(body)
  const primary = process.env.GROQ_MODEL || DEFAULT_MODEL
  const groqFallback = process.env.GROQ_FALLBACK_MODEL || FALLBACK_MODEL
  const geminiKey = process.env.GEMINI_API_KEY
  const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL

  // Groq and Gemini share the same OpenAI-compatible request body.
  const requestBody = (model) =>
    JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: 'json_object' },
    })

  const callModel = (url, key, model) =>
    fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: requestBody(model),
    })

  const callGroq = (model) => callModel(GROQ_URL, apiKey, model)
  const callGemini = (model) => callModel(GEMINI_URL, geminiKey, model)

  try {
    let upstream = await callGroq(primary)

    // Groq's free tier is fast but has a small per-minute token budget. If it's
    // rate-limited (429) or having a server-side error (5xx), fall back —
    // preferring Gemini (far larger free per-minute budget); otherwise drop to
    // a smaller Groq model as a last resort.
    if (upstream.status === 429 || upstream.status >= 500) {
      if (geminiKey) {
        console.warn(`Groq ${primary} unavailable (${upstream.status}); falling back to Gemini ${geminiModel}`)
        upstream = await callGemini(geminiModel)
      } else if (groqFallback && groqFallback !== primary) {
        console.warn(`Groq ${primary} unavailable (${upstream.status}); falling back to ${groqFallback}`)
        upstream = await callGroq(groqFallback)
      }
    }

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
