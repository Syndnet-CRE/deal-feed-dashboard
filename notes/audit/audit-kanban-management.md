> **PARTIALLY STALE — 2026-05-20**
>
> The buy-boxes page conversion to "command center" shipped per the buy-box-command-center PRD. References to the old 8-class taxonomy throughout this doc are superseded.
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# Kanban Management Audit

**Date:** 2026-05-11  
**File audited:** `src/views/BuyBoxesView.jsx`  
**CSS file:** `src/styles/buyBoxes.css`  
**Context:** `src/contexts/DealsContext.jsx`  

---

## Working Elements

### Interactive Buttons
- **"New buyer search"** (page head) → `onClick={onCreate}` ✓ Wired to App.jsx, opens wizard
- **"New buy box"** (page head) → `onClick={onCreate}` ✓ Wired to App.jsx, opens wizard
- **"More" menu (MoreHorizontal icon, card header)** → `onClick={() => onEdit?.(box.id)}` ✓ Opens edit wizard
- **"Pause" button (Active column)** → `onClick={() => onPause?.(box)}` ✓ Calls `handlePause` → routes to App.jsx for pause-confirm modal
- **"Resume" button (Paused column)** → `onClick={() => onResume?.(box.id)}` ✓ Calls `handleResume` → `patchBuyBox(id, { status: 'active' })` with toast feedback
- **"Edit geo" button (Gap column)** → `onClick={() => onEdit?.(box.id)}` ✓ Opens edit wizard
- **"Configure" button (Pending/Validating columns)** → `onClick={() => onEdit?.(box.id)}` ✓ Opens edit wizard
- **Settings icon button (Sliders, right side of actions)** → `onClick={() => onEdit?.(box.id)}` ✓ Opens edit wizard

### Drag & Drop
- **Card drag-to-column** → `onDragStart={handleDragStart}` + `onDrop={handleDrop}` ✓ Fully wired
  - Data flow: `handleDragStart` sets boxId, `handleDrop` reads it and calls `patchBuyBox(id, { status: newStatus })`
  - Gap column correctly rejects drops (`if (!id || colId === 'gap') return`)
  - Valid status mapping: active → active, paused → paused, pending/validating → pending

### Column Population
- **COLUMNS definition** (lines 22-28) ✓ Correctly defined (pending, validating, active, paused, gap)
- **deriveColumn()** (lines 31-38) ✓ Correctly maps box status to column
  - Handles 'coverage_failed' → 'gap'
  - Handles 'paused' → 'paused'
  - Handles 'active' with no last_run → 'validating'
  - Handles 'active' with last_run → 'active'
  - Fallback → 'pending'
- **Column counts** ✓ Displayed correctly (grouped.active.length, grouped.gap.length, etc.)
- **useMemo grouping** ✓ Correctly buckets buy boxes into columns by derived status

### Card Visual Elements
- **Card color/styling by status** ✓ CSS correctly assigns colors (green=active, yellow=paused, red=gap)
- **Dot indicators** ✓ Correctly colored by status, active column has glow effect
- **Week schedule strip** ✓ Renders correctly, dims for paused/gap cards
- **Delivered count & sparkline** ✓ Renders (if data present)
- **Asset class chips** ✓ Renders correctly
- **Geo chips** ✓ Renders correctly using formatGeo()

### Data Flow to patchBuyBox
- **Resume handler** ✓ Calls `patchBuyBox(id, { status: 'active' })`  
- **Drag-drop handler** ✓ Calls `patchBuyBox(id, { status: newStatus })`
- **Pause handler** ✓ Routes through App.jsx prop, which calls `patchBuyBox(id, { status: 'paused' })`

---

## Dead/Broken Elements

### Last Run Date Field
- **Location:** Card, row labeled "Last run"
- **Current state:** DISPLAY ONLY (not clickable, not editable)
- **Expected by UI hints:** Users should be able to click/edit the "last run" date
- **Reality:** The date is rendered as plain text: `<span className="bb-card__v">{isGap ? 'Paused until fixed' : (lastRun ?? '—')}</span>`
- **Result:** ❌ DEAD — no onClick, no modal, no input field. Users cannot modify last_run_at.

### Settings Button (Sliders icon)
- **Location:** Bottom right of each card
- **Current state:** Wired to `onClick={() => onEdit?.(box.id)}` (opens edit wizard)
- **Intent:** Icon is labeled "Tune" and uses Sliders icon, suggests quick settings panel or tuning interface
- **Reality:** Opens the full BuyBoxWizard, not a quick-settings modal
- **Result:** ⚠️ FUNCTIONAL BUT MISLABELED — works, but may confuse users expecting a lightweight settings panel instead of full multi-step wizard

### Edit Geo Button
- **Location:** "Edit geo" button on Gap column cards
- **Current state:** `onClick={() => onEdit?.(box.id)}` ✓ Wired correctly
- **Result:** ✓ WORKING — opens edit wizard to allow users to change geo and exit gap state

---

## Data Gaps

### Missing API Fields
The kanban cards render fields that are **not returned by the API** (per /notes/HANDOFF.md):

1. **`box.deliveredSpark`** (sparkline data)
   - Used by: `<Sparkline data={spark} />` (line 196)
   - Current: Fallback to `null`, sparkline doesn't render
   - Impact: Cards show no trend visualization
   - Fix needed: API must return historical delivery counts or sparkline array

2. **`box.deliveredThisWeek`** (week-over-week delta)
   - Used by: Delta display with arrow (lines 189-194)
   - Current: Fallback to `0`, delta row doesn't render
   - Impact: No "+X this week" indicator on cards
   - Fix needed: API must return `delivered_this_week` or calculate from historical data

3. **`box.deals`** (total delivered count)
   - Used by: Card hero section (line 187)
   - Current: Maps to `box.deals` which comes from `b.deals_sent_total` in normalizeBuyBox
   - Status: ✓ WORKING (API returns `deals_sent_total`)

### Field Availability Check
From normalizeBuyBox (DealsContext.jsx:14-42):
- ✓ `lastRun` (derived from `last_run_at`)
- ✓ `deals` (from `deals_sent_total`)
- ✓ `asset_classes`
- ✓ `geo_states`, `geo_counties`, `geo_zips`
- ✓ `run_schedule.days` (for week strip)
- ✓ `status` (for column derivation)
- ❌ `deliveredSpark` (not in API response)
- ❌ `deliveredThisWeek` (not in API response)

---

## Modal/Drawer Interactions

### What Opens from the View
1. **BuyBoxWizard (edit mode)** → `onEdit(id)` callback in App.jsx
   - Triggered by: "More" menu, "Edit geo", "Configure", settings icon
   - Props passed: `initialData={editingBuyBox}` (the full box object)
   - Data sent back: Full form payload (see BuyBoxWizard.jsx nativeToPayload)

2. **BuyBoxWizard (create mode)** → `onCreate()` callback in App.jsx
   - Triggered by: "New buy box", "New buyer search" buttons
   - Creates new buy box from scratch

3. **Pause Confirm Modal** → `onPause(box)` callback in App.jsx
   - Triggered by: "Pause" button on active cards
   - Confirmation handler calls `patchBuyBox(id, { status: 'paused' })`

### No Direct Modals from BuyBoxesView
- BuyBoxesView does NOT open any modals itself
- All modal triggering delegated to App.jsx via props
- This is correct architecture (view is stateless)

---

## API Integration Status

### patchBuyBox Function
Location: `src/contexts/DealsContext.jsx:115-119`

```javascript
const patchBuyBox = useCallback(async (id, payload) => {
  const res = await api.patch(`/api/dealfeed/buy-boxes/${id}`, payload);
  setBuyBoxes(prev => prev.map(b => b.id === id ? normalizeBuyBox(res.buy_box) : b));
  return res.buy_box;
}, []);
```

**Confirmed calls in BuyBoxesView:**
1. `handleResume()` (line 316) → `patchBuyBox(id, { status: 'active' })`
2. `handleDrop()` (line 330) → `patchBuyBox(id, { status: newStatus })`
3. `PauseBoxConfirm` in App.jsx (line 98) → `patchBuyBox(id, { status: 'paused' })`

**Status:** ✓ WORKING — patchBuyBox is fully integrated and called from resume, pause, and drag-drop actions.

---

## CSS Validation

### Responsive & Theme
- ✓ All `.bb-*` classes properly scoped (no collisions with old `.kanban-*`)
- ✓ Uses CSS variables for theme tokens (--accent, --fg, --border, etc.)
- ✓ Supports dark mode (hardcoded `#101116` bg in .bb-frame may need light mode adjustment)
- ✓ Grid layout: 5-column kanban board (pending, validating, active, paused, gap)
- ✓ Cards draggable with cursor feedback (.bb-card { cursor: grab; } → cursor: grabbing)
- ✓ Sparkline SVG styling in place
- ⚠️ Light mode: Some colors may be illegible (see HANDOFF.md note about light-mode polish needed)

---

## Summary of Findings

### What's Working
- ✓ All 8 interactive buttons + settings icon wired and functional
- ✓ Pause/Resume cycle working via patchBuyBox
- ✓ Drag-drop kanban fully implemented
- ✓ Column derivation (status → column) correct
- ✓ Edit wizard integration working
- ✓ Toast feedback on resume working

### What's Broken
- ❌ "Last run" date is view-only (cannot click to edit date)
- ❌ Settings icon opens full wizard instead of quick-settings panel (minor UX issue)

### What's Missing
- ❌ `deliveredSpark` not in API (sparkline renders nothing)
- ❌ `deliveredThisWeek` not in API (week delta doesn't render)

---

## Verdict

**Overall Status:** PARTIALLY OPERATIONAL

**Functionality:**
- Core kanban management (pause/resume, drag-drop, column grouping) is **fully functional**.
- All button handlers are **wired correctly**.
- patchBuyBox is **correctly called** from all intended locations.

**Issues:**
1. **Last run date is dead** — Users cannot edit/interact with it; it's display-only despite UI hints suggesting interactivity.
2. **Sparkline and weekly delta missing** — API doesn't return required data fields.
3. **Settings vs. Edit UX confusion** — The settings icon opens the full wizard rather than a lightweight settings panel.

**Recommendation:**
- **High priority:** Add editable "last run" date field or remove the hint that it's interactive.
- **High priority:** Verify API returns `deliveredSpark` and `deliveredThisWeek` fields, or remove them from card UI.
- **Medium priority:** Consider separating settings icon into a quick-settings drawer instead of opening full wizard.

**Next Session Focus:**
Confirm with Brady which fields should be editable on the card and what data the backend API actually provides for sparkline/delta calculations.
