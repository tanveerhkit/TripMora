# TripMora — AI Trip Planner

TripMora turns a trip idea into **structured, interactive UI** — never a chatbot.
The AI returns JSON that the app parses and renders as real, stateful components.
There are two ways in:

- **Dreaming a trip** — not sure where to go? Answer a few questions and get
  matched with destinations (season, cost comparison, safety, visa, weather,
  festivals, crowds), each with a one-tap "Plan this trip".
- **Describe your trip** — know the place? Describe it and get an editable
  day-by-day itinerary you can expand, edit, reorder, refine and save.

> Type _“5 relaxed days in Kyoto for a solo traveler who loves food, temples and
> quiet mornings”_ → get an itinerary with timed stops, tips, a budget breakdown
> and a packing list you can tick off.

---

## Features

**Core**

- 🧭 **Two modes** — "Dreaming a trip" (a guided questionnaire → ranked
  destination matches with cost comparison) and "Describe your trip" (free-form →
  itinerary). Pick a match and it flows straight into a full itinerary.
- ✍️ **Free-form input** — describe the trip however you like.
- 🤖 **Real LLM, structured output** — the model returns JSON; the app renders it.
- 🗓️ **Interactive itinerary** — expand/collapse days, **edit** any stop inline,
  **delete** stops or whole days, **drag to reorder** stops (mouse _and_ keyboard),
  and move days up/down.
- 🔁 **Refinement loop** — follow-up prompts (“make it cheaper”, “add a beach day”)
  edit the existing itinerary instead of regenerating from scratch.
- 💾 **Save & reload sessions** — every trip is saved to your browser and listed
  in the sidebar; reopen or delete any of them.
- 🧱 **Different block types** — beyond the itinerary, the AI output is rendered as
  an overview card, an interactive **packing checklist**, and a tips panel.
- 💰 **Interactive budget** — tap a category to see what it covers and how to book
  it, then switch options (flight ↔ train ↔ bus ↔ cab, hostel → luxury, street
  food → fine dining…) and the amounts and total **recalculate live**.
- 🖼️ **Location photos** — destination cards and the itinerary header show a real
  photo of the place, fetched from **Wikipedia** (free, no API key), with a
  gradient fallback when none exists.

**Robustness (the part that matters most)**

- Handles **malformed JSON, wrong shapes, empty plans, slow and failed requests**
  without ever crashing — every failure becomes a typed, friendly state with a
  **Retry**.
- **Stale responses can’t win** — each request is tracked by id and the previous
  one is aborted, so a slow answer never overwrites a newer trip.
- Forgiving parsing — a weird category, a cost written as `"₹1,500 approx"`, or a
  stop the model called `name` instead of `title` won’t throw away the itinerary.

**Polish**

- 🌗 Light/dark mode (remembers your choice, follows the OS by default)
- 📱 Fully responsive, mobile-first
- ♿ Keyboard-accessible drag-and-drop, focus states, ARIA labels
- ✨ Skeleton loading, subtle animations, reduced-motion support

---

## Tech stack

| Area     | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Frontend | React 18 (hooks + functional components), TypeScript, Vite    |
| Styling  | Hand-written CSS with design tokens + CSS Modules (no UI kit) |
| Drag/drop| `@dnd-kit` (accessible, keyboard-friendly)                    |
| Parsing  | `zod` for the structural gate + a custom normalizer           |
| AI       | **Groq** free tier, OpenAI-compatible chat API, JSON mode     |
| Backend  | Vercel serverless function (`/api/generate`) — keeps the key server-side |
| Tests    | Vitest + Testing Library                                      |

Everything here is free. No paid services are required.

---

## Getting started

### 1. Prerequisites

- Node.js 18+ and npm
- A free Groq API key → <https://console.groq.com/keys>

### 2. Install

```bash
git clone https://github.com/tanveerhkit/TripMora.git
cd TripMora
npm install
```

### 3. Add your API key

```bash
cp .env.example .env
```

Then edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
# optional: GROQ_MODEL=llama-3.3-70b-versatile
```

The key is only ever read by the serverless function — it is **never** exposed
to the browser.

### 4. Run it

```bash
npm run dev          # or: npm start
```

Open <http://localhost:5173>. `npm run dev` runs the app **and** the AI route
together (a small dev-only Vite middleware reuses the same serverless handler),
so you don’t need the Vercel CLI to develop locally.

### 5. Test / build

```bash
npm test             # unit + render tests (31 tests)
npm run build        # type-check + production build
```

---

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
   Vercel auto-detects Vite and treats `/api` as serverless functions — no extra
   config needed.
3. In **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your key
   - _(optional)_ `GROQ_MODEL`
4. **Deploy.** That’s it — the frontend is static and the AI call runs on Vercel’s
   serverless runtime.

---

## AI-usage note

**How the app uses the model**

- The browser sends the trip description to `POST /api/generate`. The serverless
  function adds the Groq API key server-side and calls Groq’s OpenAI-compatible
  Chat Completions API with `response_format: { type: "json_object" }` (JSON mode).
- A carefully written system prompt asks for a **fixed JSON schema**: trip meta,
  days, timed stops (with category, duration, cost and a local-guide tip), a
  budget breakdown, a packing list and travel tips.
- The raw model text is returned to the client, where
  [`parseItinerary`](src/lib/parseItinerary.ts) validates and **normalizes** it
  into a clean, typed `Itinerary` before anything is rendered.
- **Refinement** sends the current itinerary plus a change request; the model
  returns the full updated itinerary, and the app merges it (keeping the trip id
  and which packing items were already checked).
- **Dreaming** sends the questionnaire answers with a `dream` mode; the model
  returns a separate destinations schema, validated by
  [`parseDream`](src/lib/parseDream.ts) into interactive match cards.

**Model**: default `llama-3.3-70b-versatile` on Groq (configurable via
`GROQ_MODEL`). Chosen for being fast, free, and good at following JSON schemas.

---

## How bad AI output is handled

This is the core of the app, so it lives in one well-tested module,
[`src/lib/parseItinerary.ts`](src/lib/parseItinerary.ts):

| Problem                         | What happens                                             |
| ------------------------------- | -------------------------------------------------------- |
| Not valid JSON                  | Caught → typed `json` error + Retry (no crash)           |
| Valid JSON, wrong shape         | Structural gate (zod) rejects → `shape` error + Retry    |
| Empty / no real stops           | `empty` error with a helpful message                     |
| JSON wrapped in ```` ``` ```` fences | Extracted before parsing                            |
| Cost as `"₹1,500 approx"`       | Number pulled out safely                                 |
| Unknown category (“art museum”) | Snapped to the nearest known category by keyword         |
| Aliased fields (`name`, `activities`, `type`) | Read via fallbacks               |
| Slow / timed-out request        | 30s server timeout + client abort → `504` friendly error |
| Rate limited (429)              | Clear message + automatic short retry                    |
| A stale response arrives late   | Ignored — request-id guard + AbortController             |

These paths are covered by tests in
[`parseItinerary.test.ts`](src/lib/parseItinerary.test.ts).

---

## Project structure

```
api/
  generate.js            # serverless function — the only place the key is used
src/
  lib/
    parseItinerary.ts    # validate + normalize messy AI JSON  ← the important bit
    parseDream.ts        # same, for destination suggestions
    safe.ts              # shared defensive JSON accessors
    api.ts               # fetch client with retry + typed errors
    itineraryOps.ts      # pure, immutable itinerary edits
    dreamPrompt.ts       # answers → prompt, destination → itinerary prompt
    storage.ts           # localStorage sessions + theme
    categories.ts, format.ts
  hooks/
    useItinerary.ts      # request lifecycle + stale-response guard
    useDream.ts          # same lifecycle for dreaming mode
    useSessions.ts, useTheme.ts
  components/
    Home/                # two-mode chooser
    Dream/               # questionnaire + destination match cards
    TripForm/            # free-form input
    Itinerary/           # OverviewCard, DayCard, StopItem, blocks, RefinementBar…
    Sessions/            # saved-trips drawer
    states/, ui/         # loading/error states, Button, Icon
  types/itinerary.ts, types/dream.ts   # the clean app data models
  App.tsx                # screen routing (home / dream / describe / itinerary)
```

---

## Known limitations

- **Costs and details are AI estimates**, not live data — no real flight/hotel
  prices, maps, or bookings. The budget's switchable options scale the AI's
  estimate with fixed heuristics (e.g. a flight ≈ 1.9× a train), so they show the
  right *shape*, not quoted fares.
- **No streaming.** Structured JSON is parsed once it’s complete; the UI shows a
  skeleton while waiting rather than streaming tokens (streaming partial JSON
  reliably is a trade-off I chose against for correctness).
- **Drag-and-drop is within a day.** Days reorder with up/down buttons; stops
  don’t drag across days.
- **Sessions are per-browser** (localStorage) — no accounts or cloud sync. Only
  itineraries are saved; destination suggestions from Dreaming mode aren't (yet).
- Free-tier models occasionally return odd output; that’s exactly what the error
  handling and Retry are for.

---

## Time spent

Roughly **9–10 hours**, approximately:

- Architecture, data model & the resilient parser — ~3h
- Serverless route + AI prompt design + request lifecycle/stale-guard — ~2h
- UI components (form, days, stops, blocks, sessions, drag-and-drop) — ~3h
- Styling, dark mode, responsive & accessibility polish — ~1.5h
- Tests, README, deployment setup — ~1h

---

## License

MIT — do what you like.
