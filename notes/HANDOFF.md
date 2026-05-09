# HANDOFF
Date: 2026-05-09
Repos touched: deal-feed-dashboard + scoutgpt-api
Session objective: Nightdrop dashboard redesign sprint + recover from cascading post-launch bugs (login 500, empty feed, schema/code drift, dual Neon DB confusion)
Status: COMPLETE — login works, feed renders, all fixes shipped, lessons saved to memory

---

## Where we ended up

- **Login works.** Verified HTTP 200 + JWT for `brady@parcyl.ai` against https://scoutgpt-app.onrender.com/api/dealfeed/auth/login. Password was reset to `Nightdrop2026!` (change it from Settings).
- **Feed renders correctly.** All 358 deals on prod have backfilled narratives + distress signals. The flex-shrink CSS bug that was crushing every card to a 1px line is fixed.
- **Both repos pushed to main.** Netlify and Render both auto-deployed.

---

## Production URLs (memorize these)

| Surface | URL | Source |
|---|---|---|
| Frontend (production) | https://nightdropai.netlify.app | `deal-feed-dashboard` repo, main branch |
| Backend (production) | https://scoutgpt-app.onrender.com | `scoutgpt-api` repo, main branch — Render service `scoutgpt-app` (Standard, Ohio) |
| Backend (dev — empty DB, ignore) | https://scoutgpt-api.onrender.com | same repo, develop branch — Render service `scoutgpt-api` (Free, Oregon) |
| Property/parcel DB | `ep-weathered-cell-...` Neon endpoint | `DATABASE_URL` env var |
| Dealfeed (df_*) DB | `ep-weathered-poetry-...` Neon endpoint | `DATABASE_WRITE_URL` env var |

**Always open Render shell on `scoutgpt-app` (not `scoutgpt-api`). Always run `df_*` migrations against `$DATABASE_WRITE_URL` (not `$DATABASE_URL`).**

---

## Sprint deliverables (deal-feed-dashboard)

### New components
- `src/components/TopHeader.jsx` — fixed header, Nightdrop wordmark, search input, 2am countdown timer
- `src/components/LeftPanel.jsx` — collapsible sidebar (240px / 60px), nav, stats, buy boxes, run history mini bar chart
- `src/components/ScoreBadge.jsx` — pill badge, green ≥8 / amber 5-7 / red <5
- `src/components/OverflowMenu.jsx` — card overflow menu (Save / Share / Hide / Report)
- `src/components/RightRail.jsx` — mini DealMap + buy box health cards
- `src/components/feed/FeedDealCard.jsx` — social-feed deal card (aerial image slot, asset-class-aware quick facts, narrative, ThumbsUp/Down, accordion expand)
- `src/components/feed/AgentMessageCard.jsx` — agent message card (RUN / SIGNAL / MARKET / AGENT types)
- `src/components/feed/TonightsRunCard.jsx` — pinned tonight's run summary
- `src/components/feed/MessageInputBar.jsx` — chat input → POST /api/dealfeed/agent/message → Claude Sonnet reply
- `src/styles/feed-layout.css` — ~530 lines covering all the above

### Modified
- `src/App.jsx` — rewrote AppShell with TopHeader + LeftPanel; layout class `has-sidebar`; KPI fetch
- `src/views/DashboardView.jsx` — full social-feed layout (PipelineTimeline + center feed + RightRail)
- `src/views/BuyBoxesView.jsx` — 5-column Kanban (Pending / Validating / Active / Paused / Coverage Gap), drag-and-drop, day-of-week toggles
- `src/lib/format.js` — fixed `scoreClass()` thresholds (0-10 scale, was 0-100)
- `src/styles/tokens.css` — layout vars + dark-mode overrides
- `src/contexts/DealsContext.jsx` — `console.error()` on fetchAll catch (was silent)

### Sprint deliverables (scoutgpt-api)
- `migrations/043_agent_messages.sql` — df_agent_messages chat persistence (UUID FKs)
- `migrations/044_deal_saved.sql` — `saved_at` column on df_deals_sent
- `migrations/045_subscriber_login_security.sql` — adds `failed_login_attempts`, `locked_until`, `reset_token_hash`, `reset_token_expires_at` (idempotent, **NOT YET APPLIED** — see Pending below)
- `routes/dealfeed/agent.js` — GET /messages + POST /message (Claude Sonnet `claude-sonnet-4-6`)
- `routes/dealfeed/deals.js` — PATCH /:id/save toggle, `saved` field in normalizeDeal, `unread_count` in KPIs
- `routes/dealfeed/auth.js` — login + forgot-password + reset-password all use `lockoutColumnsAvailable()` and `resetTokenColumnsAvailable()` lazy probes so missing columns can never 500 the route again
- `routes/dealfeed/index.js` — registered `/agent` route
- `scripts/run_deal_feed.js` — `composeFallbackNarrative(prop)` writes 2-3 sentence factual narrative + `deriveDistressSignals(prop)` writes signal pills (replaces the old `narrative: ''` placeholder)
- `scripts/backfill_brief_narratives.js` — one-off backfill (uses non-pooler Neon endpoint to avoid pool rate limits) — **already ran, 358 deals updated**
- `server.js` — CORS allowlist now includes nightdropai.netlify.app, nightdrop.ai apex/www, and `*--nightdropai.netlify.app` deploy previews

---

## Major bugs hit this session and how they were fixed

1. **Migration 043 schema mismatch** — wrote `subscriber_id INTEGER` but `df_subscribers.id` is UUID. Fixed: `9799c2e`. All df_* tables use UUID; rule documented in CLAUDE.md.
2. **Wrong Render service / wrong Neon DB** — applied migrations against `scoutgpt-api` (free tier, empty DB) and `DATABASE_URL` (property data, no df_* tables). Real production is `scoutgpt-app` + `DATABASE_WRITE_URL`. Documented in topology section of both CLAUDE.md files.
3. **CORS rejected the new frontend domain** — `nightdropai.netlify.app` wasn't in the allowlist (only old `dealrunner.netlify.app` was). Fixed: `6b39e8e`.
4. **Empty feed, only horizontal lines visible** — `.feed-center` is a flex-column with `overflow-y:auto`; default `flex-shrink:1` was crushing every FeedDealCard down to ~20px. Fixed: `3f255cf` adds `flex-shrink:0` to all `.feed-center > *` and `min-height: 220px` to `.feed-deal-image-wrap`.
5. **Asset class lookup miss** — `'Self Storage / Mini-Warehouse'` didn't match `QUICK_FACTS_CONFIG['self_storage']`. Added `normalizeAssetClass()` substring matcher in same commit.
6. **Empty `brief_json.narrative` on every deal** — pipeline writes `narrative: ''` placeholder (the spec called for Claude Sonnet brief generation but it was never wired). Fixed: `be21724` adds `composeFallbackNarrative(prop)` deterministic composer + backfill ran against prod.
7. **Login 500 — schema/code drift** — auth.js SELECTed `failed_login_attempts`, `locked_until`, `reset_token_hash`, `reset_token_expires_at`; none of those columns existed in any migration. Generic catch was hiding the SQL error. Fixed: `61a2d15` + `10cd774` add lazy-detect column probes; `err.stack` now logged; migration 045 in repo for when Neon control-plane lets us apply it.
8. **Google Maps key empty** — `key=` on the static maps URL produced 403s for every card. Fixed: same commit as #4 — read `VITE_GOOGLE_MAPS_KEY`; if absent, omit the `<img>` and use a styled placeholder.

---

## Permanent guardrails added this session

| File | Guards against |
|---|---|
| `~/parcyl/scoutgpt-api/.claude/hookify.df-uuid-and-pool.local.md` | df_* migrations using SERIAL/INTEGER instead of UUID; dealfeed routes using `pool` instead of `poolWrite` |
| `~/parcyl/scoutgpt-api/.claude/hookify.column-existence-check.local.md` | Code referencing a column with no migration; missing `err.stack` in DB catches |
| `~/deal-feed-dashboard/.claude/hookify.uuid-and-backend-target.local.md` | parseInt on UUID dealfeed IDs; hardcoded backend URLs pointing at the wrong Render service |
| `~/.claude/projects/.../memory/project_scoutgpt_topology.md` | Cross-session — explains dual Render + dual Neon layout |
| `~/.claude/projects/.../memory/feedback_flex_shrink_lesson.md` | Cross-session — vertical flex columns must use flex-shrink:0 + min-height |
| `~/.claude/projects/.../memory/feedback_schema_code_drift.md` | Cross-session — column references need migrations or lazy-detect probes |

CLAUDE.md updates in both repos document the topology + rules.

---

## Pending (non-blocking)

1. **Migration 045 not yet applied** — Neon control plane was rate-limiting my IP all afternoon. The route works without it (lazy-detect skips the lockout/reset-token features when columns are absent). To enable: from Render shell on `scoutgpt-app`, run `psql $DATABASE_WRITE_URL -f migrations/045_subscriber_login_security.sql`. After that runs, brute-force lockout (5 failed attempts → 15 min) and the password reset email flow both come online.
2. **Brady's password is `Nightdrop2026!`** — change it from the Settings page once logged in. The password reset email flow requires migration 045 first.
3. **Google Maps API key not set** — feed cards show a styled placeholder instead of an aerial. Set `VITE_GOOGLE_MAPS_KEY` in Netlify env vars and redeploy if you want real maps.
4. **AI brief generation never wired** — the spec called for Claude Sonnet to write `opportunity_narrative` for each deal. Current pipeline uses the deterministic `composeFallbackNarrative()` placeholder. Marked `TODO(brief-ai)` in `scripts/run_deal_feed.js`. Future sprint.
5. **Calendar view falls through to DashboardView** — needs proper date-filtering logic.
6. **Admin/invites views** — old NightdropBar avatar dropdown accessed these; LeftPanel bottom Account button is not yet wired to them.
7. **Render payment-failed banner** — separate billing issue. Update card on file before workspace gets suspended.
8. **scoutgpt-api free-tier service** (deploys from `develop` branch, empty DB) — sitting idle, just adds confusion. Either point it somewhere useful or delete it.

---

## Pre-existing blockers (carried from prior sessions)

- Adam needs to apply ETL enrichment on the Render Neon branch (resolved_asset_type null in some prod rows).
- Test the Admin "Run Now" button on deployed Netlify.

---

## Next session

Apply migration 045 from Render shell, then wire the Calendar date filter and admin/invites routing from the LeftPanel Account button. Or build the Claude Sonnet `opportunity_narrative` generator (replace the deterministic composer).

```
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```
