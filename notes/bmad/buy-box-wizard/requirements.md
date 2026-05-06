# Requirements — Buy Box Wizard Buildout
Date: 2026-05-03
Author: Analyst phase

## Source of Truth
Brady's spec (verbal, 2026-05-03) + codebase audit of:
- src/components/NewBoxWizard.jsx (current state)
- ~/parcyl/scoutgpt-api/routes/dealfeed/onboarding.js (create endpoint)
- ~/parcyl/scoutgpt-api/routes/dealfeed/buyboxes.js (PATCH/delete)
- ~/parcyl/scoutgpt-api/migrations/018_dealfeed.sql (schema)

---

## R1 — Wizard Structure
The wizard is a 7-step large modal overlay (class `modal lg`).
It serves two entry points with the same component:
1. Buy Boxes page — "New Buy Box" button
2. Onboarding flow for new subscribers

Steps in order:
1. Name & Description
2. Market Geography
3. Asset Class Selection
4. Property Criteria
5. Ownership Profile
6. Distress Signals
7. Review & Confirm

## R2 — Progress Indicator
A step progress indicator must be visible throughout all steps.

## R3 — Step: Name & Description
Fields:
- Buy box label (required, text input)
- Internal notes / description (optional, textarea — maps to `notes` on backend)

## R4 — Step: Market Geography
User selects one of four geography modes. Each mode has a distinct input treatment:

| Mode | Input | DB field |
|------|-------|----------|
| State | Multi-select dropdown + chips | `geo_states TEXT[]` |
| Metro / City | Typeahead autocomplete + chips | `geo_cities TEXT[]` |
| ZIP Codes | Tag input (type + Enter to add) | `geo_zips TEXT[]` |
| Radius | Address text input + mile slider | `geo_radius_address TEXT`, `geo_radius_miles NUMERIC` |

At least one geo mode must have data before the user can proceed.

## R5 — Step: Asset Classes
Source: `ASSET_CLASSES` from src/data/mockData.js (8 options).
UI: Styled checkbox cards — 2-column grid, each card shows asset class name.
Selected state: green background tint + check icon.
At least one class required.

## R6 — Step: Property Criteria
Fields (all optional, with inline unit labels):
- Lot size: `acres_min` / `acres_max` — shown as connected min-max pair (acres)
- Estimated value: `value_min` / `value_max` — formatted dollar inputs side by side
- Year built: `year_built_min` / `year_built_max`
- Min hold years: `min_hold_yrs` — slider or stepper
- Zoning codes: `zoning_codes TEXT[]` — tag input

Min/max pairs shown side by side. No comma-separated text inputs anywhere.

## R7 — Step: Ownership Profile
Ownership types (styled checkbox cards, 2-col grid):
- Individual
- LLC or Entity
- Trust
- Corporate

Maps to `owner_types TEXT[]`.

Additional toggles (boolean):
- Absentee owner only → `absentee_only BOOLEAN`
- Out-of-state owner only → `out_of_state_only BOOLEAN` (new field — see R12)

## R8 — Step: Distress Signals
Styled checkbox cards, each with label + one-sentence description:
- Long-term hold, no recent improvements
- Tax delinquency
- No permits filed in 5+ years
- Absentee ownership
- Inactive or dissolved entity

Maps to `distress_signals TEXT[]`.
Toggle: "Distress signals required" → `distress_only BOOLEAN`.

## R9 — Step: Review & Confirm
Read-only summary card showing every configured field.
Fields with no value show "—" (use `fmt()` from src/lib/format.js).
Single "Activate Buy Box" button.
No editing from this step — user must navigate back.

## R10 — Activation (API call)
On confirm: POST to `/api/dealfeed/onboarding`
Required by backend: `label`, `asset_classes[]`, at least one geo field.
On 201 success:
- Transition to a confirmation state within the modal (not immediate close)
- Show confirmation message + expected first run time
- Close button returns to Buy Boxes view
- Call `refetch()` on DealsContext to reload the buy boxes list

On error: show inline error message, stay on Review step.

## R11 — Validation
- Step 1: `label` must be non-empty
- Step 2: at least one geo mode must have populated data
- Step 3: at least one asset class must be selected
- Steps 4–6: all optional — user may proceed without filling
- Next button disabled until current step's required fields pass

## R12 — Backend Schema Gaps
Fields the spec requires that do NOT exist in the current `df_buy_boxes` schema or onboarding route:

| Field | Type | Step |
|-------|------|------|
| `notes` | TEXT | Step 1 |
| `value_min` | NUMERIC | Step 4 |
| `value_max` | NUMERIC | Step 4 |
| `zoning_codes` | TEXT[] | Step 4 |
| `out_of_state_only` | BOOLEAN | Step 5 |
| `geo_radius_address` | TEXT | Step 2 |
| `geo_radius_lat` | NUMERIC | Step 2 |
| `geo_radius_lng` | NUMERIC | Step 2 |

A new migration is required. onboarding.js INSERT and buyboxes.js PATCHABLE_FIELDS must be updated.

## R13 — Design Quality
- Each step has a clear headline and supporting copy explaining why the field matters
- Input controls match data type (no raw comma-separated text for arrays)
- Professional configuration tool feel, not a basic form
- Progress indicator visible throughout
- Both light and dark themes supported via existing token system
