# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Inherits all rules from ~/.claude/CLAUDE.md. This file adds project context only.

## REPO

Path: ~/deal-feed-dashboard
Deploy: Netlify — auto-deploys from main (`npm run build` → `dist/`)
Production URL: https://nightdropai.netlify.app (CORS-allowlisted on the backend; `dealrunner.netlify.app` is the legacy URL, still allowlisted but not the primary domain)
Start: `cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions`

## PURPOSE

Deal Feed Dashboard is a React SPA for CRE investors to review distressed property deals matched to their buy boxes. Users authenticate, browse their deal feed, inspect deal details (owner info, comps, GIS data, signals), manage buy boxes, and view deals on a Mapbox map. The frontend hits the scoutgpt-api backend at `~/parcyl/scoutgpt-api` via the `/api/dealfeed/*` route namespace.

## STACK

- React 19 + Vite 8 (JSX, no TypeScript)
- react-router-dom v7 (BrowserRouter, Routes/Route)
- react-map-gl v8 + mapbox-gl v3 (Mapbox GL JS)
- lucide-react (used directly in TopHeader + AdminView; most icons live in `Icons.jsx`)
- Plain CSS (no Tailwind) — design tokens in `src/styles/tokens.css`
- Netlify (SPA redirect via `netlify.toml`)

## COMMANDS

```bash
npm run dev       # dev server at localhost:5173
npm run build     # production build to dist/
npm run lint      # ESLint
npm run preview   # preview production build locally
npm test          # vitest unit tests (src/lib/*.test.js) — single run
npm run knip      # dead code / unused exports report
npx vitest        # vitest in watch mode (interactive, re-runs on save)
npx vitest run src/lib/wizardHelpers.test.js   # run a single test file
npx playwright test           # E2E smoke suite — requires dev server already running
npx playwright test --ui      # Playwright interactive mode
npx playwright show-report    # view last HTML report
```

E2E tests live in `tests/smoke.spec.js`. Story-level regression tests are in `tests/story-4.2-edit-buybox.test.cjs` and `tests/story-4.3-pause-resume-preview.test.cjs` (run with `node`). `playwright.config.js` sets `webServer: null`, so start `npm run dev` in a separate terminal before running Playwright.

## ENV VARS

```
VITE_API_BASE_URL=   # backend base URL (empty = same origin, uses Vite proxy)
VITE_MAPBOX_TOKEN=   # Mapbox public token
```

Dev setup: copy `.env.example` to `.env` and fill in values. `.env` is gitignored.
`.env.development` is committed and sets `VITE_API_BASE_URL=` so dev traffic routes through the Vite proxy (which targets `scoutgpt-app.onrender.com`). Playwright tests also hit prod via this proxy — use a test account or the bypass email list to avoid rate limits.

CI requires a `VITE_MAPBOX_TOKEN` GitHub secret (Repo settings → Secrets → Actions).

## ARCHITECTURE

### Provider hierarchy (main.jsx)

```
BrowserRouter
  AuthProvider           (src/hooks/useAuth.jsx)
    ToastProvider        (src/contexts/ToastContext.jsx)
      App                (src/App.jsx — also defines AppShell, DealDetailPage, DealDetailModal inline)
        AppShell         (holds view state)
          ReadStateProvider   (src/contexts/ReadStateContext.jsx)
            DealStateProvider (src/contexts/DealStateContext.jsx)
              DealsProvider   (src/contexts/DealsContext.jsx)
                TopHeader
                LeftPanel
                Views (DashboardView / BuyBoxesView / MapView / SettingsView / InviteView / AdminView)
                DealDetailPage   (/deal/:dealId — standalone, no fromMap state)
                DealDetailModal  (/deal/:dealId — overlay, fromMap state set)
```

`AuthProvider` holds the JWT (stored as `nd_token` in localStorage) and the `subscriber` object. `ReadStateProvider`, `DealStateProvider`, and `DealsProvider` are all mounted inside `AppShell` (not at app root). `DealsProvider` exposes `{ deals, buyBoxes, contacts, loading, error, refetch, postFeedback, saveNote, updateStatus, fetchContacts, logContact, patchBuyBox }`.

`AppShell`, `DealDetailPage`, and `DealDetailModal` are all defined in `src/App.jsx` — there are no separate files for them.

### Contexts

| Context | Hook | Storage | Purpose |
|---------|------|---------|---------|
| `DealsContext.jsx` | `useDeals()` | API | Deals, buy boxes, contacts — central data layer |
| `ToastContext.jsx` | `useToast()` | Memory | Fire toast notifications; never render `Toast` directly |
| `ReadStateContext.jsx` | `useReadState()` | localStorage `dealfeed.read.{subId}:{dealId}` | Per-subscriber read/unread tracking |
| `DealStateContext.jsx` | `useDealState()` | localStorage `dealfeed.dealstate.{subId}:{dealId}` | Per-subscriber deal state machine (`active`, `dead`, `loi`, `archived`) |

### Navigation model — hybrid

- Most navigation is **view-state only**: `view` is a string in `AppShell`; sidebar clicks call `setView(...)`. Primary sidebar views: `dashboard`, `map`, `boxes`, `settings`. AppShell also owns all wizard/modal state: `showWizard`, `editingBuyBox`, `pausingBuyBox`, `confirmDanger`.
- **Avatar dropdown views**: `invites` and `admin` are accessed via the avatar menu in the top-right of TopHeader. Both are gated to `isAdmin` (`subscriber.email === 'brady@parcyl.ai'`).
- Deal detail is **URL-based**: navigating to a deal calls `navigate('/deal/' + deal.id)`. Two rendering modes exist:
  - **DealDetailPage** — cold load or navigation from any non-map view. Renders full-screen, replacing the view switcher.
  - **DealDetailModal** — opened from MapView via `navigate('/deal/:id', { state: { fromMap: true } })`. Renders as an overlay on top of the still-mounted MapView. Detected by `location.state?.fromMap`.
- **Invite claim** is URL-based at `/invite/:token` — rendered by `InviteClaimView` outside the authenticated `AppShell`.
- Deep-linking to a view is not supported (only `/`, `/deal/:id`, and `/invite/:token` are addressable).

### API layer (src/lib/api.js)

All requests go through a single `request()` function that injects the Bearer token and handles 401 (clear token + redirect to `/login`). Use `api.get/post/patch/delete` everywhere; never call `fetch` directly.

### File layout

```
src/
  App.jsx               — root component; also contains AppShell and DealDetailRoute
  main.jsx              — mounts BrowserRouter + AuthProvider
  views/                — full-page view components (one per nav item)
  components/           — shared/reusable UI components
  contexts/             — React context providers
  hooks/                — custom hooks (useAuth)
  lib/                  — pure utilities (api, format, wizardHelpers, inviteHelpers, buyBoxTaxonomy)
  data/                 — static mock data
  styles/               — global CSS and design tokens
```

### Key components

| File | Role |
|------|------|
| `src/components/TopHeader.jsx` | Active top nav bar — logo, view links, theme toggle, avatar dropdown. Imported directly in App.jsx. |
| `src/components/LeftPanel.jsx` | Active left sidebar panel — navigation links, TonightsRunCard. Imported in App.jsx. |
| `src/components/DealDetail.jsx` | Active full-page deal detail with 12 tabs: Summary, Property Record, Ownership, Financials, Capital Stack, Transactions, Site & Lot, Zoning, Site Context, Risk, Distress, Deal Intel. Styled by `src/styles/deal-detail.css`. |
| `src/components/DealMap.jsx` | Reusable Mapbox map. Auto-fits to deal markers via `fitDeals()`. Props: `deals`, `selectedId`, `hoverId`, `onClickDeal`, `mapStyle`, `withPopup`. |
| `src/components/DealPanel.jsx` | Collapsible sidebar inside MapView listing filtered/sorted deals. Owns filter state, sort, owner-type chips, CSV export. Persists collapsed state to `localStorage` key `dealfeed.mapPanel.collapsed`; filters to `parcyl-deals-filters`. |
| `src/components/DealPanelCard.jsx` | Individual deal card within DealPanel. Expandable inline preview (signals, score, aerial thumb). Calls `onOpenDeal` to navigate to full deal detail. |
| `src/components/DealComponents.jsx` | Shared atoms: `ScoreBubble`, `MapPinSVG`, `DealCard`. Pin colors are computed inline via `getAssetChipStyle()`. |
| `src/components/Icons.jsx` | Central icon library — exports `I` object with named icons (e.g. `I.Pin`, `I.Alert`, `I.Trend`). Always import icons from here. |
| `src/components/BuyBoxWizard.jsx` | Active buy box create/edit wizard. Imported in App.jsx. Multi-page: uses BuyBoxPage1, BuyBoxPage2/3 (from BuyBoxPage23.jsx), BuyBoxPage4, BuyBoxPage5, BuyBoxPage6, BuyBoxRightRail. Styled by `buy-box-wizard.css` and `buy-box-wizard-pages.css`. |
| `src/components/BuyBoxPage1.jsx` | Wizard page 1 — imported by BuyBoxWizard. |
| `src/components/BuyBoxPage23.jsx` | Wizard pages 2 and 3 — exports `BuyBoxPage2` and `BuyBoxPage3`. |
| `src/components/BuyBoxPage4.jsx` | Wizard page 4 — imported by BuyBoxWizard. |
| `src/components/BuyBoxPage5.jsx` | Wizard page 5 — imported by BuyBoxWizard. |
| `src/components/BuyBoxPage6.jsx` | Wizard page 6 — imported by BuyBoxWizard. |
| `src/components/BuyBoxRightRail.jsx` | Right rail shown inside the buy box wizard. Imported by BuyBoxWizard. |
| `src/components/buybox-icons.jsx` | Icon set specific to the buy box wizard; exports `Ic`. |
| `src/components/LeftRail.jsx` | Left filter rail in DashboardView — filter chips, sort controls. Imported by DashboardView. |
| `src/components/RightRail.jsx` | Right rail in DashboardView — Mapbox map panel or contextual info. Imported by DashboardView. |
| `src/components/feed/FeedDealCard.jsx` | Deal card used in the Dashboard feed. Uses ScoreBadge, OverflowMenu, DealChatThread. |
| `src/components/feed/WeekDayTabs.jsx` | Week-day navigation bar above the deal feed. Shows Sun–Sat for current week, deal count badges per day, click to filter, today indicator. Imported by DashboardView. |
| `src/components/feed/DealChatThread.jsx` | Inline chat thread on a deal card. Imported by FeedDealCard. |
| `src/components/feed/ChatFab.jsx` | Floating action button to open the agent chat. Imported by DashboardView. |
| `src/components/feed/AgentMessageCard.jsx` | Renders an individual agent message in the chat feed. Imported by DashboardView. |
| `src/components/feed/MessageInputBar.jsx` | Chat input bar. Imported by ChatFab. |
| `src/components/feed/TonightsRunCard.jsx` | Card showing tonight's deal run status. Imported by LeftPanel and LeftRail. |
| `src/components/ScoreBadge.jsx` | Deal score badge component. Imported by FeedDealCard. |
| `src/components/OverflowMenu.jsx` | Three-dot overflow menu on deal cards. Imported by FeedDealCard. |
| `src/components/ContactLogModal.jsx` | Modal for logging and viewing contact attempts on a deal; calls `logContact` and `fetchContacts` from DealsContext. |
| `src/components/BulkActionBar.jsx` | Bulk action toolbar shown in DealPanel when deals are selected. Props: `count`, `onStatus`, `onFeedback`, `onExport`, `onClear`. |
| `src/components/ConfirmModal.jsx` | Generic danger-confirm modal; `kind` prop selects copy. |
| `src/components/AerialThumb.jsx` | Aerial imagery thumbnail shown in deal cards/drawers. |
| `src/components/PipelineTimeline.jsx` | Animated horizontal pipeline timeline on the Dashboard. All layout styles are inlined (no CSS class dependencies) to avoid cascade conflicts with `styles.css`. |
| `src/components/MarketNewsfeed.jsx` | Scrolling market news ticker on the Dashboard. Data sourced from `src/data/marketPulse.json`. |
| `src/components/Toast.jsx` | Toast notification UI driven by `src/contexts/ToastContext.jsx`. Use the `useToast()` hook to fire toasts; never render Toast directly. |
| `src/views/DashboardView.jsx` | Main deal feed view: LeftRail + center feed (WeekDayTabs + FeedDealCards + AgentMessageCards) + RightRail + ChatFab. Falls back to `MOCK_DEALS` when API returns empty. |
| `src/views/MapView.jsx` | Full-screen Mapbox map + collapsible DealPanel sidebar. This is the primary deal browsing surface (My Deals was merged here). Map style persisted to `parcyl-map-style`; viewport to `parcyl-map-viewport`. |
| `src/views/BuyBoxesView.jsx` | Buy box management table. |
| `src/views/ForgotPasswordView.jsx` | Unauthenticated forgot-password page; submits email to trigger reset link. |
| `src/views/ResetPasswordView.jsx` | Unauthenticated password reset page; consumes token from URL query param. |
| `src/views/InviteView.jsx` | Admin-only invite queue manager. Add contacts by pasting emails (bare or `Name <email>` format), preview parsed list, batch-add to queue, send all unsent in one call. Accessible via avatar dropdown when `isAdmin`. |
| `src/views/AdminView.jsx` | Admin dashboard: subscriber list with status pills, per-subscriber detail drawer, agent run history, and a "Trigger Run Now" button. Accessible via avatar dropdown when `isAdmin`. Styled by `src/styles/admin.css`. |
| `src/views/InviteClaimView.jsx` | Unauthenticated view at `/invite/:token`. Validates the token via `GET /api/dealfeed/auth/invite/:token`, collects `full_name` + password, and activates the account. |
| `src/views/SettingsView.jsx` | Profile and password settings. |
| `src/lib/format.js` | `fmt(val)` — null-safe display (returns `—` for null/empty/`"null"`). `hasVal(val)`, `fmtMoney(n)` → `$1.2M`/`$420K`. `scoreClass(s)` → `hi/md/lo`. |
| `src/lib/buyBoxTaxonomy.js` | Taxonomy data for buy box asset classes and property types. Used by the wizard. |
| `src/lib/wizardHelpers.js` | Pure functions for the buy box wizard: `toNum(v)`, `activeGeoHasData(form)`, `canProceed(step, form)`, `buildPayload(form)`. Fully unit-tested in `wizardHelpers.test.js`. Used by `BuyBoxWizard.jsx`. |
| `src/lib/inviteHelpers.js` | Pure functions for the invite flow: `parseInvitesFromText(text)` — parses `Name <email>` or bare email lines; `validateInvite({email, full_name})` — returns error string or null; `dedupeByEmail(invites)` — removes duplicate emails. |
| `src/lib/format.test.js` | Unit tests for `format.js` utilities. Run with `npm test`. |
| `src/views/LoginView.jsx` | Unauthenticated login page; submits to `POST /api/dealfeed/auth/login`. |
| `src/data/mockData.js` | Static fallback data: `DEALS`, `BUY_BOXES`, `COMPS`, `ASSET_CLASSES`. |

### Design system

All design tokens are in `src/styles/tokens.css` (Parcyl brand). Key aliases: `--green` = `#5BCC48`, `--warning` = `#F4B73E`, `--danger` = `#E5484D`. Font: Manrope (sans) + JetBrains Mono. Never hardcode hex colors that map to a token. Theme is toggled via `data-theme` attribute on `<html>`; persisted in `localStorage` as `nightdrop-theme`.

## KEY FILES

- `src/App.jsx` — defines AppShell, DealDetailPage, DealDetailModal, and all wizard/modal state; over 400 lines, edit carefully
- `src/contexts/DealsContext.jsx` — central data fetch; touching this breaks all views
- `src/components/DealDetail.jsx` — active full deal detail (12 tabs); powers both page and modal rendering modes
- `src/styles/styles.css` — global app styles; ~3,900 lines; most component overrides live here
- `src/styles/deal-detail.css` — styles for DealDetail; ~1,150 lines; separate from styles.css
- `src/styles/feed-layout.css` — Dashboard three-column layout (LeftRail, feed-center-col, RightRail, WeekDayTabs); ~2,300 lines
- `src/styles/buy-box-wizard.css` + `buy-box-wizard-pages.css` — wizard chrome and per-page styles
- `src/styles/admin.css` — AdminView styles; ~530 lines; separate from styles.css
- `src/styles/tokens.css` — source of truth for all colors, spacing, typography
- `src/components/BuyBoxWizard.jsx` — active buy box wizard (create + edit); imported in App.jsx; multi-page flow across BuyBoxPage1–6
- `src/components/DealMap.jsx` — Mapbox integration; `fitDeals()` must fire after `onLoad`, not before
- `src/lib/wizardHelpers.js` — pure helper functions for the wizard: `canProceed(step, form)` step gate logic, `buildPayload(form)` API payload builder, `toNum(v)` null-safe numeric converter

## KNOWN LANDMINES

- `DealMap` calls `fitDeals` inside `onLoad` AND in a `useEffect` gated on `mapLoaded`. Both are needed; removing either breaks auto-fit on mount vs. data change.
- `fmt()` must be used on any field that might arrive as the string `"null"` or `"undefined"` from the API — the backend occasionally serializes nulls as strings.
- `COMPS` in `mockData.js` is still static mock data — the comps section in deal detail is not yet wired to a live API endpoint.
- `DashboardView` silently falls back to `MOCK_DEALS` when the API returns an empty array. A subscriber with zero real deals will see fake data.
- `saveNote` in `DealsContext` does an optimistic update but does NOT catch errors — a failed PATCH leaves stale UI state with no user feedback.
- `BuyBoxWizard` backdrop has no onClick close handler — intentional to prevent accidental dismissal mid-flow.
- `POST /api/dealfeed/buy-boxes/preview` is called by `BuyBoxWizard` on every form change (debounced). If this route does not exist on the backend, preview count fails silently — no error is surfaced to the user.
- Playwright smoke tests are hardcoded to port 5173. If another Vite instance is already running, the dev server starts on 5180+ and smoke tests fail with connection refused. Kill other Vite instances before running Playwright.
- All Playwright tests run against the production backend via the Vite proxy. Use `RATE_LIMIT_BYPASS_EMAILS` on Render to avoid locking out real user accounts during test runs.
- **Geo contract drift** — `buildPayload()` in `wizardHelpers.js` serializes `geo_cities`, `geo_zips`, and `geo_radius_*` to the DB, but the backend `matchProperties()` in `scoutgpt-api/scripts/run_deal_feed.js` only reads `geo_states` and `geo_counties`. Adding new geo modes to the wizard without updating the matcher causes silent zero-deal delivery. If you touch either file, verify both sides stay in sync. The local hookify rule `.claude/hookify.wizard-matcher-drift.local.md` will warn you.

## LOCAL HOOKIFY RULES

Project-specific guardrails live in `.claude/hookify.*.local.md`. Active rules:

| Rule file | Trigger | Warning |
|-----------|---------|---------|
| `hookify.wizard-matcher-drift.local.md` | `wizardHelpers.js` or `run_deal_feed.js` edited | Geo contract: wizard save fields must match backend matcher fields |
| `hookify.silent-zero-results.local.md` | `run_deal_feed.js` edited | Verify zero-match runs are distinguishable from successful runs in logs |
| `hookify.unregistered-routes.local.md` | New route files created | Register routes in `server.js` |
| `hookify.orphaned-scripts.local.md` | New scripts created | Add npm script or cron entry so the script is actually callable |
| `hookify.uuid-and-backend-target.local.md` | Code casts ID to number or hardcodes backend URL | Dealfeed IDs are UUID strings; production backend is scoutgpt-app.onrender.com (NOT scoutgpt-api.onrender.com) |

## BMAD PLANNING DOCS

Feature planning docs live in `notes/bmad/` (project-local, not `~/parcyl/notes/`). Active folders: `buy-box-wizard`, `subscriber-invite`, `snowflake-sync`, `b-plus-roadmap`.

Session handoff lives at `notes/HANDOFF.md` (project-local). The global rule references `~/parcyl/notes/HANDOFF.md` — for this repo, use `notes/HANDOFF.md` instead.

## BACKEND CONTRACT

Backend repo: `~/parcyl/scoutgpt-api`
Relevant routes: `routes/dealfeed/auth.js`, `routes/dealfeed/deals.js`, `routes/dealfeed/agent.js`

### Backend topology — read this before debugging any "API broken" issue

The scoutgpt-api repo is deployed to **two** Render services off the same GitHub repo:

| Render service | Branch | URL | Used by this frontend? |
|---|---|---|---|
| **scoutgpt-app** | `main` | https://scoutgpt-app.onrender.com | **YES — production** |
| scoutgpt-api    | `develop` | https://scoutgpt-api.onrender.com | NO — empty DB, dev/scratch only |

When pushing backend changes, push to `main` so they land on `scoutgpt-app`. When opening a Render shell to apply a migration or inspect logs, open it on **scoutgpt-app**, never on scoutgpt-api — the latter has an empty Neon DB and will mislead you into thinking tables don't exist.

### Database identity rules

- All `df_*` tables (`df_subscribers`, `df_deals_sent`, `df_buy_boxes`, `df_deal_notes`, `df_contacts`, `df_invite_tokens`, `df_agent_runs`, `df_agent_messages`) live on `$DATABASE_WRITE_URL` (the `weathered-poetry` Neon endpoint), NOT `$DATABASE_URL`. Backend code accesses them via `poolWrite` from `db/pool.js`.
- All `df_*` primary keys are **UUID strings**, not integers. Subscriber IDs and deal IDs in JWT payloads, URL params, and API responses are UUIDs. Never `parseInt()` or `Number()` them anywhere in the frontend.
- The `subscriber` object returned by `/auth/me` and `/auth/login` has `subscriber.id` as a UUID string.

### Endpoints

- `POST /api/dealfeed/auth/login` → `{ token, subscriber }`
- `GET /api/dealfeed/auth/me` → `{ subscriber }`
- `GET /api/dealfeed/deals` → `{ deals: Deal[] }` — each deal may include `brief_json` and `notes` fields
- `GET /api/dealfeed/buy-boxes` → `{ buy_boxes: BuyBox[] }`
- `POST /api/dealfeed/deals/:id/feedback` → body `{ feedback: "hot" | "no" | null }`
- `PATCH /api/dealfeed/deals/:id/notes` → body `{ notes: string }`
- `PATCH /api/dealfeed/deals/:id/status` → body `{ status: string }`
- `GET /api/dealfeed/deals/:id/contacts` → `{ contacts: ContactLog[] }`
- `POST /api/dealfeed/deals/:id/contacts` → body `{ method, note, ... }` → `{ contact }`
- `PATCH /api/dealfeed/buy-boxes/:id` → body `{ status, ... }` — used for pause/resume and edit
- `POST /api/dealfeed/buy-boxes/preview` → body is a buy box payload → `{ count: number }` (may not exist yet on backend)
- `PATCH /api/dealfeed/auth/me` → update profile
- `POST /api/dealfeed/auth/change-password`
- `GET /api/dealfeed/invites` → `{ invites: Invite[] }` (admin only)
- `POST /api/dealfeed/invites` → body `{ invites: [{email, full_name}] }` → `{ added, skipped }`
- `POST /api/dealfeed/invites/send` → sends all unsent invites → `{ sent, failed }`
- `DELETE /api/dealfeed/invites/:id` → removes invite from queue
- `GET /api/dealfeed/auth/invite/:token` → validates invite token → `{ email }` (unauthenticated)
- `POST /api/dealfeed/auth/invite/:token/claim` → body `{ full_name, password }` → activates account (unauthenticated)
- `GET /api/dealfeed/admin/subscribers` → `{ subscribers: Subscriber[] }` (admin only)
- `GET /api/dealfeed/admin/subscribers/:id` → `{ subscriber }` with full detail (admin only)
- `GET /api/dealfeed/admin/runs` → `{ runs: AgentRun[] }` (admin only)
- `POST /api/dealfeed/admin/runs/trigger` → triggers a deal-feed agent run (admin only)
- `GET /api/dealfeed/agent/messages` → `{ messages: AgentMessage[] }` — chat history (newest first reversed to oldest first)
- `POST /api/dealfeed/agent/message` → body `{ content: string, deal_id?: uuid }` → `{ reply: string }` — sends user message, persists both user and agent messages, returns Claude Sonnet reply
- `PATCH /api/dealfeed/deals/:id/save` → toggles `saved_at` on the deal → `{ id, saved: boolean }`
- `PATCH /api/dealfeed/deals/:id/read` → marks deal read → `{ ok: true }`
