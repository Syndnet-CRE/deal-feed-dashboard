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
      ProtectedLayout
        DealsProvider (src/contexts/DealsContext.jsx)
          Views + DealDrawer
```

`AuthProvider` holds the JWT (stored as `df_token` in localStorage) and the `subscriber` object. `DealsProvider` fetches `/api/dealfeed/deals` and `/api/dealfeed/buy-boxes` in parallel on mount and exposes `{ deals, buyBoxes, loading, error, refetch, postFeedback }`.

### Navigation model

The app uses a **single-page view-state router** — `view` is a string state variable in `ProtectedLayout`, not URL segments. Sidebar clicks call `setView(...)`. The only real routes are `/login` and `/*` (protected layout).

### API layer (src/lib/api.js)

All requests go through a single `request()` function that injects the Bearer token and handles 401 (clear token + redirect to `/login`). Use `api.get/post/patch` everywhere; never call `fetch` directly.

### Key components

| File | Role |
|------|------|
| `src/components/DealDrawer.jsx` | Slide-over detail panel for a single deal. Reads `briefJson` from deal object for property facts. Calls `postFeedback` from DealsContext. |
| `src/components/DealMap.jsx` | Reusable Mapbox map component. Auto-fits to deal markers on load via `fitDeals()`. Accepts `deals`, `selectedId`, `hoverId`, `onClickDeal`, `mapStyle`, `withPopup`. |
| `src/components/DealComponents.jsx` | Shared presentational atoms: `ScoreBubble`, `MapPinSVG`. `MapPinSVG` uses `getPinColor` from `assetColors.js` to color-code by asset class. |
| `src/lib/format.js` | `fmt(val)` — null-safe string display (returns `—` for null/empty). `hasVal(val)` — null check. `fmtMoney(n)` — `$1.2M` / `$420K`. `scoreClass(s)` — `hi/md/lo`. |
| `src/lib/assetColors.js` | Maps asset class strings to hex pin colors; exports `getPinColor(assetClass)` and `LEGEND_ITEMS`. |
| `src/data/mockData.js` | Static fallback data (`DEALS`, `BUY_BOXES`, `COMPS`, `ASSET_CLASSES`). COMPS is still used live in `DealDrawer`. |

### Design system

All design tokens are in `src/styles/tokens.css` (Parcyl brand). Key aliases: `--green` = `#5BCC48`, `--warning` = `#F4B73E`, `--danger` = `#E5484D`. Font: Manrope (sans) + JetBrains Mono. Never hardcode hex colors that map to a token.

## KEY FILES

- `src/contexts/DealsContext.jsx` — central data fetch; touching this breaks all views
- `src/components/DealDrawer.jsx` — 200 lines; complex layout with comps table, owner card, feedback actions
- `src/components/DealMap.jsx` — Mapbox integration; `fitDeals()` must fire after `onLoad`, not before
- `src/styles/tokens.css` — source of truth for all colors, spacing, typography

## KNOWN LANDMINES

- `DealMap` calls `fitDeals` inside `onLoad` AND in a `useEffect` gated on `mapLoaded`. Both are needed; removing either breaks auto-fit on mount vs. data change.
- `fmt()` must be used on any field that might arrive as the string `"null"` or `"undefined"` from the API — the backend occasionally serializes nulls as strings.
- `COMPS` in `DealDrawer` is still static mock data — not yet wired to the API.
- The view state model means deep-linking to a specific view is not supported without URL-based routing changes.

## BACKEND CONTRACT

Backend repo: `~/parcyl/scoutgpt-api`
Relevant routes: `routes/dealfeed/auth.js`, `routes/dealfeed/deals.js`

Key endpoints:
- `POST /api/dealfeed/auth/login` → `{ token, subscriber }`
- `GET /api/dealfeed/auth/me` → `{ subscriber }`
- `GET /api/dealfeed/deals` → `{ deals: Deal[] }`
- `GET /api/dealfeed/buy-boxes` → `{ buy_boxes: BuyBox[] }`
- `POST /api/dealfeed/deals/:id/feedback` → body `{ feedback: "hot" | "no" | null }`
- `PATCH /api/dealfeed/auth/me` → update profile
- `POST /api/dealfeed/auth/change-password`
