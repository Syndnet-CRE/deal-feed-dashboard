<!-- Generated: 2026-05-20 | Files scanned: ~95 | Token estimate: ~700 -->
# Architecture — nightdrop-dashboard

React 19 + Vite 8 SPA. JSX, no TypeScript. Plain CSS with tokens.
Production: Netlify auto-deploys from `main` → https://nightdropai.netlify.app

## Boundaries
```
Browser
  └─ React SPA (this repo)
       ├─ /api/dealfeed/*  → nightdrop-api (Render)
       └─ Mapbox GL JS     → Mapbox tiles
```

## Provider hierarchy (src/App.jsx)
```
BrowserRouter
  AuthProvider              (src/hooks/useAuth.jsx)
    ToastProvider           (src/contexts/ToastContext.jsx)
      App                   (defines AppShell, DealDetailPage, DealDetailModal inline)
        AppShell            (view state)
          ReadStateProvider / DealStateProvider / DealsProvider
            TopHeader | LeftPanel | Views | DealDetailPage | DealDetailModal
```

## Navigation — hybrid
- View switching: state-driven (`view` string in AppShell, sidebar click → `setView(...)`).
- URL-driven only for deal detail (`/deal/:id`) and the buy box wizard
  (`/buy-boxes/new`, `/buy-boxes/:id/edit`).
- Admin/invites gated to `subscriber.email === 'brady@parcyl.ai'`.

## Top-level dirs
```
src/
├── App.jsx                 ← AppShell + DealDetailPage + DealDetailModal inline
├── hooks/useAuth.jsx       ← auth context, token storage
├── contexts/               ← DealsContext, ReadStateContext, DealStateContext, ToastContext
├── lib/                    ← api client, taxonomy, format, wizardFormState
├── views/                  ← page-level components (Dashboard, Map, BuyBoxes, Admin, …)
├── pages/                  ← URL-routed pages (BuyBoxPage)
├── components/             ← shared UI atoms + composites
│   ├── feed/               ← deal feed cards, chat thread
│   └── kanban/             ← (placeholder, currently empty)
├── styles/                 ← tokens.css + per-surface CSS files
├── assets/                 ← logo PNG, static images
└── data/mockData.js        ← fallback data when API empty
```

## Data flow — buy box create
```
BuyBoxWizard (7 steps)
  → form state (wizardFormState.EMPTY_FORM shape)
  → debounced POST /api/dealfeed/buy-boxes/preview (400ms)        ← live match count
  → on activate: POST /api/dealfeed/buy-boxes                     ← create
                 OR PATCH /api/dealfeed/buy-boxes/:id             ← edit
```

## Data flow — deal feed
```
DealsContext.fetchAll() (on mount)
  → GET /api/dealfeed/deals       → deals[]
  → GET /api/dealfeed/buy-boxes   → buyBoxes[]
  → GET /api/dealfeed/contacts    → contacts[]
  → exposes via useDeals(): {deals, buyBoxes, contacts, refetch, postFeedback, …}
```

## Cross-repo lockstep (DO NOT BREAK)
The asset class taxonomy must stay identical across 4 files:
- `~/nightdrop-dashboard/src/lib/buyBoxTaxonomy.js`           (this repo)
- `~/nightdrop-api/services/assetUseCodes.js`                 (Node, source of truth)
- `~/nightdrop-api/services/assetClassMap.js`                 (resolved_asset_type strings)
- `~/nightdrop-api/agents/lib/asset_class_map.py`             (Python matcher)

## Build / test
```bash
npm run dev        # vite dev server (5173, auto-bumps if taken)
npm run build      # production build → dist/
npm test           # vitest (120 tests)
npm run lint       # ESLint
npx playwright test    # E2E smoke
```

## Env vars
- `VITE_API_BASE_URL` — empty in dev (Vite proxies to nightdrop-api.onrender.com)
- `VITE_MAPBOX_TOKEN` — Mapbox public token

## Spec references
- Backend MVP filter contract: `~/nightdrop-api/docs/taxonomy/mvp-buy-box-taxonomy.md`
- Cross-repo audit: `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`
