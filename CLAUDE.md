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
```

No test suite is currently configured.

## ENV VARS

```
VITE_API_BASE_URL=   # backend base URL (empty = same origin)
VITE_MAPBOX_TOKEN=   # Mapbox public token
```

## ARCHITECTURE

### Provider hierarchy (main.jsx)

```
BrowserRouter
  AuthProvider        (src/hooks/useAuth.jsx)
    App
      AppShell        (holds view state + DealsProvider)
        ParcylBar
        Views (DashboardView / MyDealsView / BuyBoxesView / MapView / SettingsView)
        PropertyDetail (via /deal/:dealId URL route)
        DealDrawer     (slide-over, used within feed views)
```

`AuthProvider` holds the JWT (stored as `df_token` in localStorage) and the `subscriber` object. `DealsProvider` fetches `/api/dealfeed/deals` and `/api/dealfeed/buy-boxes` in parallel on mount and exposes `{ deals, buyBoxes, loading, error, refetch, postFeedback, saveNote }`.

### Navigation model — hybrid

- Most navigation is **view-state only**: `view` is a string in `AppShell`; sidebar clicks call `setView(...)`. Views: `dashboard`, `deals`, `map`, `boxes`, `settings`.
- Deal detail is **URL-based**: navigating to a deal calls `navigate('/deal/' + deal.id)`. `DealDetailRoute` reads `dealId` from params and renders `PropertyDetail`.
- Deep-linking to a view is not supported (only `/` and `/deal/:id` are addressable).

### API layer (src/lib/api.js)

All requests go through a single `request()` function that injects the Bearer token and handles 401 (clear token + redirect to `/login`). Use `api.get/post/patch` everywhere; never call `fetch` directly.

### Key components

| File | Role |
|------|------|
| `src/components/PropertyDetail.jsx` | Full-page deal detail with 9 tabs: Overview, Ownership & Skip, Transactions, Tax & Assessment, Site & Environmental, Market & Comps, Distress Signals, Documents, Notes. Reads `briefJson` and `notes` from deal object. Calls `saveNote` and `postFeedback` from DealsContext. |
| `src/components/DealDrawer.jsx` | Slide-over panel used within feed/list views for quick deal preview. Distinct from PropertyDetail. |
| `src/components/DealMap.jsx` | Reusable Mapbox map. Auto-fits to deal markers via `fitDeals()`. Props: `deals`, `selectedId`, `hoverId`, `onClickDeal`, `mapStyle`, `withPopup`. |
| `src/components/DealComponents.jsx` | Shared atoms: `ScoreBubble`, `MapPinSVG`, `DealCard`. `MapPinSVG` uses `getPinColor` from `assetColors.js`. |
| `src/components/Icons.jsx` | Central icon library — exports `I` object with named icons (e.g. `I.Pin`, `I.Alert`, `I.Trend`). Always import icons from here. |
| `src/components/ParcylBar.jsx` | Top nav bar with sidebar links and theme toggle. |
| `src/components/NewBoxWizard.jsx` | Multi-step modal wizard for creating a buy box. |
| `src/components/ConfirmModal.jsx` | Generic danger-confirm modal; `kind` prop selects copy. |
| `src/components/AerialThumb.jsx` | Aerial/satellite thumbnail image for a property. |
| `src/components/MapBackground.jsx` | Static decorative map background used in DashboardView. |
| `src/lib/format.js` | `fmt(val)` — null-safe display (returns `—` for null/empty/`"null"`). `hasVal(val)`, `fmtMoney(n)` → `$1.2M`/`$420K`. `scoreClass(s)` → `hi/md/lo`. |
| `src/lib/assetColors.js` | `getPinColor(assetClass)` → hex; exports `LEGEND_ITEMS`. |
| `src/data/mockData.js` | Static fallback data: `DEALS`, `BUY_BOXES`, `COMPS`, `ASSET_CLASSES`. |

### Design system

All design tokens are in `src/styles/tokens.css` (Parcyl brand). Key aliases: `--green` = `#5BCC48`, `--warning` = `#F4B73E`, `--danger` = `#E5484D`. Font: Manrope (sans) + JetBrains Mono. Never hardcode hex colors that map to a token. Theme is toggled via `data-theme` attribute on `<html>`; persisted in `localStorage` as `parcyl-theme`.

## KEY FILES

- `src/contexts/DealsContext.jsx` — central data fetch; touching this breaks all views
- `src/components/PropertyDetail.jsx` — full property detail (9 tabs); `brief_json` from the API powers all tab data
- `src/components/DealDrawer.jsx` — slide-over detail panel; complex layout with comps table, owner card, feedback
- `src/components/DealMap.jsx` — Mapbox integration; `fitDeals()` must fire after `onLoad`, not before
- `src/styles/tokens.css` — source of truth for all colors, spacing, typography

## KNOWN LANDMINES

- `DealMap` calls `fitDeals` inside `onLoad` AND in a `useEffect` gated on `mapLoaded`. Both are needed; removing either breaks auto-fit on mount vs. data change.
- `fmt()` must be used on any field that might arrive as the string `"null"` or `"undefined"` from the API — the backend occasionally serializes nulls as strings.
- `COMPS` in `DealDrawer` is still static mock data from `mockData.js` — not yet wired to the API.
- `DashboardView` silently falls back to `MOCK_DEALS` when the API returns an empty array. A subscriber with zero real deals will see fake data.
- `saveNote` in `DealsContext` does an optimistic update but does NOT catch errors — a failed PATCH leaves stale UI state with no user feedback.

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
- `PATCH /api/dealfeed/auth/me` → update profile
- `POST /api/dealfeed/auth/change-password`
