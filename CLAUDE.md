# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Inherits all rules from ~/.claude/CLAUDE.md. This file adds project context only.

## REPO

Path: ~/deal-feed-dashboard
Deploy: Netlify — auto-deploys from main (`npm run build` → `dist/`)
Start: `cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions`

## PURPOSE

Deal Feed Dashboard is a React SPA for CRE investors to review distressed property deals matched to their buy boxes. Users authenticate, browse their deal feed, inspect deal details (owner info, comps, GIS data, signals), manage buy boxes, and view deals on a Mapbox map. The frontend hits the scoutgpt-api backend at `~/parcyl/scoutgpt-api` via the `/api/dealfeed/*` route namespace.

## STACK

- React 19 + Vite 8 (JSX, no TypeScript)
- react-router-dom v7 (BrowserRouter, Routes/Route)
- react-map-gl v8 + mapbox-gl v3 (Mapbox GL JS)
- Plain CSS (no Tailwind) — design tokens in `src/styles/tokens.css`
- Netlify (SPA redirect via `netlify.toml`)

## COMMANDS

```bash
npm run dev       # dev server at localhost:5173
npm run build     # production build to dist/
npm run lint      # ESLint
npm run preview   # preview production build locally
npm test          # vitest unit tests (src/lib/*.test.js)
npx playwright test           # E2E smoke suite — requires dev server already running
npx playwright test --ui      # Playwright interactive mode
npx playwright show-report    # view last HTML report
```

E2E tests live in `tests/smoke.spec.js`. Story-level regression tests are in `tests/story-4.2-edit-buybox.test.cjs` and `tests/story-4.3-pause-resume-preview.test.cjs` (run with `node`). `playwright.config.js` sets `webServer: null`, so start `npm run dev` in a separate terminal before running Playwright.

## ENV VARS

```
VITE_API_BASE_URL=   # backend base URL (empty = same origin)
VITE_MAPBOX_TOKEN=   # Mapbox public token
```

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
                ParcylBar
                Views (DashboardView / BuyBoxesView / MapView / SettingsView / InviteView)
                DealDetailPage   (/deal/:dealId — standalone, no fromMap state)
                DealDetailModal  (/deal/:dealId — overlay, fromMap state set)
```

`AuthProvider` holds the JWT (stored as `df_token` in localStorage) and the `subscriber` object. `ReadStateProvider`, `DealStateProvider`, and `DealsProvider` are all mounted inside `AppShell` (not at app root). `DealsProvider` exposes `{ deals, buyBoxes, contacts, loading, error, refetch, postFeedback, saveNote, updateStatus, fetchContacts, logContact, patchBuyBox }`.

`AppShell`, `DealDetailPage`, and `DealDetailModal` are all defined in `src/App.jsx` — there are no separate files for them.

### Contexts

| Context | Hook | Storage | Purpose |
|---------|------|---------|---------|
| `DealsContext.jsx` | `useDeals()` | API | Deals, buy boxes, contacts — central data layer |
| `ToastContext.jsx` | `useToast()` | Memory | Fire toast notifications; never render `Toast` directly |
| `ReadStateContext.jsx` | `useReadState()` | localStorage `dealfeed.read.{subId}:{dealId}` | Per-subscriber read/unread tracking |
| `DealStateContext.jsx` | `useDealState()` | localStorage `dealfeed.dealstate.{subId}:{dealId}` | Per-subscriber deal state machine (`active`, `dead`, `loi`, `archived`) |

### Navigation model — hybrid

- Most navigation is **view-state only**: `view` is a string in `AppShell`; sidebar clicks call `setView(...)`. Views: `dashboard`, `map`, `boxes`, `settings`.
- Deal detail is **URL-based**: navigating to a deal calls `navigate('/deal/' + deal.id)`. Two rendering modes exist:
  - **DealDetailPage** — cold load or navigation from any non-map view. Renders full-screen, replacing the view switcher.
  - **DealDetailModal** — opened from MapView via `navigate('/deal/:id', { state: { fromMap: true } })`. Renders as an overlay on top of the still-mounted MapView. Detected by `location.state?.fromMap`.
- Deep-linking to a view is not supported (only `/` and `/deal/:id` are addressable).

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
  lib/                  — pure utilities (api, format, assetColors, wizardHelpers)
  data/                 — static mock data
  styles/               — global CSS and design tokens
```

### Key components

| File | Role |
|------|------|
| `src/components/DealDetail.jsx` | Active full-page deal detail with 12 tabs: Summary, Property Record, Ownership, Financials, Capital Stack, Transactions, Site & Lot, Zoning, Site Context, Risk, Distress, Deal Intel. Styled by `src/styles/deal-detail.css`. |
| `src/components/PropertyDetail.jsx` | **Dead code** — replaced by `DealDetail.jsx`. Not imported anywhere. Do not add features here. |
| `src/components/DealDrawer.jsx` | **Dead code** — not imported anywhere. Do not add features here. |
| `src/components/DealMap.jsx` | Reusable Mapbox map. Auto-fits to deal markers via `fitDeals()`. Props: `deals`, `selectedId`, `hoverId`, `onClickDeal`, `mapStyle`, `withPopup`. |
| `src/components/DealPanel.jsx` | Collapsible sidebar inside MapView listing filtered/sorted deals. Owns filter state, sort, owner-type chips, CSV export. Persists collapsed state to `localStorage` key `dealfeed.mapPanel.collapsed`; filters to `parcyl-deals-filters`. |
| `src/components/DealPanelCard.jsx` | Individual deal card within DealPanel. Expandable inline preview (signals, score, aerial thumb). Calls `onOpenDeal` to navigate to full PropertyDetail. |
| `src/components/DealComponents.jsx` | Shared atoms: `ScoreBubble`, `MapPinSVG`, `DealCard`. `MapPinSVG` uses `getPinColor` from `assetColors.js`. |
| `src/components/Icons.jsx` | Central icon library — exports `I` object with named icons (e.g. `I.Pin`, `I.Alert`, `I.Trend`). Always import icons from here. |
| `src/components/ParcylBar.jsx` | Top nav bar with sidebar links and theme toggle. |
| `src/components/ConfigurationOverlay.jsx` | The active buy box create/edit wizard. Replaces `NewBoxWizard.jsx` in the App.jsx flow. Supports `mode="edit"` + `initialData` props to pre-populate form in edit mode. Uses `wizardHelpers.js` for validation and payload building. Calls `POST /api/dealfeed/buy-boxes/preview` (debounced 400ms) to show match count in review step. |
| `src/components/NewBoxWizard.jsx` | Legacy wizard — defined but no longer imported in `App.jsx`. Do not add features here; use `ConfigurationOverlay.jsx` instead. |
| `src/components/StatusSelector.jsx` | Inline deal status selector; calls `updateStatus` from DealsContext. |
| `src/components/ContactLogModal.jsx` | Modal for logging and viewing contact attempts on a deal; calls `logContact` and `fetchContacts` from DealsContext. |
| `src/components/tabs/DistressTab.jsx` | Extracted tab for Distress Signals — used by `DealDetail.jsx`. |
| `src/components/tabs/MarketTab.jsx` | Extracted tab for Market & Comps — used by `DealDetail.jsx`. |
| `src/components/tabs/OwnershipTab.jsx` | Extracted tab for Ownership & Skip — used by `DealDetail.jsx`. |
| `src/components/tabs/SiteTab.jsx` | Extracted tab for Site & Environmental — used by `DealDetail.jsx`. |
| `src/components/ConfirmModal.jsx` | Generic danger-confirm modal; `kind` prop selects copy. |
| `src/components/AerialThumb.jsx` | Aerial imagery thumbnail shown in deal cards/drawers. |
| `src/components/MapBackground.jsx` | Static Mapbox background used decoratively inside the wizard geography step. |
| `src/components/PipelineTimeline.jsx` | Animated horizontal pipeline timeline on the Dashboard. All layout styles are inlined (no CSS class dependencies) to avoid cascade conflicts with `styles.css`. |
| `src/components/MarketNewsfeed.jsx` | Scrolling market news ticker on the Dashboard. Data sourced from `src/data/marketPulse.json`. |
| `src/components/CalendarModal.jsx` | Modal for scheduling/viewing calendar entries on a deal. |
| `src/components/Toast.jsx` | Toast notification UI driven by `src/contexts/ToastContext.jsx`. Use the `useToast()` hook to fire toasts; never render Toast directly. |
| `src/views/DashboardView.jsx` | Stats + recent deals + map background. Falls back to `MOCK_DEALS` when API returns empty. |
| `src/views/MapView.jsx` | Full-screen Mapbox map + collapsible DealPanel sidebar. This is the primary deal browsing surface (My Deals was merged here). Map style persisted to `parcyl-map-style`; viewport to `parcyl-map-viewport`. |
| `src/views/BuyBoxesView.jsx` | Buy box management table. |
| `src/views/ForgotPasswordView.jsx` | Unauthenticated forgot-password page; submits email to trigger reset link. |
| `src/views/ResetPasswordView.jsx` | Unauthenticated password reset page; consumes token from URL query param. |
| `src/views/InviteView.jsx` | Admin-only invite queue manager. Add contacts by pasting emails (bare or `Name <email>` format), preview parsed list, batch-add to queue, send all unsent in one call. Visible in ParcylBar only when `subscriber.email === 'brady@parcyl.ai'`. |
| `src/views/SettingsView.jsx` | Profile and password settings. |
| `src/lib/format.js` | `fmt(val)` — null-safe display (returns `—` for null/empty/`"null"`). `hasVal(val)`, `fmtMoney(n)` → `$1.2M`/`$420K`. `scoreClass(s)` → `hi/md/lo`. |
| `src/lib/assetColors.js` | `getPinColor(assetClass)` → hex; exports `LEGEND_ITEMS`. |
| `src/lib/wizardHelpers.js` | Pure functions for the buy box wizard: `toNum(v)`, `activeGeoHasData(form)`, `canProceed(step, form)`, `buildPayload(form)`. Fully unit-tested in `wizardHelpers.test.js`. Used by both `ConfigurationOverlay.jsx` and `NewBoxWizard.jsx`. |
| `src/lib/inviteHelpers.js` | Pure functions for the invite flow: `parseInvitesFromText(text)` — parses `Name <email>` or bare email lines; `validateInvite({email, full_name})` — returns error string or null; `dedupeByEmail(invites)` — removes duplicate emails. |
| `src/lib/format.test.js` | Unit tests for `format.js` utilities. Run with `npm test`. |
| `src/views/LoginView.jsx` | Unauthenticated login page; submits to `POST /api/dealfeed/auth/login`. |
| `src/data/mockData.js` | Static fallback data: `DEALS`, `BUY_BOXES`, `COMPS`, `ASSET_CLASSES`. |

### Design system

All design tokens are in `src/styles/tokens.css` (Parcyl brand). Key aliases: `--green` = `#5BCC48`, `--warning` = `#F4B73E`, `--danger` = `#E5484D`. Font: Manrope (sans) + JetBrains Mono. Never hardcode hex colors that map to a token. Theme is toggled via `data-theme` attribute on `<html>`; persisted in `localStorage` as `parcyl-theme`.

## KEY FILES

- `src/contexts/DealsContext.jsx` — central data fetch; touching this breaks all views
- `src/components/DealDetail.jsx` — active full deal detail (12 tabs); powers both page and modal rendering modes
- `src/styles/deal-detail.css` — styles for DealDetail; separate from the main `styles.css`
- `src/components/ConfigurationOverlay.jsx` — active buy box wizard (create + edit); replaces NewBoxWizard in the live flow
- `src/components/DealMap.jsx` — Mapbox integration; `fitDeals()` must fire after `onLoad`, not before
- `src/styles/tokens.css` — source of truth for all colors, spacing, typography
- `src/lib/wizardHelpers.js` — pure helper functions for the wizard: `canProceed(step, form)` step gate logic, `buildPayload(form)` API payload builder, `toNum(v)` null-safe numeric converter

## KNOWN LANDMINES

- `DealMap` calls `fitDeals` inside `onLoad` AND in a `useEffect` gated on `mapLoaded`. Both are needed; removing either breaks auto-fit on mount vs. data change.
- `fmt()` must be used on any field that might arrive as the string `"null"` or `"undefined"` from the API — the backend occasionally serializes nulls as strings.
- `COMPS` in `DealDrawer` is still static mock data from `mockData.js` — not yet wired to the API.
- `DashboardView` silently falls back to `MOCK_DEALS` when the API returns an empty array. A subscriber with zero real deals will see fake data.
- `saveNote` in `DealsContext` does an optimistic update but does NOT catch errors — a failed PATCH leaves stale UI state with no user feedback.
- `ConfigurationOverlay` backdrop has no onClick close handler — intentional to prevent accidental dismissal mid-flow.
- `POST /api/dealfeed/buy-boxes/preview` is called by `ConfigurationOverlay` on every form change (debounced). If this route does not exist on the backend, preview count fails silently — no error is surfaced to the user.
- `NewBoxWizard.jsx` is dead code — defined but not imported anywhere. Do not maintain it.
- `PropertyDetail.jsx` is dead code — replaced by `DealDetail.jsx`. Not imported anywhere. Do not maintain it.
- `DealDrawer.jsx` is dead code — not imported anywhere. Do not maintain it.

## BACKEND CONTRACT

Backend repo: `~/parcyl/scoutgpt-api`
Relevant routes: `routes/dealfeed/auth.js`, `routes/dealfeed/deals.js`

Key endpoints:
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
