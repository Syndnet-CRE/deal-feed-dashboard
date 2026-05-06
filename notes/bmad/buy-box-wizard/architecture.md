# Architecture — Buy Box Wizard Buildout
Date: 2026-05-03
Author: Architect phase
Requires: PRD.md

---

## Overview

Two workstreams, backend first:
1. Backend: migration + onboarding.js/buyboxes.js updates
2. Frontend: complete rewrite of NewBoxWizard.jsx + CSS additions

Frontend cannot submit the new fields until the backend accepts them. Backend ships first.

---

## Backend Changes

### Migration 029_buybox_schema_gaps.sql (new file in scoutgpt-api/migrations/)
```sql
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS value_min NUMERIC;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS value_max NUMERIC;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS zoning_codes TEXT[];
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS out_of_state_only BOOLEAN DEFAULT false;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS geo_radius_address TEXT;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS geo_radius_lat NUMERIC;
ALTER TABLE df_buy_boxes ADD COLUMN IF NOT EXISTS geo_radius_lng NUMERIC;
```

### onboarding.js — destructure + INSERT 8 new fields
Add to destructure block: notes, value_min, value_max, zoning_codes, out_of_state_only,
geo_radius_address, geo_radius_lat, geo_radius_lng
Add to INSERT column list and VALUES array (positions 24–31).

### buyboxes.js — PATCHABLE_FIELDS
Append: 'notes', 'value_min', 'value_max', 'zoning_codes', 'out_of_state_only',
'geo_radius_address', 'geo_radius_lat', 'geo_radius_lng'

---

## Frontend State Shape

Single useState object in NewBoxWizard. Helper `update(field, val)` returns new object (immutable).

```js
{
  // Step 1
  label: '',
  notes: '',

  // Step 2
  geoMode: 'state',       // 'state' | 'metro' | 'zip' | 'radius'
  geo_states: [],
  geo_cities: [],
  geo_zips: [],
  geo_radius_address: '',
  geo_radius_miles: 25,

  // Step 3
  asset_classes: [],

  // Step 4
  acres_min: '', acres_max: '',
  value_min: '', value_max: '',
  year_built_min: '', year_built_max: '',
  min_hold_yrs: '',
  zoning_codes: [],

  // Step 5
  owner_types: [],
  absentee_only: false,
  out_of_state_only: false,

  // Step 6
  distress_signals: [],
  distress_only: false,
}
```

Additional state in the wizard shell (not in form):
- `step` (1–7)
- `submitted` (bool — shows ConfirmationState)
- `submitting` (bool — disables Activate button during POST)
- `submitError` (string | null — shown on Review step)

---

## Component Structure

NewBoxWizard.jsx is a single file. Internal sub-components (not exported):

| Sub-component | Purpose |
|---------------|---------|
| `StepProgress` | 7-segment progress bar |
| `StepName` | Step 1 — label + notes |
| `StepGeo` | Step 2 — mode tabs + mode-specific input |
| `StepAssetClasses` | Step 3 — checkbox card grid |
| `StepCriteria` | Step 4 — min/max pairs + zoning tags |
| `StepOwnership` | Step 5 — ownership cards + toggles |
| `StepDistress` | Step 6 — distress cards + distress_only toggle |
| `StepReview` | Step 7 — read-only summary |
| `ConfirmationState` | Post-submit success screen |

Primitives (defined once, used across steps):
- `CheckCard({ label, desc, selected, onToggle })` — checkbox card for steps 3, 5, 6
- `ChipList({ items, onRemove })` — removable chip row
- `TagInput({ placeholder, onAdd })` — Enter-to-add text input
- `MinMaxPair({ labelMin, labelMax, unit, fieldMin, fieldMax, form, update })` — side-by-side inputs
- `ToggleRow({ label, value, onChange })` — full-width boolean toggle row

Each step sub-component receives `{ form, update }` props only.

---

## API Submission

```js
function buildPayload(form) {
  // only send geo fields for the active mode
  const geo = {};
  if (form.geoMode === 'state')  geo.geo_states  = form.geo_states;
  if (form.geoMode === 'metro')  geo.geo_cities  = form.geo_cities;
  if (form.geoMode === 'zip')    geo.geo_zips    = form.geo_zips;
  if (form.geoMode === 'radius') {
    geo.geo_radius_address = form.geo_radius_address || null;
    geo.geo_radius_miles   = form.geo_radius_miles;
  }

  return {
    label: form.label.trim(),
    notes: form.notes.trim() || null,
    asset_classes: form.asset_classes,
    ...geo,
    acres_min: toNum(form.acres_min), acres_max: toNum(form.acres_max),
    value_min: toNum(form.value_min), value_max: toNum(form.value_max),
    year_built_min: toNum(form.year_built_min), year_built_max: toNum(form.year_built_max),
    min_hold_yrs: toNum(form.min_hold_yrs),
    zoning_codes: form.zoning_codes.length ? form.zoning_codes : null,
    owner_types: form.owner_types.length ? form.owner_types : null,
    absentee_only: form.absentee_only,
    out_of_state_only: form.out_of_state_only,
    distress_signals: form.distress_signals.length ? form.distress_signals : null,
    distress_only: form.distress_only,
  };
}
// toNum: '' => null, else Number(v)
```

Endpoint: POST /api/dealfeed/onboarding
Success (201): set submitted = true
Error: set submitError = err.message, stay on step 7

Post-close: onClose() + refetch() from useDeals()

---

## Validation

```js
canProceed(step, form):
  1 → form.label.trim().length > 0
  2 → activeGeoHasData(form)   // checks the array/string for active geoMode
  3 → form.asset_classes.length > 0
  4,5,6 → true
  7 → true (errors surface from API)
```

---

## New CSS (append to styles.css, ~80 lines)

Classes needed:
- `.wizard-step-intro` — headline + supporting copy block
- `.wizard-tabs` + `.wizard-tab` + `.wizard-tab.active` — geo mode selector
- `.check-card` + `.check-card.selected` + `.check-card-desc` — checkbox card primitive
- `.chip` + `.chip-remove` — chip + X button
- `.tag-input-wrap` — tag input container
- `.toggle-row` — boolean toggle row (label + switch)
- `.range-row` — slider row with value label
- `.review-section` + `.review-row` — read-only summary layout
- `.wizard-confirm` — confirmation state container

All colors from existing CSS variables. No new tokens.

---

## File Impact

| File | Repo | Change |
|------|------|--------|
| `migrations/029_buybox_schema_gaps.sql` | scoutgpt-api | NEW |
| `routes/dealfeed/onboarding.js` | scoutgpt-api | EDIT |
| `routes/dealfeed/buyboxes.js` | scoutgpt-api | EDIT |
| `src/components/NewBoxWizard.jsx` | deal-feed-dashboard | FULL REWRITE |
| `src/styles/styles.css` | deal-feed-dashboard | EDIT (~80 lines added) |

---

## Build Order

1. Write + apply migration 029
2. Update onboarding.js
3. Update buyboxes.js PATCHABLE_FIELDS
4. Add CSS to styles.css
5. Rewrite NewBoxWizard.jsx
6. Manual smoke test: complete wizard end-to-end, confirm DB row created
7. Update Playwright smoke test if needed
