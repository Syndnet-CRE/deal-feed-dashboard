# Architecture — buy-box-wizard-v2

Date: 2026-05-11
Feature: buy-box-wizard-v2
Repo: nightdrop-dashboard

## Component Structure

### BuyBoxWizard.jsx (Shell Container)

**Role:** Top-level wizard state machine and page routing.

**Props:**
```
{
  mode: 'create' | 'edit',
  initialData: null | BuyBoxObject,
  onSuccess: (savedBuyBox) => void,
  onCancel: () => void
}
```

**State:**
```
{
  currentPage: 1-6,
  form: { /* full form state matching EMPTY_FORM shape */ },
  matchCount: number | null,
  loading: boolean,
  error: string | null
}
```

**Responsibilities:**
- Initialize form from EMPTY_FORM (create) or toFormState(initialData) (edit).
- Render current page subcomponent based on currentPage.
- Render RightRail component.
- Handle Next/Back/Cancel/Submit button logic.
- Debounce preview API calls (400ms).
- API calls for create (POST /onboarding) and edit (PATCH /buy-boxes/:id).
- Error handling and user feedback (toast on error, preserve form on failure).
- Call onSuccess(savedBuyBox) on successful save, onCancel() on user cancel.

**No changes needed to App.jsx:** prop interface is identical to current BuyBoxWizard.

### Page Subcomponents

**Page1.jsx:**
- Asset class 8-card grid (sfr, small_mf, large_mf, commercial, industrial, mixed, land, hospitality).
- Geography: state combobox, county drill-down, ZIP chip input.
- Props: { form, setForm }
- Updates form.assets[], form.geo.states[], form.geo.counties[], form.geo.zips[]

**Page23.jsx:**
- Page 2: Physical ranges (sqft, lot, year, stories, units) + Financial (price, equity preset, assessed_below_market toggle).
- Page 3: Owner fields (entity multi-select, occupancy choice, hold min/max, out_of_state toggle).
- Props: { form, setForm }
- Updates form.phys.*, form.fin.*, form.owner.*

**Page4.jsx:**
- Distress signals (checklist), AND/OR logic (radio), climate/flood/wildfire/heat risk controls.
- Props: { form, setForm }
- Updates form.signals[], form.logic.mode, form.risk.*

**Page5.jsx:**
- Three threshold cards (70%/80%/90%).
- Props: { form, setForm }
- Updates form.threshold (0.7 / 0.8 / 0.9)

**Page6.jsx:**
- Name input, delivery cadence cards, max stepper, live match count hero, Activate button.
- Props: { form, setForm, matchCount, onActivate, isLoading }
- Updates form.name, form.delivery.cadence, form.delivery.max_per_run

### RightRail.jsx

**Props:** { form, matchCount, isLoading }

**Renders:**
- Debounced match count (400ms debounce).
- Delta indicator (up/down/stable trend).
- Three stat tiles (placeholder values for V1).
- Geographic concentration map thumbnail.
- Active filter chips (summary of selected values).

**No side effects:** all form updates come from pages; right rail is read-only display.

### Icons Module (icons.jsx)

Inline SVG icon functions (do not merge into src/components/Icons.jsx). Imported locally within the wizard.

## Form State Shape (EMPTY_FORM)

```javascript
const EMPTY_FORM = {
  assets: [],
  geo: {
    states: [],
    counties: [],
    zips: []
  },
  phys: {
    sf_min: null,
    sf_max: null,
    acres_min: null,
    acres_max: null,
    year_min: null,
    year_max: null,
    stories_min: null,
    stories_max: null,
    units_min: null,
    units_max: null
  },
  fin: {
    price_min: null,
    price_max: null,
    equity_preset: null,      // 0 | 25 | 50 | 75 (null = not selected)
    assessed_below_market: false
  },
  owner: {
    entity: [],
    occupancy: null,           // 'owner_occupied' | 'absentee' | null
    hold_min: null,
    hold_max: null,
    out_of_state: false
  },
  signals: [],                 // ['foreclosure', 'ltv', 'arm', 'equity', 'longhold']
  logic: {
    mode: 'or'                 // 'and' | 'or'
  },
  risk: {
    climate_max: 100,
    flood_exclude: false,
    wildfire_max: 100,
    heat_max: 100
  },
  threshold: 0.80,             // 0.70 | 0.80 | 0.90
  name: '',
  delivery: {
    cadence: 'daily',          // 'daily' | 'weekly' | 'realtime'
    max_per_run: 10
  }
}
```

## API Contract

### POST /api/dealfeed/onboarding (Create)

**Request Payload (from buildPayload):**
```javascript
{
  asset_class: null,
  asset_classes: ['sfr', 'small_mf', ...],
  geo_states: ['CA', 'TX'],
  geo_counties: ['Los Angeles', 'Harris'],
  geo_zips: ['90210', '77001'],
  sf_min, sf_max,
  acres_min, acres_max,
  year_built_min, year_built_max,
  stories_min, stories_max,
  units_min, units_max,
  value_min, value_max,
  min_equity_pct: 25,
  assessed_below_market: false,
  owner_types: ['corp', 'llc'],
  absentee_only: false,
  hold_period_min, hold_period_max,
  out_of_state_only: false,
  distress_signals: ['foreclosure', 'ltv'],
  distress_match_mode: 'or',
  climate_risk_max: 100,
  flood_exclude: false,
  wildfire_risk_max: 100,
  heat_risk_max: 100,
  match_threshold: 0.80,
  label: 'My Buy Box',
  run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  delivery_max_per_run: 10
}
```

**Response:**
```javascript
{
  subscriber_id: 'uuid',
  buy_box_id: 'uuid',
  status: 'active',
  buy_box: { /* full saved buy box object */ }
}
```

### PATCH /api/dealfeed/buy-boxes/:id (Edit)

**Request Payload:** Same as POST /onboarding (all fields sent, even if unchanged).

**Response:**
```javascript
{
  buy_box: { /* full updated buy box object */ }
}
```

### POST /api/dealfeed/buy-boxes/preview (Match Count)

**Request Payload:** Subset of buildPayload (geo_states, geo_counties, geo_zips, value_min, value_max, year_built_min, year_built_max, acres_min, acres_max, absentee_only only — other fields ignored).

**Response:**
```javascript
{
  count: 42,
  message: 'Estimate based on limited filter set'
}
```

**Called:** Debounced 400ms after any form change. Called from BuyBoxWizard (not from individual pages).

## Integration with App.jsx

No changes needed. App.jsx already mounts BuyBoxWizard with the same prop interface:
```jsx
{(showWizard || onboardingMatch) && (
  <BuyBoxWizard mode="create" onSuccess={...} onCancel={...} />
)}
{editingBuyBox && (
  <BuyBoxWizard mode="edit" initialData={editingBuyBox} onSuccess={...} onCancel={...} />
)}
```

The new component is a drop-in replacement with identical props.

## wizardHelpers.js Responsibilities

**Exports:**

```javascript
export const EMPTY_FORM = { /* shape defined above */ }

export function canProceedStep(step, form) {
  // Returns boolean
  // Step 1: assets[] must have >= 1 item AND geo.states[] must have >= 1 item
  // Step 2: no required fields (all optional)
  // Step 3: no required fields (all optional)
  // Step 4: distress_signals[] must have >= 1 item if ANY other signal filter is set
  // Step 5: no required fields (threshold has default 0.80)
  // Step 6: name must be non-empty string
  // Return false if gate fails, true otherwise
}

export function buildPayload(form) {
  // Takes EMPTY_FORM shape, returns backend POST/PATCH payload
  // Handles all field mappings:
  // - assets[] -> asset_class: null, asset_classes: form.assets
  // - geo fields map directly
  // - phys fields map directly
  // - fin.equity_preset (0|25|50|75) -> min_equity_pct
  // - owner.occupancy === 'absentee' -> absentee_only: true
  // - signals[] -> distress_signals, logic.mode -> distress_match_mode
  // - risk.* -> climate_risk_max, flood_exclude, wildfire_risk_max, heat_risk_max
  // - delivery.cadence ('daily'|'weekly'|'realtime') -> run_schedule: { days: [...] }
  // - Returns all 13 new fields + all existing fields
}

export function toFormState(buyBox) {
  // Takes a saved buy box object from API, returns EMPTY_FORM shape
  // Inverse of buildPayload: buyBox -> EMPTY_FORM -> buildPayload(EMPTY_FORM) == original payload
  // Handles all reverse mappings:
  // - asset_classes TEXT[] -> assets[]
  // - geo_states, geo_counties, geo_zips map directly
  // - all phys fields map directly
  // - min_equity_pct INT -> fin.equity_preset (0|25|50|75)
  // - absentee_only BOOLEAN -> owner.occupancy (if true: 'absentee', else: 'owner_occupied' or null)
  // - distress_signals[] -> signals[], distress_match_mode -> logic.mode
  // - run_schedule JSON -> delivery.cadence (parse days array)
  // Returns complete EMPTY_FORM shape initialized from all buy box fields
}
```

**Test Coverage (wizardHelpers.test.js):**
- EMPTY_FORM shape validation (all keys present, correct types).
- canProceedStep: 6 scenarios per step (pass/fail cases, boundary conditions).
- buildPayload: 20+ test cases covering all fields, edge cases (null, empty arrays, boundary values).
- toFormState: 10+ test cases covering all reverse mappings.
- Round-trip: buildPayload(toFormState(savedBox)) === originalPayload for 5+ multi-field combinations.

## CSS Isolation Strategy

**File:** src/styles/buy-box-wizard.css (replaces src/styles/buy-box-wizard.css, which will be deleted).

**Structure:**
```css
.buy-box-wizard {
  /* all wizard styles scoped under this class */
  --font-mono: 'JetBrains Mono';  /* override from DM Sans */
  /* design tokens from nightdrop */
  --bg-primary: var(--bg-primary-from-tokens);  /* map to tokens.css */
  --text-primary: var(--text-primary-from-tokens);
  /* ... all other variables */
}

.buy-box-wizard .page-1 { /* page-specific styles */ }
.buy-box-wizard .page-2 { /* ... */ }
/* etc. */

.buy-box-wizard .right-rail { /* right rail styles */ }
```

**No global overrides:** all vendor prefixes, resets, font-face rules stay within .buy-box-wizard scope or in tokens.css (which is global but already shared).

**Theme support:** data-theme attribute on `<html>` switches light/dark. CSS uses prefers-color-scheme or explicit selectors. Test both themes.

## Font Override Location

Within .buy-box-wizard root scope:
```css
.buy-box-wizard {
  --font-mono: 'JetBrains Mono', monospace;
}
```

Do not change tokens.css (global). Override only within the wizard scope.

## TweaksPanel Stripping

The handoff app.jsx contains a `<TweaksPanel />` component (debug/tweaks UI for design review). This is stripped completely before merge:
- No TweaksPanel component imported in new BuyBoxWizard.jsx.
- No TweaksPanel CSS rules included.
- No state management for tweaks.

## Backend File Change Map

**Repo:** ~/parcyl/scoutgpt-api

1. **migrations/043_buybox_wizard_v2.sql** (NEW)
   - ALTER TABLE df_buy_boxes ADD 13 columns (distress_match_mode, min_equity_pct, assessed_below_market, climate_risk_max, flood_exclude, wildfire_risk_max, heat_risk_max, delivery_max_per_run, match_threshold, stories_min, stories_max, units_min, units_max).
   - Set appropriate defaults and NULL/NOT NULL constraints.

2. **routes/dealfeed/onboarding.js** (MODIFY)
   - Line ~45: Remove or modify validateAssetClass() to skip if asset_class is null.
   - Line ~65: Destructure all 13 new fields from request body.
   - Line ~75 (INSERT): Add all 13 new columns to column list and placeholder values.

3. **routes/dealfeed/buyboxes.js** (MODIFY)
   - Line ~30 (PATCHABLE_FIELDS): Add all 13 new field names to the whitelist array.

4. **scripts/run_deal_feed.js** (NO CHANGE FOR V1)
   - Matcher will ignore match_threshold and other new fields (V2 work).
   - No changes needed; migration and route updates are sufficient.

## Deployment Order

1. Deploy migration 043 to scoutgpt-app (must apply before frontend ships).
2. Deploy routes/onboarding.js and routes/buyboxes.js changes (same deploy).
3. Verify migration applied (SELECT column_name FROM information_schema.columns WHERE table_name='df_buy_boxes' AND column_name IN (...13 fields...)).
4. Deploy frontend to nightdrop-dashboard (Netlify auto-deploys on push to main).

## Error Handling and Recovery

- **409 Conflict (duplicate label):** Display toast "That buy box name is already in use." User stays on page 6, can edit name.
- **400 Bad Request (validation):** Display toast with backend error message (e.g., "Price range invalid"). Form state preserved.
- **500 Server Error:** Display toast "Something went wrong. Please try again." Preserve form state, show Retry button (re-submit same payload).
- **404 Not Found (edit, buy box deleted):** Redirect to buy boxes list view with toast "Buy box no longer exists."

## Testing Strategy

- **Unit:** wizardHelpers.test.js (TDD, 100% coverage).
- **Integration:** Manual test create/edit round-trip against dev backend.
- **E2E:** Playwright smoke tests (6 scenarios covering create, edit, validation, error, DB integrity).
