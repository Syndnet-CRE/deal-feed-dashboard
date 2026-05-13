# PRD: Buy Box Command Center
Feature: buy-box-command-center
Status: Ready for BMAD execution
Date: 2026-05-10

---

## Overview

Transform the Buy Boxes page from a passive Kanban status board into a full command center. Each buy box card becomes a live window into its deal pipeline, match performance, and new-deal notifications. The wizard is reordered and expanded with a cascading geo picker, asset-specific criteria fields, and a new match threshold step. The entire buy box surface (page + wizard) becomes the primary onboarding and deal management hub.

---

## Problem Statement

Current state problems:
1. Wizard starts with Name — users don't know what to name a box before choosing what asset they're targeting
2. Geo picker is a flat mode toggle with no cascading — users can't drill from state to county to city
3. Criteria fields are generic — land buyers see unit count fields, multifamily buyers see acreage fields
4. No match threshold control — users can't tune deal volume vs. accuracy
5. Kanban card shows `deals_sent_total` only — no pipeline visibility, no last-run time, no new-deal badge
6. Silent error handling — patchBuyBox, handleDrop, handleResume all swallow errors with no toast
7. handleDrop passes parseInt(boxId) — UUIDs break silently (returns NaN, patchBuyBox receives NaN)
8. No empty state — zero buy boxes shows a blank Kanban board
9. No background surface — Kanban columns float on raw page background with no framing
10. "New Buyer Search" missing from page header

---

## Goals

- Wizard step order matches CRE investor mental model: asset first, then geography, then details
- Every action on BuyBoxesView has a success toast and an error toast
- Kanban card surfaces: new-deal count, pipeline summary, last run, match threshold badge
- Empty state drives users into the wizard
- Background container frames the Kanban board visually
- All patchBuyBox calls use UUID string IDs (never parseInt)

---

## Out of Scope

- Backend matcher integration for match_threshold (frontend sends it; backend stores it; matcher use is future sprint)
- County-level geo data (cascading stops at state → city for now; county level deferred until DB has county table)
- Hospitality and SFR criteria fields beyond the generic sf/value/year range (asset-specific fields for those two are basic)
- "New Buyer Search" button functionality (renders alongside "New Buy Box"; both open the same wizard for now)

---

## Files Modified

| File | Change |
|------|--------|
| `src/views/BuyBoxesView.jsx` | Full redesign — background surface, empty state, card expansion, UUID fix, toasts |
| `src/components/BuyBoxWizard.jsx` | Step reorder (10 steps), cascading geo, asset-specific criteria, match threshold step |
| `src/lib/wizardHelpers.js` | Add match_threshold to EMPTY_FORM, canProceedStep, buildPayload |
| `src/lib/buyBoxTaxonomy.js` | Already updated: SFR + Hospitality added |
| `src/styles/buy-box-wizard.css` | New styles for asset card grid, cascading geo, threshold slider |
| `src/styles/styles.css` | New styles for Kanban background surface, card expansion, empty state |
| `src/contexts/DealsContext.jsx` | Add toast on patchBuyBox error (currently silent) |

---

## No New Files Required

All changes are edits to existing files. No new components. No new contexts.

---

## API Contract

### Existing — no changes needed
- `GET /api/dealfeed/buy-boxes` — returns buy boxes with `last_run_at`, `deals_sent_total`, `status`
- `PATCH /api/dealfeed/buy-boxes/:id` — already accepts all fields
- `POST /api/dealfeed/onboarding` — create new buy box
- `POST /api/dealfeed/buy-boxes/preview` — returns `{ count }` for coverage check

### New field — backend must accept and persist
- `match_threshold: number (60–100)` — add to `df_buy_boxes` table column via migration
- PATCH and POST /onboarding both pass this field; backend should store it
- If backend doesn't have the column yet, it silently ignores the field — frontend still works

### New endpoint needed (future sprint — mark as TODO in code)
- `GET /api/dealfeed/buy-boxes/:id/deals` — deals matched by this specific buy box
- Used for per-box pipeline drawer (deferred to next sprint; placeholder button in card)

---

## Design Tokens

All colors and spacing from `src/styles/tokens.css`. Key tokens for this feature:
- `--bg-card` — Kanban card background
- `--bg-panel` — background container surface behind Kanban
- `--border` — card and container borders
- `--green` — active status, success states
- `--warning` — coverage gap, sparse coverage
- `--danger` — error toasts, coverage failed
- `--text-secondary` — secondary labels, stat values
- `--radius-lg` — container radius
- `--radius-md` — card radius

---

## Part 1: BuyBoxesView.jsx — Full Spec

### Layout

```
page.kanban-page
  page-head
    [title block]
    [button group: "New Buyer Search" (secondary) | "New Buy Box" (primary)]
  kanban-surface          ← NEW: background container card wrapping the board
    kanban-board
      KanbanColumn × 5
```

### Background Surface

`.kanban-surface` — a card-style container wrapping the entire Kanban board:
- Background: `var(--bg-panel)` or slight inset from page bg
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-lg)` (12–16px)
- Padding: 20px
- No shadow (the columns themselves provide depth)

### Page Header

```
[h1: "Buyer Searches"]      ← rename from "Buy Boxes" (more investor-friendly)
[sub: "N active"]

[btn.secondary: "+ New Buyer Search"]
[btn.primary: "+ New Buy Box"]
```

Both buttons call `onCreate` for now. "New Buyer Search" gets a distinct icon (I.Search or Crosshair) to signal it's a different entry point — even if behavior is identical today.

### Empty State

When `buyBoxes.length === 0`:
- Hide the Kanban board entirely
- Show a centered empty state inside `kanban-surface`:
  - Icon: a large, low-contrast search/target icon
  - Headline: "No buyer searches yet"
  - Sub: "Set up your first search and we'll find matching deals nightly."
  - CTA button (primary): "Create Your First Buy Box" → calls `onCreate`

### KanbanCard — Expanded Detail

Current card shows: name, geo, deals_sent_total, asset_class, schedule row, action buttons.

New card shows:

```
[card head]
  [name]
  [settings gear → onEdit]

[asset line]
  [asset class chip] [sub-asset count if > 0: "+ 3 types"]

[geo line]
  [pin icon] [formatGeo(box)]

[stats row]
  [deals_sent_total delivered]   [last_run display]   [match_threshold badge if set]

[new-deal badge] ← if box has unread deals (see below)

[schedule row]  ← existing day toggles

[action buttons]  ← existing pause/resume/edit geo/activating
```

**New-deal badge logic:**
- Field: `box.new_deal_count` — an integer the backend returns alongside the buy box (count of deals matched since subscriber's last login)
- If `box.new_deal_count > 0`: show a green pill "3 new" in the card head next to the name
- If 0 or null: show nothing
- Backend: add `new_deal_count` to `GET /api/dealfeed/buy-boxes` response (future sprint — mark as TODO; render nothing if field absent)

**Last run display:**
- Field: `box.lastRun` already computed by `normalizeBuyBox()` in DealsContext
- Show as: "Last run May 9" (short date only, no time — space-efficient)
- If never run: "Never run" in `var(--text-secondary)`

**Match threshold badge:**
- If `box.match_threshold` is set: small badge showing `{box.match_threshold}% match`
- Color: neutral (not green/red — it's a preference, not a status)
- Tooltip: "Minimum match score for deals to be delivered"

**Asset line:**
- `box.asset_class` formatted as title case
- If `box.asset_use_codes?.length > 0`: show how many subtypes are selected as a dim secondary label

### All Toasts (BuyBoxesView)

Every action must have a success and error toast. No silent swallowing.

| Action | Success Toast | Error Toast |
|--------|--------------|-------------|
| Resume box | "Search resumed — runs tonight." | "Failed to resume. Try again." |
| Pause box | "Search paused." | "Failed to pause. Try again." |
| Toggle schedule day | "Schedule updated." | "Failed to update schedule." |
| Drag to new column | "Status updated." | "Failed to update status." |

Add `const addToast = useToast()` to `BuyBoxesView` and pass toast callbacks into handlers.

### UUID Bug Fix

`handleDrop` line 98:
```js
// WRONG (current):
const boxId = parseInt(e.dataTransfer.getData('boxId'), 10);

// CORRECT:
const boxId = e.dataTransfer.getData('boxId');
if (!boxId) return;
```

`handleToggleDay` line 158 — `buyBoxes.find(b => b.id === boxId)` — works correctly as string already if boxId is not parseInt'd. No change needed there once drag is fixed.

### Hover States

- `.kanban-card`: subtle box-shadow lift on hover (`box-shadow: 0 4px 16px rgba(0,0,0,0.15)`, transition 150ms)
- `.kanban-day-btn`: background shift on hover (existing on/off state; add hover between states)
- `.kanban-btn` (pause/resume/edit geo): already styled; confirm hover uses `var(--green)` tint
- `.kanban-card-settings` gear: rotate 30deg on hover (transform transition 200ms)
- `.kanban-col-head`: no hover (it's not interactive)
- New-deal badge: no hover (it's read-only)

### Tooltip Targets

All tooltips use native `title` attribute (consistent with existing codebase pattern):

| Element | Tooltip |
|---------|---------|
| New-deal badge | "N deals matched since your last login" |
| Match threshold badge | "Minimum match score for deals to be delivered" |
| Schedule day button (already has `title={d}`) | Expand to full day name: `title="Monday"` etc. |
| Settings gear | Already has `title="Edit"` — keep |
| "Activating…" status | `title="This search is being set up. First run tonight."` |
| Coverage Gap column header | `title="No parcel data available for this geography. Edit the geo to fix."` |

---

## Part 2: BuyBoxWizard.jsx — Full Spec

### New Step Order (10 steps)

| Step | Label | Required | Gate |
|------|-------|----------|------|
| 1 | Asset Class | Yes | asset_class must be set |
| 2 | Sub-Asset | No | auto-advance if asset has no subtypes (none currently have 0) |
| 3 | Name | Yes | label.trim().length > 0 |
| 4 | Geography | Yes | activeGeoHasData(form) |
| 5 | Criteria | No | always can proceed |
| 6 | Ownership | No | always can proceed |
| 7 | Distress Signals | No | always can proceed |
| 8 | Match Threshold | No | always can proceed (pre-filled at 80) |
| 9 | Schedule | No | always can proceed |
| 10 | Review | — | submit |

### STEP_LABELS update

```js
const STEP_LABELS = [
  'Asset Class', 'Sub-Asset', 'Name', 'Geography',
  'Criteria', 'Ownership', 'Distress', 'Match Threshold', 'Schedule', 'Review',
];
```

### EMPTY_FORM additions

```js
const EMPTY_FORM = {
  // ... existing fields ...
  match_threshold: 80,  // NEW — default 80%
};
```

### toFormState additions

```js
match_threshold: box.match_threshold ?? 80,
```

### canProceedStep updates (wizardHelpers.js)

```js
// Step 1: asset_class required
case 1: return !!form.asset_class;

// Step 2: sub-asset — always can proceed (optional)
case 2: return true;

// Step 3: name required
case 3: return form.label.trim().length > 0;

// Step 4: geography required (use existing activeGeoHasData)
case 4: return activeGeoHasData(form);

// Steps 5–9: always can proceed
case 5: case 6: case 7: case 8: case 9: return true;
```

### buildPayload additions (wizardHelpers.js)

```js
// Add to returned payload object:
match_threshold: toNum(form.match_threshold) || 80,
```

### Coverage Check — move to Step 4

Currently fires when `step === 2`. Change to `step === 4` after step reorder.

### handleSubmit — step count update

Change `if (step === 9)` to `if (step === 10)`.

---

### Step 1 — Asset Class (NEW render, replaces old renderStep3)

Full-screen card grid. No secondary content. Asset class selection is the only thing on this step.

**Layout:** 2×4 grid (8 asset classes: Multifamily, Industrial, Retail, Office, Land, Special Purpose, Single Family, Hospitality)

**Card anatomy:**
```
[large icon — 32px]
[label — 16px semi-bold]
[description — 12px secondary, 2 lines max]
```

**States:**
- Default: border `var(--border)`, bg `var(--bg-card)`
- Hover: border `var(--green)` at 40% opacity, slight bg lift
- Selected: border `var(--green)`, bg green at 8% opacity, checkmark in top-right corner
- Only one card can be selected at a time; selecting a new card clears the previous + clears `asset_use_codes`

**Icons:** Use existing `I.*` icon set from Icons.jsx. Map:
- Multifamily → I.Building (or similar)
- Industrial → I.Warehouse
- Retail → I.Store
- Office → I.Briefcase
- Land → I.Map
- Special Purpose → I.Star
- Single Family → I.Home
- Hospitality → I.Hotel

Use whatever closest icons exist. Don't import new ones.

**Touch area:** entire card is the button (no inner button — the card div is the click target)

**Error:** if touched and no selection: inline error "Select an asset class to continue."

---

### Step 2 — Sub-Asset (NEW render, replaces old renderStep4)

Conditional rendering based on selected asset class. Shows subtypes from `ASSET_CLASSES.find(c => c.id === form.asset_class).subtypes`.

**Layout:** Chip grid (not card grid — smaller, multi-select)

**Chip anatomy:**
```
[label]  [optional: dim "code NNN" if useful]
```

**States:**
- Default: outlined chip, border `var(--border)`
- Hover: border `var(--green)` at 40%
- Selected: filled chip, bg `var(--green)` at 15%, border `var(--green)`
- Multi-select: user can pick any number, or zero (optional step)

**"Select All" shortcut:** A small text link "Select all" / "Clear all" above the chip grid.

**Summary:** Below chips, show: "N subtypes selected" in secondary text. If 0: "All types will be included."

**No error state** — this step is optional.

---

### Step 3 — Name (replaces old renderStep1)

Identical to current renderStep1 with one enhancement:

**Contextual placeholder:** dynamically generated from asset_class and geo selection if available.
```js
const placeholder = form.asset_class
  ? `e.g. ${capitalize(form.asset_class)} — ${form.geo_states[0] || 'Your Market'}`
  : 'e.g. Austin Storage Play, DFW Industrial Watch';
```

**Context chips at top of step:** Show "Buying: {asset_class label}" as a read-only confirmation chip so the name feels contextual.

---

### Step 4 — Geography (replaces old renderStep2, with cascading upgrade)

Keep the existing mode tabs (State, Metro, Zip, Radius) but enhance State mode with a search filter:

**State mode enhancement:**
```
[search input: "Filter states..."]
[scrollable checkbox list — filtered by search]
[selected count: "3 states selected"]
```

**Metro mode:** existing search + checkbox list — no change needed.

**Zip mode:** existing chip input — no change needed.

**Radius mode:** existing address + slider — no change needed.

**Coverage badge:** keep existing coverage check logic, now fires when `step === 4`.

**Note on cascading geo:** Full state→county→city→zip cascading is deferred. The state filter search achieves 80% of the UX improvement without requiring county data. Add a `// TODO: cascading county/city picker` comment above the state section.

---

### Step 5 — Criteria (asset-specific, replaces old renderStep5)

Render different field groups based on `form.asset_class`. All fields are optional.

**Universal fields (all asset classes):**
- Value range: `value_min` / `value_max` — "Estimated Value" with `$` prefix inputs
- Year built range: `year_built_min` / `year_built_max`
- Min hold years: `min_hold_yrs` — "Owner Hold (years)"

**Asset-specific fields:**

`land`:
- Acreage range: `acres_min` / `acres_max`
- Zoning codes: chip multi-select (existing `zoning_codes` field) — common codes: AG, R1, R2, C1, C2, I1, MU, PD

`multifamily`:
- Unit count range: `sf_min` / `sf_max` labeled as "Unit Count Min / Max" (reusing sf fields — note in code)
- Zoning codes chip (same as land)

`sfr`:
- Sq footage range: `sf_min` / `sf_max` — "Square Footage"

`industrial`, `retail`, `office`:
- Sq footage range: `sf_min` / `sf_max`

`hospitality`:
- Room count range: `sf_min` / `sf_max` labeled "Room Count Min / Max"

`special_purpose`:
- Sq footage range: `sf_min` / `sf_max`

**Layout:** two-column grid for range inputs (min | max). Single-column for checkboxes and chips.

**Range input pattern:**
```
[label: "Estimated Value"]
[input: "Min $"] [—] [input: "Max $"]
```

---

### Step 6 — Ownership (replaces old renderStep6)

Identical logic, redesigned visual.

**Replace checkboxes with large chip-buttons:**
- Individual, LLC / Entity, Trust, Corporate — multi-select chips
- Same selected/unselected states as Sub-Asset step
- "Select all" / "Clear all" link

**Add below chips:**
- Toggle: "Absentee owner only" — boolean switch
- Toggle: "Out-of-state owner only" — boolean switch
- Both use a styled toggle (not a checkbox) for visual hierarchy

**No error state** — optional step.

---

### Step 7 — Distress Signals (replaces old renderStep7)

Same data (`distress_signals`, `distress_only`, `distress_match_mode`), enhanced layout.

**Replace flat checkboxes with chip-buttons** (same pattern as Ownership).

**Add per-signal tooltip:** Each chip has a `title` attribute with a one-sentence explanation:
- "Active foreclosure record" → "Property has a recorded notice of default or foreclosure filing."
- "Tax delinquent" → "Owner owes back property taxes."
- "Absentee owner" → "Owner's mailing address differs from the property address."
- "Long-term hold" → "Property has been owned 10+ years with no refinance."
- "Quit claim deed in history" → "Property was transferred via quit claim, often a distress indicator."
- "Non-arms-length prior sale" → "Last sale was between related parties, often below market."
- "Investor buyer at last purchase" → "Last buyer was an investor entity, not owner-occupant."
- "ARM mortgage" → "Owner has an adjustable-rate mortgage — rate resets may cause stress."
- "High LTV (>80%)" → "Owner is highly leveraged relative to property value."
- "Free and clear (no mortgage)" → "No recorded mortgage — owner has equity to negotiate with."

**Match mode toggle:** Keep existing `distress_match_mode` (any / all) — style as a segmented control, not a dropdown.

**distress_only toggle:** "Distress signals required" — boolean switch same as Ownership step.

---

### Step 8 — Match Threshold (NEW step)

**Single interactive element:** a range slider from 60 to 100, step 5.

**Layout:**
```
[step title: "Match Precision"]
[step desc: "Control the tradeoff between deal volume and match accuracy."]

[slider: 60 ———————●——— 100]

[left anchor label]          [right anchor label]
"More Deals"                 "Fewer, Better Deals"
"Lower match threshold"      "Higher match threshold"

[description block — updates as slider moves]
```

**Description block copy by threshold value:**
- 60–65: "You'll see every deal that matches at least 6 of 10 criteria. Expect a high-volume feed with some misses."
- 70–75: "A broad feed with reasonable accuracy. Good for markets with limited inventory."
- 80 (default): "Balanced. You'll see most relevant deals without significant noise."
- 85–90: "A tighter, curated feed. Fewer deals, but they'll fit your criteria more closely."
- 95–100: "Only near-perfect matches. Expect very few deals — best for highly specific searches."

**Visual:** Slider track uses a gradient: left side `var(--warning)` blending to `var(--green)` on the right.

**No error state** — pre-filled at 80, always optional.

---

### Step 9 — Schedule (replaces old renderStep8)

Identical logic. Visual improvements only:

- Day chips replace the current small day buttons — use the same chip-button pattern as other steps
- Add description below: "Matching deals will be batched and delivered on selected days. Runs nightly between 1am–4am CT."
- "Run daily" shortcut link: selects all 7 days at once
- Show current selection summary: "Runs Mon / Wed / Fri" or "Runs daily" or "No days selected (use at least one)"

**No error state** — but show a soft warning (not blocking) if 0 days selected: "Select at least one day to receive deals."

---

### Step 10 — Review (replaces old renderStep9)

Summary of all 9 prior steps. Every section has an "Edit" link that calls `setStep(n)` to jump back.

**Sections:**

```
[Asset Class] — [edit → step 1]
  Multifamily · Duplex, Triplex, Quadruplex (or "All types")

[Name] — [edit → step 3]
  Dallas Multifamily

[Geography] — [edit → step 4]
  Texas, Oklahoma

[Criteria] — [edit → step 5]
  Value: $200K – $2M · Year built: 1980+ · Hold: 5+ yrs

[Ownership] — [edit → step 6]
  Individual, LLC · Absentee owner only

[Distress Signals] — [edit → step 7]
  Tax delinquent, Absentee owner (match any)

[Match Threshold] — [edit → step 8]
  80% — Balanced

[Schedule] — [edit → step 9]
  Runs Mon / Wed / Fri

[Coverage badge] — live count from last preview check
```

**Submit button:**
- Create mode: "Activate Search"
- Edit mode: "Save Changes"
- Loading state: spinner + disabled, text "Saving…"

---

### Wizard Error Handling

All existing error handling is fine. Confirm these toasts exist in handleSubmit:
- Success (create): "Buy box activated — we start tonight." ✓ (exists)
- Success (edit): "Buy box updated — takes effect tonight." ✓ (exists)
- Error: "Save failed. Please try again." ✓ (exists)

No changes needed to toast logic in the wizard.

---

### Wizard — Keyboard and Accessibility

- Escape: closes wizard (calls onCancel) — already implemented
- Enter on last step: submits — needs check; currently only Next button triggers submit
- Step dots (progress indicator): add `aria-label="Step N of 10"` and `aria-current="step"` on active dot
- All inputs: existing labels are sufficient
- Asset class cards: must be focusable with Tab and selectable with Space/Enter (convert from `div` to `button` if not already)

---

## Part 3: Empty State — First-Run Onboarding

When `buyBoxes.length === 0` and `loading === false`:

**Render inside kanban-surface instead of the Kanban board:**

```
[large icon: search/target, ~48px, low contrast]
[h2: "No buyer searches yet"]
[p: "Set up your first search and we'll match distressed properties to your criteria nightly."]
[button.primary: "Create Your First Buy Box"] → calls onCreate
```

This empty state replaces the MOCK_DEALS fallback problem — when a user has no buy boxes, they should be guided here, not to fake deal data.

---

## Part 4: DealsContext — Error Surface

`patchBuyBox` is called by BuyBoxesView but any errors are caught in the view layer after this change. The context itself can stay as-is. The view's try/catch handlers are where toasts fire.

One cleanup: `handleResume` currently has `catch (_) {}` — change to a proper error toast in the view.

---

## Stories (Implementation Order)

### Story BB-1: UUID Fix + Error Toasts (30 min)
**File:** `src/views/BuyBoxesView.jsx`
1. Fix `handleDrop` parseInt → string UUID
2. Add `const addToast = useToast()` import
3. Add toast (success + error) to: handleResume, handleDrop, handleToggleDay
4. Update `handleResume` catch to use addToast
**Test:** Drag a card to a new column; confirm toast fires. Toggle a day; confirm toast fires.

### Story BB-2: Page Layout + Background Surface (45 min)
**File:** `src/views/BuyBoxesView.jsx`, `src/styles/styles.css`
1. Rename page title "Buy Boxes" → "Buyer Searches"
2. Add "New Buyer Search" secondary button
3. Add `.kanban-surface` wrapper div around `.kanban-board`
4. Add CSS for `.kanban-surface`
5. Add empty state (renders when `buyBoxes.length === 0 && !loading`)
**Test:** Dev server; verify surface renders, empty state shows with 0 boxes.

### Story BB-3: KanbanCard Expansion (45 min)
**File:** `src/views/BuyBoxesView.jsx`, `src/styles/styles.css`
1. Add asset line (asset_class chip + subtype count)
2. Add last run display (from `box.lastRun` already in normalized data)
3. Add match_threshold badge (renders if `box.match_threshold` set)
4. Add new-deal badge (renders if `box.new_deal_count > 0` — gracefully absent)
5. Expand schedule day tooltips to full day names
6. Add hover lift to kanban-card
7. Add gear icon rotation on hover
**Test:** Dev server; inspect card with real buy box data.

### Story BB-4: wizardHelpers.js Updates (20 min)
**File:** `src/lib/wizardHelpers.js`
1. Add `match_threshold: 80` to EMPTY_FORM
2. Update `canProceedStep` for new 10-step order
3. Add `match_threshold` to `buildPayload` output
4. Update `toFormState` to read `match_threshold`
**Test:** `npm test` — all wizardHelpers.test.js tests must pass.

### Story BB-5: Wizard Step Reorder (60 min)
**File:** `src/components/BuyBoxWizard.jsx`
1. Update `STEP_LABELS` to 10-step array
2. Add `match_threshold: 80` to `EMPTY_FORM` (matches wizardHelpers)
3. Reorder `renderStep*` functions: asset(1), sub-asset(2), name(3), geo(4), criteria(5), ownership(6), distress(7), threshold(8), schedule(9), review(10)
4. Update `handleNext` to check `step === 10` for submit
5. Update coverage check `useEffect` to fire on `step === 4`
**Test:** Walk through wizard create flow end-to-end. Confirm step order, confirm submit fires on step 10.

### Story BB-6: Wizard Step 1 — Asset Class Card Grid (45 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Implement `renderStep1()` with 2×4 card grid
2. Cards are `<button>` elements with icon, label, description
3. Selected state: green border + bg tint + checkmark
4. Selecting new card clears `asset_use_codes`
5. Keyboard: Tab/Space/Enter selectable
**Test:** Dev server; click each card; confirm selection clears properly between cards.

### Story BB-7: Wizard Step 2 — Sub-Asset Chips (30 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Implement `renderStep2()` with chip-button multi-select
2. "Select all" / "Clear all" links
3. Selection count summary below
4. Always-can-proceed (optional step)
**Test:** Select Land; confirm Land subtypes appear. Select all; confirm all codes in form state.

### Story BB-8: Wizard Step 3 — Contextual Name (20 min)
**File:** `src/components/BuyBoxWizard.jsx`
1. Add context chips showing asset_class at top of name step
2. Dynamic placeholder based on asset_class
3. All other logic unchanged
**Test:** Select Multifamily in step 1, advance to step 3; confirm placeholder mentions multifamily.

### Story BB-9: Wizard Step 4 — Geo Search Enhancement (30 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Add state search filter input above state list
2. Show "N states selected" count below list
3. Coverage check now fires on step 4 (from BB-5)
4. Add `// TODO: cascading county/city picker` comment
**Test:** Type "tex" in state search; confirm only Texas shows. Select; confirm in form state.

### Story BB-10: Wizard Step 5 — Asset-Specific Criteria (45 min)
**File:** `src/components/BuyBoxWizard.jsx`
1. Implement `renderStep5()` with conditional field groups per `form.asset_class`
2. Universal fields: value range, year built range, min hold years
3. Asset-specific: sf/acres/units/rooms per class (spec above)
4. Zoning codes chips for land and multifamily
5. Two-column layout for range inputs
**Test:** Select Land; confirm acreage fields appear. Select Multifamily; confirm unit count fields appear.

### Story BB-11: Wizard Steps 6–7 — Ownership + Distress Chip Redesign (30 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Replace ownership checkboxes with chip-buttons
2. Add absentee_only and out_of_state_only toggle switches
3. Replace distress checkboxes with chip-buttons
4. Add per-signal tooltips (title attributes)
5. Style match_mode as segmented control
**Test:** Dev server; toggle chips; confirm form state updates.

### Story BB-12: Wizard Step 8 — Match Threshold (30 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Implement `renderStep8()` with range slider (60–100, step 5)
2. Left/right anchors ("More Deals" / "Fewer, Better Deals")
3. Dynamic description block by threshold value
4. Gradient track CSS
5. Default: 80
**Test:** Dev server; drag slider; confirm description updates. Confirm form.match_threshold updates.

### Story BB-13: Wizard Step 9 — Schedule Chips (20 min)
**File:** `src/components/BuyBoxWizard.jsx`, `src/styles/buy-box-wizard.css`
1. Replace day mini-buttons with chip-buttons
2. "Run daily" shortcut
3. Selection summary text
4. Soft warning if 0 days (non-blocking)
**Test:** Click "Run daily"; confirm all 7 days selected.

### Story BB-14: Wizard Step 10 — Review with Edit Links (30 min)
**File:** `src/components/BuyBoxWizard.jsx`
1. Add all 9 sections to review with edit → setStep(n) links
2. Add match_threshold display
3. Add sub-asset display
4. Confirm submit button labels correct per mode
**Test:** Walk to step 10; click Edit on Geography; confirm jumps to step 4. Submit; confirm toast.

### Story BB-15: E2E Smoke Test (30 min)
**File:** `tests/smoke.spec.js`
1. Add test: create buy box end-to-end (all 10 steps, submit)
2. Add test: edit existing buy box (open wizard in edit mode, change name, submit)
3. Add test: pause a buy box via card button
4. Add test: drag card to new column (if feasible in Playwright)
**Test:** `npx playwright test`

---

## Definition of Done

- [ ] All 15 stories implemented and individually tested
- [ ] `npm test` passes (wizardHelpers.test.js)
- [ ] `npx playwright test` passes (smoke suite including new tests)
- [ ] `npm run build` produces no errors
- [ ] `npm run lint` clean
- [ ] Dev server tested manually: full wizard create flow (all 10 steps), edit flow, pause/resume, drag-drop with toast
- [ ] No console.log in committed code
- [ ] No parseInt on UUID fields
- [ ] All 15 actions in BuyBoxesView have success + error toasts

---

## Session Start Command (for autonomous build)

```
cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions
```

Resume prompt:
```
Read notes/bmad/buy-box-command-center/PRD.md. Implement stories BB-1 through BB-15 in order. One story at a time. Run tests after each story. Do not skip stories. Do not ask for confirmation between stories. Report blockers only.
```
