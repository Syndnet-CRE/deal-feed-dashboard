# Architecture: Nightdrop Dashboard — B+ Upgrade
Date: 2026-05-04
Author: Claude (BMAD Architect phase)
Status: APPROVED — ready for stories

---

## Current Architecture Summary

```
BrowserRouter
  AuthProvider          (src/hooks/useAuth.jsx)
    App                 (src/App.jsx — defines AppShell + DealDetailRoute inline)
      AppShell
        ParcylBar       (top nav)
        DealsProvider   (src/contexts/DealsContext.jsx — deals + buyBoxes fetch)
          DashboardView / MyDealsView / BuyBoxesView / MapView / SettingsView
          DealDetailRoute (/deal/:id -> PropertyDetail)
```

**State:** `DealsContext` is the single source of truth for all deal and buy box data. It exposes `{ deals, buyBoxes, loading, error, refetch, postFeedback, saveNote }`. All mutations go through its callbacks; no child fetches directly.

**API layer:** `src/lib/api.js` — single `request()` with Bearer injection and 401 redirect. All HTTP goes through `api.get/post/patch`.

**Design tokens:** `src/styles/tokens.css` — all colors as CSS custom properties. No hex in component code.

**Navigation:** hybrid. Most views use `setView()` state. Deal detail is URL-based (`/deal/:id`).

---

## Architecture Changes Per Phase

### Phase 1 — Trust Repair

No new components. No new routes. No backend changes.

**Files changed:**
- `src/views/DashboardView.jsx` — remove `MOCK_DEALS` fallback; implement real empty state inline
- `src/views/MyDealsView.jsx` — remove `MOCK_DEALS` and `MOCK_BUY_BOXES` fallbacks
- `src/views/BuyBoxesView.jsx` — remove `MOCK_BUY_BOXES` fallback
- `src/components/DealDrawer.jsx` — remove hardcoded `CompsMap` SVG; replace with data-driven or neutral state
- `src/components/DealDrawer.jsx` — add data freshness badge
- `src/components/PropertyDetail.jsx` — add freshness badge; add source attribution in Ownership tab
- `src/components/DealComponents.jsx` — add note icon indicator to deal cards
- `src/lib/format.js` — add `fmtRelativeTime(dateStr)` helper

**FreshnessBadge logic:**
- Source field: `deal.updatedAt` or `brief_json.enriched_at` (Brady to confirm exact field name)
- Fallback: if field absent, render nothing
- Color: green (`var(--green)`) under 7 days; amber (`var(--warning)`) 8-30 days; muted (`--text-dim` or equivalent token) 30+
- Format: "Updated 3 days ago"

**CompsMap replacement:**
- If `deal.briefJson?.comps?.length > 0`: show comps table (already correct) + small text note above: "Comparable sales — {n} properties within 3.6 mi"
- If 0 comps: replace the entire `<CompsMap>` + empty table row with a single neutral placeholder matching existing empty-row padding/color style

---

### Phase 2 — Contact Workflow

**Backend (~/parcyl/scoutgpt-api):**
- Migration 031: `ALTER TABLE df_deals_sent ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'new'`
- Migration 032: new table `deal_contacts(id, deal_id, subscriber_id, contacted_at, channel, outcome, notes)`
- New routes:
  - `PATCH /api/dealfeed/deals/:id/status` — body `{ status: string }`
  - `POST /api/dealfeed/deals/:id/contacts` — body `{ contacted_at, channel, outcome, notes }`
  - `GET /api/dealfeed/deals/:id/contacts` — returns `{ contacts: Contact[] }`

**Frontend — DealsContext additions:**
- `updateStatus(dealId, status)` — optimistic update + API call
- `contacts` map: `{ [dealId]: Contact[] }` — populated lazily on deal open
- `logContact(dealId, entry)` — POST + update local map
- `fetchContacts(dealId)` — GET + populate map

**New components:**
- `src/components/ContactLogModal.jsx` — modal: date, channel (Phone/Email/Text/DM/Letter), outcome (Answered/No Answer/Left VM/Not Interested/Interested), free-text notes
- `src/components/StatusSelector.jsx` — inline status badge/dropdown; statuses: New, Researched, Contacted, Negotiating, Offer Made, Dead

**Modified components:**
- `src/components/PropertyDetail.jsx` — Ownership tab: phone as `<a href="tel:">`, email as `<a href="mailto:">`, copy buttons, low-confidence amber badge (dm.conf < 60); "Log Contact" button; contact timeline
- `src/components/PropertyDetail.jsx` — Overview tab: StatusSelector
- `src/components/DealDrawer.jsx` — status badge; Call/Email action buttons
- `src/views/MyDealsView.jsx` — status badge on rows; Contacted chip; "Has contact info" toggle filter

**File size warning:** `PropertyDetail.jsx` is currently 873 lines. Before Phase 2, extract:
- `src/components/tabs/OwnershipTab.jsx` (Ownership & Skip tab content)
- `src/components/tabs/DistressTab.jsx` (Distress Signals tab content)

---

### Phase 3 — Deal Management UX

No backend changes.

**Modified components:**
- `src/components/DealComponents.jsx` — add aging chip to DealCard (uses `deal.days`; color via `agingColor()` helper)
- `src/views/MyDealsView.jsx` filter bar — add Distress Type multi-select; add Owner Type multi-select; persist all 6 filters to `localStorage` key `parcyl-deals-filters`
- `src/components/PropertyDetail.jsx` header — share button; `navigator.clipboard.writeText(window.location.href)`; inline toast (2s auto-dismiss, no deps)
- `src/components/ParcylBar.jsx` — search input; results dropdown (client-side filter on `deals` from DealsContext); click navigates to `/deal/:id`

**New utilities in `src/lib/format.js`:**
- `agingColor(days)` — returns CSS var name string
- `fmtRelativeTime(dateStr)` — "3 days ago", "today", "32 days ago"

**localStorage schema:** `{ box: string, range: string, klass: string, sort: string, distressTypes: string[], ownerTypes: string[] }`

---

### Phase 4 — Buy Box Improvements

**Backend (~/parcyl/scoutgpt-api):**
- `PATCH /api/dealfeed/buy-boxes/:id` — handles edit payload and `{ status: 'paused' | 'active' }`
- `POST /api/dealfeed/buy-boxes/preview` — dry-run; returns `{ estimated_count: number }`

**Frontend:**
- `src/views/BuyBoxesView.jsx` — wire Edit button to `ConfigurationOverlay` with `mode="edit"` + `initialData`; wire Pause/Resume with `ConfirmModal` before pause
- `src/components/ConfigurationOverlay.jsx` — add `mode` prop (`"create"` | `"edit"`); add `initialData` prop to pre-populate; debounce 800ms preview call when Geography + Asset Class filled; display match count in sticky Review bar
- `src/contexts/DealsContext.jsx` — add `updateBuyBox(id, patch)` and `refetchBuyBoxes()`

---

### Phase 5 — Dashboard Upgrade

No backend changes. Requires Phase 2 contacts map to be available for "Contacted" and "Awaiting Response" stats.

**Modified components:**
- `src/views/DashboardView.jsx` — replace 4 static StatCards with computed versions: New This Week (`days <= 7`), Contacted (deals with contacts.length > 0), Hot Matches (`score >= 80`), Awaiting Response (status === "Contacted" + no contact in 7+ days)
- `src/views/DashboardView.jsx` — replace `MapBackground` + `MapPin` with real `<DealMap>` showing top 10-15 deals by score; `withPopup={true}`; `onClickDeal` navigates to deal
- `src/views/DashboardView.jsx` — add Recent Activity section: last 5 contact entries across all deals; click navigates to deal

---

### Phase 6 — Property Detail Polish

No backend changes.

**Modified components:**
- `src/components/PropertyDetail.jsx` Overview tab — restructure above-the-fold layout: score badge, asset class chip, full address, assessed value, hold period, owner name + contact buttons, top 3 distress signals as chips
- `src/components/tabs/DistressTab.jsx` — group by severity: Critical (Tax Delinquency, Foreclosure), Moderate (Long-Term Hold, No Permits), Informational (Absentee, Inactive Entity); color-coded left border per tier; tier headers shown even if tier empty
- `src/components/PropertyDetail.jsx` Overview tab — move AerialThumb to top as larger panel; "View Full Screen" button opens inline lightbox (dark backdrop, click-to-close, no external deps)

---

## Component Inventory After B+

| Component | Phases | Key Risk |
|---|---|---|
| `DashboardView.jsx` | 1, 5 | Remove MOCK_DEALS; real DealMap |
| `MyDealsView.jsx` | 1, 2, 3 | Remove MOCK_DEALS; filters; status |
| `BuyBoxesView.jsx` | 1, 4 | Remove MOCK_BUY_BOXES; wire Edit/Pause |
| `DealDrawer.jsx` | 1, 2 | CompsMap fix; clickable contacts; status |
| `PropertyDetail.jsx` | 1, 2, 3, 6 | 873 lines now — must extract tabs first |
| `ParcylBar.jsx` | 3 | Global search |
| `ConfigurationOverlay.jsx` | 4 | Edit mode + preview |
| `DealsContext.jsx` | 2, 4 | New callbacks; contacts map |
| `DealComponents.jsx` | 1, 3 | Note icon; aging chip |
| `ContactLogModal.jsx` | 2 | New |
| `StatusSelector.jsx` | 2 | New |
| `tabs/OwnershipTab.jsx` | 2 | Extract from PropertyDetail before Phase 2 |
| `tabs/DistressTab.jsx` | 2, 6 | Extract from PropertyDetail before Phase 2 |

---

## CSS Constraints

- All new colors reference tokens: `var(--green)`, `var(--warning)`, `var(--danger)`, `var(--text-muted)` or equivalent names from `tokens.css`
- New components reuse existing class patterns: `.panel-card`, `.kv-list`, `.pill`, `.tag`, `.empty`
- No inline style hex values on any new code
- Aging and freshness badges share the same three-color logic (green / amber / muted)

---

## Testing Contract

- `npm test` (vitest) runs `src/lib/*.test.js` — must stay green after every story
- Phase 1: no new test files; touch no existing test files
- Phase 2: add `src/lib/contactHelpers.test.js` if pure contact logic is extracted; update E2E smoke suite for status and contact flows
- Phase 3: add filter persistence test if filter logic is extracted to a helper
- E2E smoke suite (`tests/smoke.spec.js`) must pass before every push touching DashboardView, DealDrawer, or PropertyDetail

---

## Deployment

Frontend: Netlify auto-deploys from `main`. `npm run build` → `dist/`.
Backend: Render auto-deploys from `main` in `~/parcyl/scoutgpt-api`.
DB: Neon (PostgreSQL). Migrations run manually.
