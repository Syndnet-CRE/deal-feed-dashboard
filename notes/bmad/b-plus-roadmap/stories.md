# Stories: Deal Feed Dashboard — B+ Upgrade
Date: 2026-05-04
Author: Claude (BMAD SM phase)
Status: AWAITING BRADY CONFIRMATION before implementation begins

---

## How to read this file

Each story is a self-contained unit of work. Stories within a phase are ordered by dependency — implement top to bottom. A story is NOT complete until:
- Implementation done
- `npm run build` passes
- `npm run lint` passes
- `npm test` passes
- Story acceptance criteria verified manually in browser

---

## Phase 1 — Trust Repair
*Frontend only. No backend changes. Estimated: 2 days.*

---

### STORY-1.1 — Remove MOCK_DEALS fallback from DashboardView

**Files:** `src/views/DashboardView.jsx`

**What:** Line 36 does `const deals = (!loading && apiDeals.length === 0) ? MOCK_DEALS : apiDeals;` — this shows fake deals to any authenticated user with zero real deals. Remove it. When `apiDeals` is empty, render a real empty state.

**Empty state design:**
- Icon: `I.Building` or `I.Boxes`
- Heading: "No deals yet"
- Body: "Your first nightly run will populate this feed. Make sure your buy box is active."
- CTA button: "View Buy Boxes" — calls `setView('boxes')` (prop must be threaded down from AppShell)
- Still show the stat cards with `0` values — do not hide them

**Acceptance criteria:**
- [ ] `MOCK_DEALS` import removed from `DashboardView.jsx`
- [ ] When API returns 0 deals, empty state renders — not fake deal cards
- [ ] When API returns real deals, they render normally
- [ ] Stat cards show real computed values (all zero when no deals)

**Estimated effort:** 1-2 hours

---

### STORY-1.2 — Remove MOCK_DEALS and MOCK_BUY_BOXES from MyDealsView and BuyBoxesView

**Files:** `src/views/MyDealsView.jsx`, `src/views/BuyBoxesView.jsx`

**What:** `MyDealsView.jsx` lines 13-14 fall back to mock data for both deals and buy boxes. `BuyBoxesView.jsx` line 7 falls back to `MOCK_BUY_BOXES`. Remove all three fallbacks.

**Empty states:**
- `MyDealsView`: if `deals` is truly empty (not just filtered to zero), show "No deals in your feed yet. Your buy boxes are running nightly." The existing filter-empty state ("No deals match these filters") stays as-is.
- `BuyBoxesView`: already has a proper "No buy boxes yet" empty state at line 46 — it will render correctly once the mock fallback is removed.

**Acceptance criteria:**
- [ ] `MOCK_DEALS` and `MOCK_BUY_BOXES` imports removed from `MyDealsView.jsx`
- [ ] `MOCK_BUY_BOXES` import removed from `BuyBoxesView.jsx`
- [ ] Zero real deals shows honest empty state in MyDealsView
- [ ] Zero real buy boxes shows existing empty state in BuyBoxesView

**Estimated effort:** 1 hour

---

### STORY-1.3 — Fix hardcoded CompsMap in DealDrawer

**Files:** `src/components/DealDrawer.jsx`

**What:** The `CompsMap` component (lines 29-56) renders 4 hardcoded SVG map pins at fixed x/y positions regardless of actual comp data. Replace with a data-honest treatment.

**New behavior:**
- If `deal.briefJson?.comps?.length > 0`: remove the SVG map entirely; show a header above the comps table: "Comparable Sales · {n} properties within 3.6 mi radius" — the table itself is the primary display
- If 0 comps: replace the entire `<CompsMap>` element with a neutral placeholder matching existing empty-row padding and color: "Comparable sales not available for this record"
- Delete the `CompsMap` function from the file entirely

**Acceptance criteria:**
- [ ] `CompsMap` function deleted — no hardcoded SVG positions remain
- [ ] Deals with real comps show comps table with a header count
- [ ] Deals with zero comps show a neutral placeholder, not fake SVG pins

**Estimated effort:** 1 hour

---

### STORY-1.4 — Data freshness badge

**Files:** `src/lib/format.js`, `src/lib/format.test.js`, `src/components/DealDrawer.jsx`, `src/components/PropertyDetail.jsx`

**What:** Add an "Updated X days ago" badge to DealDrawer and PropertyDetail so users know how fresh the record is before acting on it.

**Step 1 — add helpers to `format.js`:**
- `fmtRelativeTime(dateStr)` — input: ISO date string or null. Returns `{ label: "3 days ago", days: 3 }` or null if input is null/unparseable. "today" if 0 days, "yesterday" if 1.
- `freshnessColor(days)` — returns `"var(--green)"` if days <= 7, `"var(--warning)"` if days <= 30, else a muted token (check `tokens.css` for the correct `--text-*` var for dim/muted text).

**Step 2 — add unit tests** to `src/lib/format.test.js` covering: null input, today, 1 day, 6 days (green), 8 days (amber), 31 days (muted), unparseable string.

**Step 3 — add badge to DealDrawer** in the `drawer-sub` line area. Field priority: `deal.briefJson?.enriched_at` then `deal.updatedAt` then `deal.created_at`. If all absent, render nothing.

**Step 4 — add badge to PropertyDetail** near the property address/header in the Overview tab.

**Note on field name:** Brady must confirm the exact field. Until confirmed, use the priority chain and fail silently if all are null.

**Acceptance criteria:**
- [ ] `fmtRelativeTime` and `freshnessColor` exported from `format.js`
- [ ] Unit tests for both helpers pass
- [ ] Badge appears in DealDrawer when any date field is present
- [ ] Badge appears in PropertyDetail Overview when any date field is present
- [ ] Green/amber/muted colors use CSS tokens — no hardcoded hex
- [ ] If no date field present, badge renders nothing (no broken element)

**Estimated effort:** 2 hours

---

### STORY-1.5 — Source attribution on Ownership tab

**Files:** `src/components/PropertyDetail.jsx`, `src/styles/styles.css`

**What:** In the Ownership & Skip tab, add small source labels next to key fields so professionals can assess data reliability.

**Fields and their labels:**
- Owner name, mailing address, entity type — "County Record"
- Decision Maker name, phone, email — "Skip Traced"
- Assessed value fields — "County Record"

**Implementation:** Add `<span className="source-label">County Record</span>` inline after each field value in the kv-list. Add `.source-label` to `styles.css`: `font-size: 10px; color: var(--text-dim); font-weight: 500; margin-left: 6px; letter-spacing: 0.03em;` (use whichever muted text token is correct from `tokens.css`).

**Acceptance criteria:**
- [ ] Source labels visible on owner, mailing, entity type, assessed value fields
- [ ] Source label visible on DM name, phone, email
- [ ] Labels use CSS token color — no hardcoded hex
- [ ] Labels do not appear on fields that are empty/null

**Estimated effort:** 1.5 hours

---

### STORY-1.6 — Note indicator on deal cards

**Files:** `src/views/MyDealsView.jsx`, `src/components/DealDrawer.jsx`

**What:** If `deal.notes` is non-empty, show a small note icon on deal row cards in MyDealsView and in the DealDrawer header.

**MyDealsView:** In the `row-meta` div (around line 118), add:
`{d.notes && <span className="fb" title="You have notes on this deal"><I.Doc size={10}/></span>}`

**DealDrawer:** Near the `drawer-sub` div, add a note indicator if `deal.notes` is non-empty.

**Acceptance criteria:**
- [ ] Note icon visible on deal row cards in MyDealsView when notes non-empty
- [ ] Note indicator visible in DealDrawer when notes non-empty
- [ ] No indicator shown when `deal.notes` is null, undefined, or empty string
- [ ] Icon uses existing `I.Doc` or equivalent from Icons.jsx

**Estimated effort:** 30 minutes

---

## Phase 2 — Contact Workflow
*Frontend + backend. Requires Brady to resolve blockers in PRD.md first. Estimated: 4 days.*

**Blockers before starting Phase 2:**
1. Brady confirms skip trace data is real (dm.phone / dm.email populated)
2. Brady confirms data freshness field name from Phase 1
3. Migration 030 confirmed applied to Neon
4. Brady available for backend review

---

### STORY-2.0 — Extract PropertyDetail tabs (prerequisite for Phase 2)

**Files:** `src/components/PropertyDetail.jsx`, new `src/components/tabs/OwnershipTab.jsx`, new `src/components/tabs/DistressTab.jsx`

**What:** PropertyDetail is 873 lines — over the 800-line absolute max. Before adding Phase 2 contact features, extract two tabs.

**Extract:**
- Ownership & Skip tab content → `src/components/tabs/OwnershipTab.jsx`; receives `{ deal, contacts, onLogContact }` props
- Distress Signals tab content → `src/components/tabs/DistressTab.jsx`; receives `{ deal }` props

**Acceptance criteria:**
- [ ] `PropertyDetail.jsx` under 500 lines after extraction
- [ ] Both tab files render identically to before extraction
- [ ] `npm test` passes

**Estimated effort:** 1.5 hours

---

### STORY-2.1 — Backend: deal status column and route

**Repo:** `~/parcyl/scoutgpt-api`

**What:** Migration 031 adds `status` column. Route allows updating it.

**Migration:** `ALTER TABLE df_deals_sent ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'new'`

**Route:** `PATCH /api/dealfeed/deals/:id/status` in `routes/dealfeed/deals.js`. Body: `{ status }`. Validate against allowed values (New, Researched, Contacted, Negotiating, Offer Made, Dead). Return `{ status }`.

**Acceptance criteria:**
- [ ] Migration file at `migrations/031_deal_status.sql`
- [ ] Migration applied to Neon
- [ ] Route returns 200 with updated status
- [ ] Route rejects invalid status with 400

**Estimated effort:** 2 hours

---

### STORY-2.2 — Backend: contact log table and routes

**Repo:** `~/parcyl/scoutgpt-api`

**Migration 032:** Create `deal_contacts(id, deal_id, subscriber_id, contacted_at TIMESTAMPTZ, channel VARCHAR(32), outcome VARCHAR(64), notes TEXT)`

**Routes:**
- `POST /api/dealfeed/deals/:id/contacts` — insert, return contact object
- `GET /api/dealfeed/deals/:id/contacts` — return `{ contacts: [] }` ordered by `contacted_at DESC`, scoped to subscriber

**Acceptance criteria:**
- [ ] Migration file at `migrations/032_deal_contacts.sql`
- [ ] Migration applied to Neon
- [ ] POST creates row; GET returns it
- [ ] Users cannot read other subscribers' contacts

**Estimated effort:** 2 hours

---

### STORY-2.3 — DealsContext: status and contacts callbacks

**Files:** `src/contexts/DealsContext.jsx`

**What:** Add `updateStatus`, `fetchContacts`, `logContact` to context. Add `contacts` map to state.

**New state:** `const [contacts, setContacts] = useState({});` — shape: `{ [dealId]: Contact[] }`

**New callbacks:**
- `updateStatus(dealId, status)` — optimistic update on deals array + `api.patch`
- `fetchContacts(dealId)` — `api.get` + populate contacts map
- `logContact(dealId, entry)` — `api.post` + prepend to contacts map for dealId

**Acceptance criteria:**
- [ ] All three callbacks exported from context
- [ ] `updateStatus` does optimistic update
- [ ] `logContact` prepends new entry
- [ ] `npm test` passes

**Estimated effort:** 1.5 hours

---

### STORY-2.4 — StatusSelector component

**Files:** `src/components/StatusSelector.jsx` (new)

**What:** Inline status badge that opens a dropdown to change status.

**Statuses and colors:** New (muted), Researched (blue), Contacted (amber), Negotiating (amber), Offer Made (green), Dead (gray).

**Props:** `{ status, onChangeStatus, size?: "sm" | "md" }`

**Acceptance criteria:**
- [ ] Renders current status as colored pill
- [ ] Click opens dropdown with all 6 statuses
- [ ] Selecting calls `onChangeStatus(newStatus)`
- [ ] Closes on selection or outside click
- [ ] Uses CSS token colors

**Estimated effort:** 1.5 hours

---

### STORY-2.5 — ContactLogModal component

**Files:** `src/components/ContactLogModal.jsx` (new)

**What:** Modal for logging a contact attempt.

**Fields:** Date (input type="date", default today in ISO), Channel (Phone/Email/Text/DM/Letter), Outcome (Answered/No Answer/Left VM/Not Interested/Interested), Notes (textarea, optional).

**Props:** `{ dealId, onSubmit, onClose }`

**Acceptance criteria:**
- [ ] All 4 fields present
- [ ] Submit calls `onSubmit({ contacted_at, channel, outcome, notes })`
- [ ] Close button and backdrop click call `onClose`
- [ ] Does not submit if channel or outcome not selected

**Estimated effort:** 1.5 hours

---

### STORY-2.6 — Wire contact workflow into PropertyDetail and DealDrawer

**Files:** `src/components/tabs/OwnershipTab.jsx`, `src/components/PropertyDetail.jsx`, `src/components/DealDrawer.jsx`

**What:**
- Phone as `<a href="tel:{phone}">` with copy button; email as `<a href="mailto:{email}">` with copy button
- If `dm.conf < 60`: amber "Low confidence" badge next to value
- "Log Contact" button opens `ContactLogModal`; on submit calls `logContact`
- Contact timeline: past entries below skip section, reverse chronological, showing channel, outcome, date
- `fetchContacts(deal.id)` called when deal opens (useEffect on PropertyDetail mount)
- DealDrawer: `StatusSelector` badge + Call/Email buttons if dm data present
- PropertyDetail Overview tab: `StatusSelector`

**Acceptance criteria:**
- [ ] Phone and email are clickable links
- [ ] Copy buttons work via `navigator.clipboard`
- [ ] Low confidence badge shows when `dm.conf < 60`
- [ ] Log Contact opens modal; submit creates entry; timeline updates
- [ ] Status selector visible in DealDrawer and PropertyDetail Overview

**Estimated effort:** 3 hours

---

### STORY-2.7 — Contact status filter in MyDealsView

**Files:** `src/views/MyDealsView.jsx`

**What:** "Has contact info" toggle in filter bar — shows only deals where `deal.dm?.phone || deal.dm?.email` is non-null. "Contacted" chip on rows where `contacts[deal.id]?.length > 0`. Status badge visible on each row.

**Acceptance criteria:**
- [ ] Toggle in filter bar works correctly
- [ ] Contacted chip visible on rows with any contact log entry
- [ ] Status badge visible on each deal row

**Estimated effort:** 1 hour

---

## Phase 3 — Deal Management UX
*Frontend only. Estimated: 3 days.*

---

### STORY-3.1 — Deal aging indicator

**Files:** `src/lib/format.js`, `src/lib/format.test.js`, `src/components/DealComponents.jsx`, `src/views/MyDealsView.jsx`

**What:** Add `agingColor(days)` to `format.js`. Add aging chip to DealCard and deal row cards using `deal.days`. Color: green <= 7, amber <= 30, muted > 30.

**Acceptance criteria:**
- [ ] Aging chip visible on deal row cards in MyDealsView
- [ ] Aging chip visible on DealCard in DashboardView
- [ ] Colors correct per tier using CSS tokens
- [ ] Unit test for `agingColor` in `format.test.js`

**Estimated effort:** 1 hour

---

### STORY-3.2 — Share button on PropertyDetail

**Files:** `src/components/PropertyDetail.jsx`

**What:** Share icon in PropertyDetail header. Click copies `window.location.href` via `navigator.clipboard`. Inline "Link copied!" toast auto-dismisses after 2 seconds. No external deps.

**Acceptance criteria:**
- [ ] Share button present in header
- [ ] `navigator.clipboard.writeText` called on click
- [ ] Toast appears and auto-dismisses after 2 seconds
- [ ] No new npm packages

**Estimated effort:** 45 minutes

---

### STORY-3.3 — Enhanced filtering in MyDealsView

**Files:** `src/views/MyDealsView.jsx`

**What:** Add Distress Type and Owner Type multi-select filters. Persist all 6 filters to `localStorage` under key `parcyl-deals-filters` (JSON object `{ box, range, klass, sort, distressTypes[], ownerTypes[] }`). Initialize from localStorage on mount.

**Distress Type options:** derived from signal types present in loaded deals. Owner Type: Individual, LLC, Trust, Corporate (from `deal.entityType`). Reset Filters clears localStorage entry.

**Acceptance criteria:**
- [ ] Both filters render and filter correctly
- [ ] All 6 filters persist across page refresh
- [ ] Reset Filters clears all 6 and clears localStorage entry

**Estimated effort:** 3 hours

---

### STORY-3.4 — Global search in ParcylBar

**Files:** `src/components/ParcylBar.jsx`

**What:** Search input in top nav. Filters loaded deals from DealsContext on address, owner name, city, zip. Results dropdown (max 8, address + score). Click navigates to `/deal/:id`. Dropdown shows after 2+ chars typed. "No results for [query]" when empty match. Closes on Escape or outside click.

**Acceptance criteria:**
- [ ] Search input in ParcylBar
- [ ] Dropdown appears after 2+ characters
- [ ] Clicking result navigates to deal
- [ ] No results state shown correctly
- [ ] Closes on Escape and outside click

**Estimated effort:** 2.5 hours

---

## Phase 4 — Buy Box Improvements
*Frontend + backend. Estimated: 2 days.*

---

### STORY-4.1 — Backend: buy box PATCH and preview routes

**Repo:** `~/parcyl/scoutgpt-api`

**What:** `PATCH /api/dealfeed/buy-boxes/:id` — accepts full edit payload or `{ status }` patch, returns updated buy box. `POST /api/dealfeed/buy-boxes/preview` — dry-run count query, returns `{ estimated_count: number }`.

**Acceptance criteria:**
- [ ] PATCH updates buy box and returns updated record
- [ ] PATCH `{ status: 'paused' }` only updates status
- [ ] Preview POST returns count without modifying data

**Estimated effort:** 3 hours

---

### STORY-4.2 — Wire Edit button in BuyBoxesView

**Files:** `src/views/BuyBoxesView.jsx`, `src/components/ConfigurationOverlay.jsx`, `src/contexts/DealsContext.jsx`

**What:** Edit button opens `ConfigurationOverlay` in `mode="edit"` with `initialData` pre-populated from buy box record. On save: PATCH, refetch list, close overlay. ConfigurationOverlay accepts `mode` and `initialData` props; submit label changes per mode.

**Acceptance criteria:**
- [ ] Edit opens overlay with pre-populated data
- [ ] Save sends PATCH to correct endpoint
- [ ] On success, overlay closes and list updates
- [ ] Create mode still works as before

**Estimated effort:** 3 hours

---

### STORY-4.3 — Pause/Resume and match preview

**Files:** `src/views/BuyBoxesView.jsx`, `src/components/ConfigurationOverlay.jsx`

**What:** Pause: show ConfirmModal before PATCH `{ status: 'paused' }`. Resume: PATCH `{ status: 'active' }` directly. Match preview: debounce 800ms after form change when Geography + Asset Class both filled; show count in sticky Review bar; spinner while in flight.

**Acceptance criteria:**
- [ ] Pause shows ConfirmModal; confirm sends PATCH
- [ ] Resume sends PATCH directly
- [ ] Preview count shown in overlay Review bar
- [ ] Preview call debounced 800ms
- [ ] Loading spinner visible during preview

**Estimated effort:** 2.5 hours

---

## Phase 5 — Dashboard Upgrade
*Frontend only. Requires Phase 2 contacts data. Estimated: 2 days.*

---

### STORY-5.1 — Meaningful stat blocks

**Files:** `src/views/DashboardView.jsx`

**What:** Replace 4 static stat cards with computed versions. New This Week: `days <= 7`. Contacted: deals with contacts.length > 0. Hot Matches: `score >= 80`. Awaiting Response: status === 'Contacted' with no contact in 7+ days. Remove fake sparkline data arrays.

**Acceptance criteria:**
- [ ] All 4 stats computed from real data
- [ ] No hardcoded numeric data in stat cards
- [ ] Stats update when data updates

**Estimated effort:** 1.5 hours

---

### STORY-5.2 — Live map pins on dashboard

**Files:** `src/views/DashboardView.jsx`

**What:** Replace `MapBackground` + hand-placed MapPin cluster with real `<DealMap>` showing top 10-15 deals by score. `withPopup={true}`. `onClickDeal` navigates to `/deal/:id`.

**Acceptance criteria:**
- [ ] Real DealMap renders in dashboard panel
- [ ] Top scored deals show as pins
- [ ] Clicking pin navigates to deal
- [ ] `MapBackground` import removed

**Estimated effort:** 1.5 hours

---

### STORY-5.3 — Activity feed

**Files:** `src/views/DashboardView.jsx`

**What:** "Recent Activity" section below stat grid. Last 5 contact log entries across all deals from contacts map. Each entry: date, deal address, channel, outcome. Click navigates to deal. Hidden if no contacts exist.

**Acceptance criteria:**
- [ ] Shows up to 5 most recent entries
- [ ] Each entry clickable, navigates to deal
- [ ] Hidden when no contacts exist

**Estimated effort:** 1.5 hours

---

## Phase 6 — Property Detail Polish
*Frontend only. Estimated: 1 day.*

---

### STORY-6.1 — Overview tab executive summary restructure

**Files:** `src/components/PropertyDetail.jsx`

**What:** Restructure Overview tab above-the-fold: score badge (prominent), asset class chip, full address, assessed value, hold period, owner name + Call/Email buttons (Phase 2 pattern), top 3 distress signals as colored chips. Remaining content stays below.

**Acceptance criteria:**
- [ ] All listed elements visible above fold at 1280px viewport
- [ ] Quick-contact buttons use tel/mailto pattern from Phase 2
- [ ] Top 3 signals use existing SignalPill component

**Estimated effort:** 2 hours

---

### STORY-6.2 — Distress signals severity hierarchy

**Files:** `src/components/tabs/DistressTab.jsx`

**What:** Group by tier. Critical: Tax Delinquency, Foreclosure (left border `var(--danger)`). Moderate: Long-Term Hold, No Permits Filed (left border `var(--warning)`). Informational: Absentee, Inactive Entity (muted). Tier headers shown even when tier is empty.

**Acceptance criteria:**
- [ ] Three tier sections with headers
- [ ] Signals in correct tiers
- [ ] Left border colors use CSS tokens
- [ ] Empty tier shows "No [tier] signals" message

**Estimated effort:** 1.5 hours

---

### STORY-6.3 — Aerial image prominent with lightbox

**Files:** `src/components/PropertyDetail.jsx`

**What:** Move AerialThumb to top of Overview tab, larger panel. "View Full Screen" button opens inline lightbox: dark full-screen backdrop, image centered, close on backdrop click or Escape key. No new npm packages.

**Acceptance criteria:**
- [ ] AerialThumb at top of Overview, visually larger
- [ ] Lightbox opens on "View Full Screen" click
- [ ] Closes on backdrop click and Escape
- [ ] No new npm packages added

**Estimated effort:** 1.5 hours

---

## Implementation Order

| Phase | Stories | Backend? | Blocker |
|---|---|---|---|
| 1 | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | No | None — ready to start |
| 2 | 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7 | Yes | Brady: confirm skip data + migration 030 |
| 3 | 3.1, 3.2, 3.3, 3.4 | No | Phase 2 complete |
| 4 | 4.1, 4.2, 4.3 | Yes | Brady: available for backend review |
| 5 | 5.1, 5.2, 5.3 | No | Phase 2 complete (contacts map) |
| 6 | 6.1, 6.2, 6.3 | No | Phase 2 complete (tab extraction) |
