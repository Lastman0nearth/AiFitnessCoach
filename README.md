# Elite Athletic Performance & Nutrition Coach

A living tracker for the 61-day High-Performance Athletic Blueprint: a 190g protein floor,
1,850/2,300 kcal calorie cycling, the 10% Autoregulatory Strength Rule, and
fluid/electrolyte sync — built as a lean, entirely free-tier Cloudflare app.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4, mobile-first PWA
- **API:** Hono, running on a Cloudflare Worker
- **Database:** Cloudflare D1 (SQLite), via Drizzle ORM — persists in production, unlike a local file
- **AI:** Gemini API (Google AI Studio), called server-side only — `gemini-2.5-flash-lite` for
  typed or spoken meal descriptions, `gemini-2.5-flash` only when a photo is involved
- **Hosting:** Cloudflare Workers + Static Assets (one project, one `wrangler deploy`)

Everything runs on genuinely free tiers: Cloudflare Workers/D1 need no credit card, and
Google AI Studio's Gemini API (Flash models) is free with no credit card either — unlike
the Anthropic/OpenAI APIs, which require a funded billing account before they issue a key.

## One-time setup

1. Install dependencies (already done if you're reading this after the initial build):
   ```
   npm install
   ```
2. Log in to Cloudflare:
   ```
   npx wrangler login
   ```
3. Create the D1 database:
   ```
   npx wrangler d1 create ai-fitness-coach-db
   ```
   Copy the `database_id` it prints into `wrangler.toml` (replace
   `REPLACE_WITH_YOUR_D1_DATABASE_ID`).
4. Apply the schema:
   ```
   npm run db:migrate:remote
   ```
   (Use `npm run db:migrate:local` for local dev — this uses Miniflare's local D1 emulation
   and needs no Cloudflare account.)
5. Get a free Gemini API key (no credit card) from
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then set it as a
   Worker secret (for production):
   ```
   npx wrangler secret put GEMINI_API_KEY
   ```
   For local dev, copy `.dev.vars.example` to `.dev.vars` and fill in the real key —
   `.dev.vars` is gitignored and never committed.

   Note: on the free tier, Google may use your prompts/responses to improve their
   products. If that matters for your data, use a paid Gemini tier instead — same code,
   just billing enabled on the Google Cloud project behind your API key.

## Local development

```
npm run db:migrate:local   # once, or after schema changes
npm run dev
```

This runs Vite with the Cloudflare Workers runtime integrated (via `@cloudflare/vite-plugin`),
so the frontend, the Hono API, and a local D1 database all run together with hot reload.

## Deploy

```
npm run deploy
```

Builds the frontend and deploys the Worker + static assets to Cloudflare. Add to your
home screen from Safari on iPhone for the PWA experience.

## Data model

The app auto-seeds a single default user on first request, from the values in
`worker/lib/blueprint.ts` (ported from the original `active_blueprint.md` /
`daily_tracker.json`). Every table already carries a `user_id` column so real
multi-user accounts can be added later without a schema rewrite — for now it's
hardcoded to one user.

Core tables (see `worker/db/schema.ts`):
- `blueprint_config` — the mutable baseline (protein floor, calorie cycling limits,
  hydration target). The 10% Autoregulatory Strength Rule rewrites this row directly.
- `weekly_schedule` — the Master Weekly Schedule (day type, target calories, planned
  activities, planned running distance)
- `daily_logs` — one row per day: macro accumulation, weight, hydration, workout flags
- `meal_entries` — every logged meal, tagged by source (manual / text_parsed /
  photo_parsed / quick_log)
- `strength_metrics` — compound lift top-weight history, feeds the autoregulation check
- `food_library` — fixed-serving packaged items only (e.g. Iron Vegan, Hemp Pro Fiber).
  Per the "no portion guessing" rule, whole/variable foods are never seeded here with
  fabricated macros — they go through the text/photo parser instead, where an exact
  weight or label is required.

**Before relying on quick-log totals**, correct the three seeded food-library items
(`Iron Vegan Athlete's Blend`, `Hemp Pro Fiber`, `Ripple Unsweetened Pea Milk`) against
your actual product labels via `PUT /api/food-library/:id` — the seeded calorie/carb
values are best-effort placeholders where the blueprint doc only specified protein/fat.

## API surface

| Route | Purpose |
|---|---|
| `GET /api/today` | Today's schedule, log, remaining macro budget, meals |
| `GET /api/blueprint` | Config + weekly schedule + user profile |
| `POST /api/meals` | Log a meal with known exact macros |
| `POST /api/meals/parse-text` | Gemini parses a typed/spoken meal description |
| `POST /api/meals/parse-photo` | Gemini vision reads a nutrition label or plate photo |
| `POST /api/meals/suggest` | Meal Prep Solver — a recipe that fits the remaining budget |
| `POST /api/strength` | Log a lift; runs the 10% Autoregulatory Strength Rule check |
| `GET /api/strength/latest` | Latest top weight + warning flag per lift |
| `POST /api/hydration` | Log fluid intake / electrolyte replenishment |
| `GET/POST /api/food-library` | Quick-log food presets |
| `POST /api/food-library/:id/quick-log` | One-tap log of a preset item |
| `POST /api/runs`, `GET /api/runs/weekly-volume` | Planned vs. actual running volume |
| `POST /api/weight`, `GET /api/weight/history` | Weight trend tracking |
| `POST /api/workouts`, `GET /api/workouts` | General activity log — weights, resistance bands, kettlebells |
| `GET /api/export.csv` | Flattened daily history as CSV |

## Roadmap (not in this build)

- **End-of-61-day AI Expert Panel**: when `target_date` is reached, lock the dashboard,
  run an onboarding questionnaire, and call Gemini with a multi-persona prompt (Sports
  Scientist / Track Coach / Orthopedic Specialist) to collaboratively write the next
  phase's blueprint.
