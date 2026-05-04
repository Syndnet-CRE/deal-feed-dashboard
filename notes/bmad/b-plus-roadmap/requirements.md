# Requirements: B+ Product Roadmap
Feature: Deal Feed Dashboard — Full Product Upgrade to B+ Quality
Date: 2026-05-03
Author: Brady Irwin (postmortem) + Claude (roadmap)
Status: APPROVED — ready for PRD

---

## Background

A full UI/UX postmortem was conducted from the perspective of CRE investors, land developers, and wholesalers. The product was graded across 8 dimensions. Current overall grade is approximately C / 50% complete. The bones of the product are correct — the deal discovery model, buy box concept, and data taxonomy are sound. The missing half is the action layer: what a user does with a deal once they find it.

Goal: reach B+ across all dimensions before going to market.

---

## Grading Baseline

| Area | Current | Target |
|---|---|---|
| Onboarding | D | B+ |
| Dashboard | C- | B |
| Deal Feed | C | B+ |
| Property Detail | C+ | B+ |
| Skip Trace / Contact | F | C+ |
| Buy Box Management | C | B+ |
| Navigation / IA | C- | B |
| Data Quality | D+ | B |

---

## Phase 1 — Trust Repair
**Priority: P0. No other phase matters if the product shows fake data.**
**Effort: 2 days. Frontend only — no backend changes.**

### REQ-1.1 Remove MOCK_DEALS fallback
- `DashboardView` currently shows `MOCK_DEALS` when the API returns an empty deals array.
- Replace with a real empty state: confirm the buy box is active, set expectations for first match timing, CTA to buy box page.
- Zero fake deals shown to any authenticated subscriber under any condition.

### REQ-1.2 Fix mock comps in DealDrawer
- `DealDrawer` shows a hardcoded SVG comps map with 4 hardcoded property positions.
- The comps table already reads from `deal.briefJson.comps`. The SVG map positions are not real.
- Replace the hardcoded SVG with a neutral state when comps are unavailable. Display real comps when `briefJson.comps` is populated with at least 1 entry.

### REQ-1.3 Data freshness badges
- Add a "Last updated" badge to PropertyDetail and DealDrawer showing when the record was enriched.
- Source: enrichment timestamp from `brief_json` or a proxy field on the deal record. Brady to confirm field name.
- Format: "Updated 3 days ago" — green if under 7 days, amber if 8-30, muted if 30+.

### REQ-1.4 Source attribution on Ownership tab
- Add small source labels to key fields in the Ownership & Skip tab: "County Record", "Enriched", "Skip Traced".
- These help professionals assess data reliability before acting on it.

### REQ-1.5 Note indicator on deal cards
- If `deal.notes` is non-empty, show a small note icon on deal cards in `MyDealsView` and in `DealDrawer`.
- Signals to the user that they have previously engaged with this deal.

---

## Phase 2 — Contact Workflow
**Priority: P0. The single highest-leverage gap in the product.**
**Effort: 4 days. Requires backend routes and DB migrations.**

### REQ-2.1 Clickable contact data
- In Ownership & Skip tab, render `dm.phone` as `<a href="tel:...">` with a "Call" icon button.
- Render `dm.email` as `<a href="mailto:...">` with an "Email" icon button.
- Add click-to-copy buttons for both fields using `navigator.clipboard`.
- If `dm.conf` (confidence) is below 60%, show an amber "Low confidence" badge next to the value.

### REQ-2.2 Deal status pipeline
- Every deal moves through a status pipeline: New → Researched → Contacted → Negotiating → Offer Made → Dead.
- Status stored on backend: new column on `df_deals_sent` (migration required).
- New API route: `PATCH /api/dealfeed/deals/:id/status` body `{ status: string }`.
- Status badge visible on deal cards in `MyDealsView`.
- Status badge visible in `DealDrawer`.
- Status selector in `PropertyDetail` (Overview tab or sticky element).
- Default status for all existing deals is "new".

### REQ-2.3 Contact log
- New UI element in Ownership & Skip tab: "Log Contact" button opens a modal.
- Modal fields: date (default today), channel (Phone / Email / Text / DM / Letter), outcome (Answered / No Answer / Left VM / Not Interested / Interested), free-text notes.
- Contact entries displayed as a timeline below the skip trace section in Ownership tab.
- New backend table: `deal_contacts(id, deal_id, subscriber_id, contacted_at, channel, outcome, notes)`.
- New API routes:
  - `POST /api/dealfeed/deals/:id/contacts`
  - `GET /api/dealfeed/deals/:id/contacts`
- "Contacted" chip on deal cards if any log entry exists for that deal.

### REQ-2.4 Contact status filter
- In `MyDealsView` filter bar, add a "Has contact info" toggle (only show deals where `dm.phone` or `dm.email` is non-null).

---

## Phase 3 — Deal Management UX
**Priority: P1. High daily-use impact, mostly frontend.**
**Effort: 3 days. Frontend only.**

### REQ-3.1 Deal aging indicator
- Show "Added X days ago" on every deal card and in DealDrawer.
- Source: `deal.days` field already in the deal payload.
- Color: under 7 days = green, 8-30 = amber, 30+ = muted.

### REQ-3.2 Share button
- Add a share icon to `PropertyDetail` header.
- On click: copy current URL (`/deal/:id`) to clipboard, show a brief "Link copied" toast.
- No external dependencies.

### REQ-3.3 Enhanced filtering in MyDealsView
- Add two additional filter dropdowns:
  - Distress Type: multi-select from signal types present in the deals dataset (Tax Delinquency, Absentee, Long-Term Hold, No Permits, Inactive Entity).
  - Owner Type: multi-select (Individual, LLC, Trust, Corporate).
- Persist active filters to `localStorage` so they survive a page refresh.
- Existing 4 filters (Buy Box, Date Range, Asset Class, Sort) stay as-is.

### REQ-3.4 Global search in ParcylBar
- Add a search input to the top nav bar.
- Client-side filter: on keystroke, filter loaded `deals` array by address, owner name, city, zip.
- Search results shown inline as a dropdown list with deal address and score.
- Clicking a result navigates to `/deal/:id`.
- If no matches found, show "No results for [query]."

---

## Phase 4 — Buy Box Improvements
**Priority: P1. Fixes broken workflows users will hit immediately.**
**Effort: 2 days. Requires backend route additions.**

### REQ-4.1 Edit existing buy boxes
- `BuyBoxesView` already renders an Edit button per card. It is not connected.
- Clicking Edit opens `ConfigurationOverlay` with `mode="edit"` and `initialData` pre-populated from the existing buy box record.
- On submit in edit mode: `PATCH /api/dealfeed/buy-boxes/:id` (new backend route).
- On success: refetch buy box list, close overlay.

### REQ-4.2 Pause and resume
- `BuyBoxesView` already conditionally renders Pause/Resume buttons. Not connected.
- Wire to `PATCH /api/dealfeed/buy-boxes/:id` with body `{ status: 'paused' | 'active' }`.
- Show `ConfirmModal` before pausing ("Pause this buy box? You won't receive new deals while paused.").

### REQ-4.3 Match preview
- In `ConfigurationOverlay`, when Geography and Asset Class are both filled, show a live match count in the sticky Review bar.
- Call `POST /api/dealfeed/buy-boxes/preview` with current form state.
- Backend: dry-run the buy box query and return `{ estimated_count: number }`.
- Display: "~340 properties match your current criteria."
- Debounce the preview call 800ms after the last form change.
- Show loading state while preview call is in flight.

---

## Phase 5 — Dashboard Upgrade
**Priority: P2. Improves daily landing page quality.**
**Effort: 2 days. Frontend only — uses already-loaded data.**

### REQ-5.1 Meaningful stat blocks
- Replace the 4 generic stat cards with contextually meaningful metrics computed from the loaded deals array:
  - New This Week: deals added in the last 7 days
  - Contacted: deals with at least one contact log entry (from Phase 2 data)
  - Hot Matches: deals with score >= 80
  - Awaiting Response: deals in "Contacted" status with no update in 7+ days
- All computed client-side from already-loaded data.

### REQ-5.2 Live map pins on dashboard
- Replace the decorative `MapBackground` component in `DashboardView` with a real `DealMap` instance.
- Show the top 10-15 highest-score deals as pins.
- On pin click: navigate to `/deal/:id`.
- Use the existing `DealMap` component with `withPopup={true}`.

### REQ-5.3 Activity feed
- Add a "Recent Activity" section to the dashboard showing the last 5 contact log entries across all deals (from Phase 2).
- Display: date, deal address, channel, outcome.
- Clicking an entry navigates to the deal detail.

---

## Phase 6 — Property Detail Polish
**Priority: P2. Refinement of the most-used view.**
**Effort: 1 day. Frontend only.**

### REQ-6.1 Overview tab as executive summary
- Restructure the Overview tab so the following are visible above the fold without scrolling:
  - Deal score badge (prominent)
  - Asset class chip
  - Full address
  - Assessed value
  - Hold period estimate
  - Owner name + quick-contact buttons (Call / Email, from Phase 2)
  - Top 3 distress signals as colored chips
- Remaining existing Overview content stays below.

### REQ-6.2 Distress signals severity hierarchy
- In the Distress Signals tab, group signals by severity tier:
  - Critical: Tax Delinquency, Foreclosure
  - Moderate: Long-Term Hold, No Permits Filed
  - Informational: Absentee, Inactive Entity
- Color-coded left border per tier (red / amber / gray).
- Tier headers shown even if no signals present in that tier ("No critical signals").

### REQ-6.3 Aerial image prominent
- Move `AerialThumb` component to the top of the Overview tab as a larger panel.
- Add a "View Full Screen" button that opens the image in a simple lightbox overlay (dark backdrop, click-to-close, no dependencies).

---

## Out of Scope for B+

Deferred post-launch:
- Mobile / responsive redesign — requires layout rearchitecture; separate sprint
- Bulk deal actions — Phase 3 scope creep
- Notification system (bell icon) — requires real-time infrastructure
- A/B buy box comparison — power user feature, post-launch
- Direct mail / outreach templates — requires third-party integration
- DNC registry check — requires third-party API
- Buy box performance metrics — requires analytics instrumentation first
- Full skip trace API integration (BatchSkipTracing / PropStream) — third-party, separate track

---

## Non-Functional Requirements

- Every commit must pass `npm run build` (no build errors)
- Run `npm run lint` before every commit
- Run `npm test` before every commit (wizardHelpers unit tests must stay green)
- Run E2E smoke suite before any push touching PropertyDetail, DealDrawer, or DashboardView
- No hardcoded hex values — always use CSS custom property tokens from `tokens.css`
- No mock data in production — any use of `MOCK_DEALS` or hardcoded arrays requires a clear "dev only" comment and a TODO to remove
- No `console.log` in committed code

---

## Backend Migration Summary

| Migration | Phase | Table | Change |
|---|---|---|---|
| 031_deal_status | Phase 2 | df_deals_sent | ADD COLUMN status VARCHAR(32) DEFAULT 'new' |
| 032_deal_contacts | Phase 2 | deal_contacts (new) | id, deal_id, subscriber_id, contacted_at, channel, outcome, notes |

---

## Definition of Done Per Phase

- All REQs in the phase implemented
- Build passes
- Lint passes
- Existing unit tests pass
- E2E smoke suite passes (or new tests added if new flows introduced)
- Pushed to main
- Netlify deploy confirmed
- HANDOFF.md updated
