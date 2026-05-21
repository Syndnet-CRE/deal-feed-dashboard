> **STALE — 2026-05-20**
>
> Predates the nightdrop-api MVP rebuild (migration 049 + 10-class taxonomy + 35 new filter fields). The wizardHelpers vs nativeToPayload observation is still accurate, but the actual API contract — every patchable field, validator, three-state boolean — is documented in `~/nightdrop-api/routes/dealfeed/buyboxes.js` and `~/nightdrop-api/services/assetUseCodes.js`.
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# API Contract Audit — Buy Box Feature

**Date**: 2026-05-11  
**Scope**: API contract alignment for Buy Box create/update operations and buildPayload() implementation  
**Auditor**: File search specialist

---

## Executive Summary

The buy box feature has **two competing implementations** in the same codebase:

1. **`src/lib/wizardHelpers.js`** — A pure, well-documented implementation with `buildPayload()` and `toFormState()` functions, fully unit-tested
2. **`src/components/BuyBoxWizard.jsx`** — A separate, duplicate implementation with `nativeToPayload()` and `toNativeForm()` functions, embedded in the component

The two implementations diverge significantly in field handling, geo contract, and payload structure. **The wizardHelpers.js implementation is not currently used by any component.** This creates a **dual-source-of-truth problem** that makes it impossible to guarantee API contract correctness.

---

## Buy Box CRUD Operations

### Create (`POST /api/dealfeed/onboarding`)
- **Implemented by**: `BuyBoxWizard.jsx` line 231
- **Calls**: `api.post('/api/dealfeed/onboarding', payload)` when `mode === 'create'`
- **Payload builder**: `nativeToPayload(form)` (BuyBoxWizard.jsx, lines 100–130)
- **Response handling**: On 201, sets `submitted = true` and shows confirmation screen
- **State update**: `patchBuyBox()` is NOT called; user must navigate away and back to see new buy box

### Update (`PATCH /api/dealfeed/buy-boxes/:id`)
- **Implemented by**: BuyBoxWizard.jsx line 229
- **Calls**: `api.patch('/api/dealfeed/buy-boxes/' + id, payload)` when `mode === 'edit'`
- **Payload builder**: Same `nativeToPayload(form)` function
- **Response handling**: On success, sets `submitted = true`
- **State update**: `patchBuyBox()` NOT called in BuyBoxWizard; caller in App.jsx (line 253) is responsible for state management
- **Bug**: After edit, the UI shows stale buy box data unless user manually refetches

### Pause/Resume/Status Change
- **Implemented by**: `DealsContext.jsx` line 115–119
- **Function**: `patchBuyBox(id, payload)` calls `api.patch('/api/dealfeed/buy-boxes/' + id, payload)`
- **Used by**: App.jsx line 98 to pause a buy box via ConfirmModal
- **Payload example**: `{ status: 'paused' }` or `{ status: 'active' }`
- **Status values**: `'active'`, `'paused'`, `'pending'`, `'cancelled'`, `'coverage_failed'` (DealsContext line 6–12)

### Read (`GET /api/dealfeed/buy-boxes`)
- **Implemented by**: `DealsContext.jsx` line 59
- **Called on mount**: `api.get('/api/dealfeed/buy-boxes')`
- **Response shape**: `{ buy_boxes: BuyBox[] }`
- **Post-processing**: Each box normalized via `normalizeBuyBox(b)` (line 14–43)

---

## buildPayload() Fields — Two Implementations

### `wizardHelpers.js::buildPayload()` (UNUSED, lines 116–192)
**Output fields** (34 fields):

```
label, asset_classes, asset_class,
geo_states, geo_counties, geo_zips,
sf_min, sf_max, acres_min, acres_max,
year_built_min, year_built_max,
stories_min, stories_max,
units_min, units_max,
zoning_codes,
value_min, value_max,
min_equity_pct,
assessed_below_market,
owner_types,
absentee_only,
hold_period_min, hold_period_max,
out_of_state_only,
distress_signals,
distress_match_mode,
climate_risk_max, flood_exclude,
wildfire_risk_max, heat_risk_max,
match_threshold,
run_schedule: { days },
delivery_max_per_run
```

**Field transformation notes**:
- `form.phys.year_min/max` → `year_built_min/max`
- `form.fin.price_min/max` → `value_min/max`
- `form.fin.equity_preset` → `min_equity_pct`
- `form.owner.occupancy === 'absentee'` → `absentee_only: true`
- `form.owner.hold_min/max` → `hold_period_min/max`
- `form.delivery.cadence === 'weekly'` → `run_schedule: { days: ['mon'] }`
- All numeric fields passed through `toNum()` (converts empty string to null)

### `BuyBoxWizard.jsx::nativeToPayload()` (ACTIVE, lines 100–130)
**Output fields** (31 fields):

```
label, asset_classes, asset_class,
geo_states, geo_counties, geo_zips,
sf_min, sf_max, acres_min, acres_max,
year_built_min, year_built_max,
units_min, units_max,
value_min, value_max,
min_equity_pct,
under_assessed,  // ← DIFFERS: wizardHelpers uses assessed_below_market
owner_types,
absentee_only,
out_of_state_only,
hold_period_min, hold_period_max,
distress_signals,
distress_only,   // ← EXTRA: wizard adds, wizardHelpers does not
distress_match_mode,
climate_risk_max, flood_exclude,
wildfire_risk_max, heat_risk_max,
match_threshold,
run_schedule: { days },
delivery_max_per_run
```

**Critical field divergences**:

| Field | wizardHelpers | BuyBoxWizard | Backend (CLAUDE.md) |
|-------|---|---|---|
| `assessed_below_market` | ✓ sent | ✗ sent as `under_assessed` | Expected `assessed_below_market` |
| `distress_only` | ✗ omitted | ✓ sent | Unknown if backend reads |
| `stories_min` | ✓ sent | ✗ **MISSING** | Unknown if backend reads |
| `zoning_codes` | ✓ sent | ✗ **MISSING** | Listed in architecture.md as needed |
| Risk fields scaling | Sent as-is (0-100) | Conditionally scaled by 10 | **Inconsistent** |

**Risk field scaling bug** in BuyBoxWizard (lines 122–125):
```javascript
climate_risk_max: form.risk.climate < 10 ? form.risk.climate * 10 : null,
wildfire_risk_max: form.risk.wildfire < 10 ? form.risk.wildfire * 10 : null,
heat_risk_max: form.risk.heat < 10 ? form.risk.heat * 10 : null,
```
Scales DOWN if value is less than 10, but wizardHelpers sends as-is. Wizard form stores `risk.climate` as 1–10, so this converts it to 10–100 range.

---

## Backend Contract Gaps

### Missing Fields in buildPayload() Output
These fields exist in the wizard form but are NOT sent to the API by BuyBoxWizard:

1. **`stories_min`** (string value in wizard)
   - Collected in BuyBoxPage4
   - Included in wizardHelpers.js line 147
   - **MISSING** from BuyBoxWizard.nativeToPayload() — no corresponding field in NATIVE_FORM either

2. **`zoning_codes`** (array)
   - Collected in BuyBoxPage4 (tag input)
   - Included in wizardHelpers.js line 151
   - **MISSING** from BuyBoxWizard.nativeToPayload()
   - **Upstream spec requirement**: architecture.md line 25, stories.md R6 and Story 6

3. **Equity/threshold mapping inconsistency**
   - wizardHelpers: sends `min_equity_pct` as decimal (e.g. 0.25)
   - BuyBoxWizard: maps `form.fin.equity_preset` via `EQUITY_MAP` (line 113)
   - BuyBoxWizard does NOT send `match_threshold`; uses `THRESHOLD_MAP` (line 126)
   - No confirmation whether backend accepts `threshold` or `match_threshold`

### Field Name Mismatches

| Frontend (Wizard) | BuyBoxWizard sends | wizardHelpers sends | Backend expectation |
|---|---|---|---|
| `form.fin.assessed_below_market` | `under_assessed` | `assessed_below_market` | Unknown |
| `form.risk.climate` (1–10) | `climate_risk_max * 10` | `climate_risk_max` (as-is) | Unknown |

### Missing Fields Not Collected by Wizard
From architecture.md migration (lines 26–29), these fields were added to DB schema but are **never collected by the wizard**:

- `notes` (TEXT) — Step 1 description field (R3 in requirements.md)
- `geo_radius_address` (TEXT) — radius mode address (R4)
- `geo_radius_lat` (NUMERIC) — radius mode geocoded lat
- `geo_radius_lng` (NUMERIC) — radius mode geocoded lng

**Status**: Wizard has no UI for these despite architecture.md listing them as required.

---

## Geo Contract Status — Known Landmine

### Wizard Form Geo Structure
```javascript
geo: { states: [], counties: [], zips: [] }
```
No support for:
- `geo_cities` (mentioned in architecture.md)
- `geo_radius_address`, `geo_radius_lat`, `geo_radius_lng` (schema exists, but wizard has no mode)

### Payload Output by Both Implementations
Both send:
- `geo_states` (array or null)
- `geo_counties` (array or null)
- `geo_zips` (array or null)

Neither sends:
- `geo_cities` (mentioned in architecture.md Step 2, "Metro / City" mode)
- `geo_radius_*` (three fields added to schema, zero UI)

### Backend Matcher Alignment
From CLAUDE.md **Known Landmine** (lines 204–205):

> `buildPayload()` in wizardHelpers.js serializes `geo_cities`, `geo_zips`, and `geo_radius_*` to the DB, but the backend `matchProperties()` in `scoutgpt-api/scripts/run_deal_feed.js` only reads `geo_states` and `geo_counties`.

**Status**: 
1. **wizardHelpers.js** claims to serialize `geo_cities` and `geo_radius_*` (lines 135–138) but code only outputs `geo_states`, `geo_counties`, `geo_zips`
2. **BuyBoxWizard** has NO geo_cities or radius support
3. **Backend matcher** ignores `geo_cities`, `geo_zips`, and `geo_radius_*`
4. **Result**: If a user selects cities or radius, those fields are serialized to DB but silently ignored during deal matching

**Hookify rule** exists (`.claude/hookify.wizard-matcher-drift.local.md`) but the drift already exists in current code.

---

## DealsContext Completeness

### Exported API Actions
```javascript
{
  deals,
  buyBoxes,
  contacts,
  dealNotes,
  loading,
  error,
  refetch: fetchAll,
  postFeedback,
  saveNote,
  updateStatus,
  fetchContacts,
  logContact,
  patchBuyBox,          // ← for pause/resume/edit
  fetchDealNotes,
  createDealNote
}
```

### Missing from DealsContext

1. **`createBuyBox(payload)`** — Does not exist
   - Wizard calls `api.post()` directly instead of a context method
   - Makes it impossible to reliably update local state after creation
   - Post-creation UI sync relies on user navigation + refetch

2. **`deleteBuyBox(id)`** — Does not exist
   - No UI for delete
   - Schema supports `status = 'cancelled'` but no action exposed

3. **`refetch()` is named `fetchAll`** and not exported by the context
   - Wizard calls `onSuccess()` callback
   - App.jsx receives callback and handles refetch manually
   - No guarantee refetch is called (e.g., if wizard close is via Escape)

### Response Handling Issues

**patchBuyBox() (line 115–119)**:
```javascript
const patchBuyBox = useCallback(async (id, payload) => {
  const res = await api.patch(`/api/dealfeed/buy-boxes/${id}`, payload);
  setBuyBoxes(prev => prev.map(b => b.id === id ? normalizeBuyBox(res.buy_box) : b));
  return res.buy_box;
}, []);
```

- Assumes response shape is `{ buy_box }` — if not, normalization fails silently
- No error handling; failures throw uncaught promise
- Called by pause/resume flow in App.jsx (line 98) with no try-catch

---

## BMAD Spec Gaps — Implementation vs. Design

### Story 1 Status: Backend Migration (NOT VERIFIED)
**Spec**: Add 8 columns to `df_buy_boxes`: `notes`, `value_min`, `value_max`, `zoning_codes`, `out_of_state_only`, `geo_radius_address/lat/lng`

**Findings**:
- No way to verify if migration was applied without accessing backend
- `notes`, `value_min`, `value_max`, `out_of_state_only` are referenced in BuyBoxWizard.jsx payload
- `geo_radius_*` fields are NOT in the wizard
- `zoning_codes` is NOT in BuyBoxWizard.nativeToPayload()

### Story 3 Status: Wizard Shell — PARTIALLY COMPLETE
**Spec**: 7-step modal with progress bar, backdrop no-close, Escape closes from step 1

**Implementation**: BuyBoxWizard.jsx (lines 274–362)
- ✓ Modal shell with 6 steps (STEPS array, line 14–21)
- ✓ Backdrop present (line 276)
- ✓ Escape closes (line 218)
- ✗ Progress bar disabled when backdrop click happens (by design)
- ✓ Step progress indicator (line 303–318)
- ✗ Name & description Step 1 exists but NO description/notes field

### Story 4 Status: Geo Step — MINIMAL IMPLEMENTATION
**Spec**: 4 tab modes (State, Metro, ZIP, Radius) with mode-specific inputs

**Implementation**: BuyBoxPage2.jsx
- ✓ States (multi-select)
- ✗ Metro/Cities (NOT IMPLEMENTED)
- ✓ ZIPs (tag input)
- ✗ Radius (NOT IMPLEMENTED)

### Story 6 Status: Property Criteria — INCOMPLETE
**Spec**: Acres, value, year, hold years, zoning codes

**Implementation**: BuyBoxPage4.jsx
- ✓ Acres min/max
- ✓ Year built min/max
- ✓ Hold years (stepper)
- ✗ Value min/max (NOT IN PAYLOAD)
- ✗ Zoning codes (NOT IN PAYLOAD)

**Both value and zoning are collected in the form but dropped in nativeToPayload().**

### Story 9 Status: Review & Activation — IMPLEMENTED
**Spec**: POST to `/api/dealfeed/onboarding`

**Implementation**: BuyBoxWizard.jsx lines 224–240
- ✓ Submits to correct endpoint for create
- ✓ Submits to PATCH endpoint for edit
- ✓ Shows confirmation on success
- ✓ Shows error on failure
- ✗ Does NOT call `refetch()` automatically

---

## Verdict

### CRITICAL ISSUES

1. **Dual payload implementations create correctness risk**
   - `wizardHelpers.js::buildPayload()` is comprehensive but unused
   - `BuyBoxWizard.jsx::nativeToPayload()` is missing fields (stories_min, zoning_codes, value_min/max)
   - No test coverage for the active implementation

2. **Missing fields in active payload**
   - `stories_min`: collected but not sent
   - `zoning_codes`: collected but not sent
   - `value_min/value_max`: collected but not sent
   - **Impact**: Buy boxes cannot filter by these criteria even if user configures them

3. **Field name mismatch**
   - Wizard sends `under_assessed`; backend may expect `assessed_below_market`
   - Risk fields scaled differently (wizard: 1–10 input scaled to 10–100; wizardHelpers: sent as-is)
   - **Impact**: Filtering may not work as intended

4. **Geo contract drift**
   - Architecture.md specifies Metro and Radius modes; neither is implemented
   - Wizard can only handle states, counties, zips
   - Schema supports `geo_cities`, `geo_radius_*`; matcher ignores them
   - **Impact**: Users cannot select by city or radius despite spec

5. **No automatic state sync after creation**
   - `createBuyBox()` not exposed by DealsContext
   - Wizard doesn't call refetch
   - Buy box list doesn't update until user navigates away and back
   - **Impact**: UX feels broken; user can't see their new buy box immediately

### HIGH PRIORITY FIXES

1. **Consolidate payload builders**
   - Remove `nativeToPayload()` from BuyBoxWizard.jsx
   - Import `buildPayload()` from wizardHelpers.js
   - Adapt wizard form shape to match EMPTY_FORM structure
   - Add unit tests for active payload builder

2. **Add missing form fields**
   - Add `value_min/max` input to BuyBoxPage4
   - Add `zoning_codes` input to BuyBoxPage4
   - Verify `stories_min` is actually collected (NATIVE_FORM doesn't have it)

3. **Implement missing geo modes**
   - Add Metro/City typeahead to BuyBoxPage2
   - Add Radius address + slider to BuyBoxPage2
   - Update buildPayload to scope geo fields by active mode

4. **Fix risk field scaling**
   - Align wizard form and payload on scale (1–10 vs 10–100)
   - Add test cases

5. **Expose createBuyBox in DealsContext**
   - Add `createBuyBox(payload)` that calls API and updates local state
   - Wizard calls this instead of api.post directly
   - Guarantees buy box appears in list immediately

6. **Fix field name mismatches**
   - Verify backend expects `assessed_below_market` vs `under_assessed`
   - Update payload builder to match backend schema

### MEDIUM PRIORITY FIXES

1. Error handling in patchBuyBox — add try-catch
2. Response shape validation — assert `{ buy_box }` shape
3. Geo states/counties/zips normalization in buildPayload (check backend read order)

### DEFER

- Onboarding flow (`/onboarding` route) — not in scope of this audit
- Additional pages/steps beyond current 6 — architecture planned 7 steps but only 6 implemented

---

## Recommendations

1. **Immediate**: Run integration test against backend to confirm which payload fields are actually read
2. **This sprint**: Consolidate payloads, add missing fields, expose createBuyBox
3. **Next sprint**: Implement remaining geo modes (Metro, Radius)
4. **Ongoing**: Add unit tests for buildPayload + toFormState to prevent future drift

