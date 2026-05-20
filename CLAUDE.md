# CLAUDE.md

Inherits all rules from ~/.claude/CLAUDE.md. This file adds project context only.

## REPO

Path: ~/nightdrop-dashboard
Deploy: Netlify — auto-deploys from main (`npm run build` → `dist/`)
Production URL: https://nightdropai.netlify.app
Start: `cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions`

## PURPOSE

Nightdrop Dashboard is a React SPA for CRE investors to review distressed property deals matched to their buy boxes. Users authenticate, browse their deal feed, inspect deal details, manage buy boxes, and view deals on a Mapbox map. Frontend hits the nightdrop-api backend at `~/nightdrop-api` (Render service `nightdrop-api`) via `/api/dealfeed/*`.

## STACK

- React 19 + Vite 8 (JSX, no TypeScript)
- react-router-dom v7 (BrowserRouter, Routes/Route)
- react-map-gl v8 + mapbox-gl v3
- lucide-react (TopHeader + AdminView only; all other icons via `Icons.jsx`)
- Plain CSS (no Tailwind) — design tokens in `src/styles/tokens.css`
- Netlify (SPA redirect via `netlify.toml`)

## COMMANDS

```bash
npm run dev       # dev server at localhost:5173
npm run build     # production build to dist/
npm run lint      # ESLint
npm test          # vitest unit tests — single run
npx playwright test           # E2E smoke suite (start dev server first)
npx playwright test --ui      # Playwright interactive mode
```

E2E tests: `tests/smoke.spec.js`. `playwright.config.js` sets `webServer: null` — start dev server separately.

## ENV VARS

```
VITE_API_BASE_URL=   # empty = same origin, routes through Vite proxy
VITE_MAPBOX_TOKEN=   # Mapbox public token
```

`.env.development` is committed with `VITE_API_BASE_URL=` empty, so dev routes through the Vite proxy. The Vite proxy target defaults to `https://nightdrop-api.onrender.com` (see `vite.config.js` `API_TARGET`). Override per-shell with `API_TARGET=http://localhost:3001 npm run dev` to point at a local backend. `.env` is gitignored; if you keep a local `.env` with a different `VITE_API_BASE_URL`, it will override `.env.development` and bypass the Vite proxy entirely.

## ARCHITECTURE

### Provider hierarchy

```
BrowserRouter
  AuthProvider           (src/hooks/useAuth.jsx)
    ToastProvider        (src/contexts/ToastContext.jsx)
      App                (src/App.jsx — also defines AppShell, DealDetailPage, DealDetailModal inline)
        AppShell         (holds view state)
          ReadStateProvider / DealStateProvider / DealsProvider
            TopHeader | LeftPanel | Views | DealDetailPage | DealDetailModal
```

`AppShell`, `DealDetailPage`, and `DealDetailModal` are all defined in `src/App.jsx` — no separate files.

### Contexts

| Context | Hook | Purpose |
|---------|------|---------|
| `DealsContext.jsx` | `useDeals()` | Deals, buy boxes, contacts — central data layer |
| `ToastContext.jsx` | `useToast()` | Fire toasts; never render `Toast` directly |
| `ReadStateContext.jsx` | `useReadState()` | localStorage read/unread per subscriber |
| `DealStateContext.jsx` | `useDealState()` | localStorage deal state machine per subscriber |

### Navigation — hybrid

- Most navigation is **view-state only**: `view` string in AppShell, `setView(...)` on sidebar clicks.
- Deal detail is **URL-based**: `navigate('/deal/' + deal.id)`. Two modes: DealDetailPage (full-screen) vs DealDetailModal (overlay from MapView, detected by `location.state?.fromMap`).
- Admin/invites views gated to `subscriber.email === 'brady@parcyl.ai'`.

### API layer

All requests through `src/lib/api.js` `request()`. Use `api.get/post/patch/delete` everywhere — never call `fetch` directly.

## KEY FILES

> Full component and endpoint reference: `notes/REFERENCE.md`

Dangerous files — edit carefully:
- `src/App.jsx` — AppShell + DealDetailPage + DealDetailModal + all modal state; 400+ lines
- `src/contexts/DealsContext.jsx` — central data fetch; breaking this breaks all views
- `src/styles/styles.css` — ~3,900 lines; global overrides
- `src/styles/feed-layout.css` — ~2,300 lines; Dashboard three-column layout
- `src/styles/deal-detail.css` — ~1,150 lines
- `src/lib/wizardHelpers.js` — `canProceedStep()`, `buildPayload()`, `toFormState()` — heavily unit tested but currently ORPHANED. The active wizard (`BuyBoxWizard.jsx`) re-implements all this logic inline as `NATIVE_FORM` / `nativeToPayload` / `toNativeForm`. Only consumer of `wizardHelpers` is the also-orphaned `BuyBoxEditModal.jsx`. Two parallel mappers; do not assume one reflects the other.

## KNOWN LANDMINES

- `DealMap` calls `fitDeals` inside `onLoad` AND in a `useEffect` gated on `mapLoaded`. Both are needed. Removing either breaks auto-fit.
- `fmt()` must wrap any field that might arrive as the string `"null"` — backend serializes nulls as strings.
- `DashboardView` silently falls back to `MOCK_DEALS` when API returns empty. Zero-deal subscribers see fake data.
- `saveNote` does optimistic update with no error catch — failed PATCH leaves stale UI with no feedback.
- `BuyBoxWizard` backdrop has no onClick close — intentional, prevents accidental mid-flow dismissal.
- `POST /api/dealfeed/buy-boxes/preview` may not exist on backend yet — fails silently.
- Playwright tests hardcoded to port 5173. Kill other Vite instances before running.
- **Geo is mutually exclusive on the backend.** `matchProperties()` in `~/nightdrop-api/scripts/run_deal_feed.js:229` checks geo modes in priority order: **county > city > zip > radius > state**. Only one mode is active per box; selecting counties REPLACES city/zip/state filtering, not adds to it. The wizard UI lets users multi-select all four — that data is persisted, but only the highest-priority non-empty mode actually narrows results.
- Design tokens: `--green=#5BCC48`, `--warning=#F4B73E`, `--danger=#E5484D`. Never hardcode these hex values.
- Font: Manrope (sans). No JetBrains Mono anywhere — banned.

## LOCAL HOOKIFY RULES

| Rule file | Trigger | Warning |
|-----------|---------|---------|
| `hookify.wizard-matcher-drift.local.md` | `wizardHelpers.js` or `run_deal_feed.js` | Geo contract drift |
| `hookify.silent-zero-results.local.md` | `run_deal_feed.js` | Zero-match logging |
| `hookify.unregistered-routes.local.md` | New route files | Register in `server.js` |
| `hookify.orphaned-scripts.local.md` | New scripts | Add npm script or cron |
| `hookify.uuid-and-backend-target.local.md` | ID cast or hardcoded URL | IDs are UUIDs; backend is `nightdrop-api` (review this rule — historical copy may still reference `scoutgpt-app`) |

## BACKEND CONTRACT

Backend repo: `~/nightdrop-api` (GitHub: `Syndnet-CRE/nightdrop-api`, branch `main`).
Render service: **`nightdrop-api`** at **`https://nightdrop-api.onrender.com`**.

The Vite dev proxy default in `vite.config.js` already points here. Production builds inline whatever `VITE_API_BASE_URL` Netlify is configured with — verify in the Netlify env settings, not in local `.env` files.

> Historical note: earlier docs referenced `~/parcyl/scoutgpt-api` and `scoutgpt-app.onrender.com`. That backend is no longer the production target for nightdrop-dashboard. Some local `.env` files, Netlify env vars, and hookify rules may still carry the old URL — treat any sighting as drift to fix.

Key paths inside `~/nightdrop-api`:
- `routes/dealfeed/*.js` — REST endpoints (`auth`, `buyboxes`, `onboarding`, `admin`)
- `scripts/run_deal_feed.js` — the matcher; `matchProperties(box, limit)` at line 181

**DB rules**: All `df_*` tables live on `$DATABASE_WRITE_URL` via `poolWrite`. All `df_*` IDs are **UUID strings** — never `parseInt()` them.

> Full endpoint list: `notes/REFERENCE.md`

Core endpoints:
- `POST /api/dealfeed/auth/login` → `{ token, subscriber }`
- `GET /api/dealfeed/deals` → `{ deals: Deal[] }`
- `GET /api/dealfeed/buy-boxes` → `{ buy_boxes: BuyBox[] }`
- `PATCH /api/dealfeed/buy-boxes/:id` → pause/resume/edit
- `POST /api/dealfeed/buy-boxes/preview` → `{ count }` (may not exist yet)

## BMAD + HANDOFF

Planning docs: `notes/bmad/` (project-local). Active folders: `buy-box-wizard`, `subscriber-invite`, `snowflake-sync`, `b-plus-roadmap`.
Session handoff: `notes/HANDOFF.md` (project-local — not `~/parcyl/notes/HANDOFF.md`).
Archived CLAUDE.md versions: `notes/CLAUDE.archive/`.
