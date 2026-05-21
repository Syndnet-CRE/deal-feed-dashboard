> **STALE — 2026-05-20**
>
> Documents the 8-class wizard. Sub-asset class selector is now implemented (BuyBoxPage1 subtype chips). Backend now uses a 10-class taxonomy (self_storage, multifamily, mobile_home_rv, residential_sfr, land, industrial, retail, gas_station_c_store, office, special_purpose).
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# Wizard Flow Audit

## Page Inventory

### Page 1: Target (Asset Classes + Geography)
- **Assets**: Multi-select from 8 asset classes (SFR, Small MF, Large MF, Commercial, Industrial, Mixed-use, Land, Hospitality)
- **Geography**: States, counties, zip codes (hierarchical, with county gating)
- **Completion Status**: COMPLETE — fully functional with search, counts, and UI feedback

### Page 2: Property Profile (Physical + Financial)
- **Physical**: Building size (sqft), lot size (acres), year built, stories, units
- **Financial**: Last sale price, minimum owner equity (preset buttons), under-assessed flag
- **Completion Status**: COMPLETE — all ranges implemented with range inputs

### Page 3: Owner Profile (Ownership)
- **Entity type**: Any / Individual / LLC / Trust
- **Occupancy**: Any / Owner-occupied / Absentee / Renting out
- **Hold period**: Any / 3+ / 5+ / 10+ / 20+ years
- **Out-of-state only**: Toggle
- **Completion Status**: COMPLETE — all owner filters functional

### Page 4: Distress & Risk
- **Distress signals**: 5 toggleable signals (foreclosure, high LTV, ARM, equity threshold, long hold)
- **Match logic**: AND/OR toggle for distress signals
- **Risk tolerance**: Climate risk (1-10 slider), flood exclusion, wildfire risk (expandable), heat risk (expandable)
- **Completion Status**: COMPLETE — sliders, toggles, and signal selection all working

### Page 5: Match Threshold
- **Threshold selection**: Volume (70%), Balanced (80%), Precision (90%)
- **Deal estimate**: Calculated based on match pool and threshold
- **Completion Status**: COMPLETE — threshold selection with estimated deal count display

### Page 6: Review & Activate
- **Buy box name**: Text input with UUID generation
- **Live match pool**: Display of count
- **Delivery cadence**: Daily / Weekly / Real-time options
- **Maximum properties per delivery**: +/- controls (5-200 range)
- **Filters summary**: Displays all active filters as chips
- **Activate button**: Triggers submission with loading state
- **Completion Status**: COMPLETE — all controls functional, submit handler wired

## Missing Features

### 1. **Sub-asset class selector - NOT IMPLEMENTED**
The `buyBoxTaxonomy.js` defines comprehensive subtypes for each asset class (e.g., "Duplex", "Triplex", "Apartment" for multifamily; "Light Industrial", "Warehouse", "Heavy Industrial" for industrial). However:
- **Page 1 does NOT expose sub-asset class selection**
- Only top-level asset class IDs are captured: `assets: form.assets`
- The form schema has no field for `asset_subtypes` or `asset_use_codes`
- The `nativeToPayload()` function sets `asset_class: null` and sends `asset_classes` only (top-level)

**Impact**: Users cannot refine their search to specific property subtypes. For example, they can't say "I want only Warehouses, not Light Industrial."

### 2. **Stories filtering - incomplete**
- Page 2 has a "Stories" section with preset chips (1, 2, 3, 4-6, 7+)
- The state is stored as `phys.stories_min` (only the min value, can only toggle one at a time)
- Sent to backend as `stories_min` only (no `stories_max`)
- Cannot specify ranges like "3-6 stories"

**Impact**: Users can only filter down to a single story value, not a range.

### 3. **Zoning codes referenced but not exposed**
- `buyBoxTaxonomy.js` and `wizardHelpers.js` reference `zoning_codes` in form/payload
- Page 2 collects NO zoning information
- Form has `phys.zoning_codes: []` but no UI to populate it

**Impact**: Zoning filtering is unavailable to users, though the backend supports it.

### 4. **Limited property delivery controls**
- Only "maximum properties per delivery" is configurable (Page 6)
- No filters for delivery time windows, day-of-week preferences, or scheduled pause windows
- Page 5 shows delivery cadence options but `form.delivery` is missing many fields that backend might support

**Impact**: No granular control over when/how often deals arrive.

### 5. **Edit mode issues - partially broken**
- `BuyBoxWizard.jsx` imports `BuyBoxPage5` and `BuyBoxPage6` but code references them assuming they export as separate components
- Line 7-8: `import { BuyBoxPage5 } from './BuyBoxPage5'; import { BuyBoxPage6 } from './BuyBoxPage6';`
- But neither file exports a named export in that way — they only have `export function BuyBoxPage5(...)` and `export function BuyBoxPage6(...)`
- This works because of how ES modules work, but the mapping in `toNativeForm()` (lines 53-98) has some field mismatches when converting from stored buy box to edit form
- Example: `stories_min` is never populated (line 68 is missing from `toNativeForm`)

## canProceed Gate Analysis

### Current Implementation (Line 172-175 of BuyBoxWizard.jsx)
```javascript
function canGoNext(page, form) {
  if (page === 1) return form.assets.length > 0 && form.geo.states.length > 0;
  return true;
}
```

### Assessment

| Page | Gate | Assessment |
|------|------|------------|
| 1 | Assets + states required | **CORRECT** — requires minimum viable targeting |
| 2 | No gate | **TOO LOOSE** — user can skip all physical/financial specs |
| 3 | No gate | **TOO LOOSE** — user can skip all owner filters |
| 4 | No gate | **TOO LOOSE** — user can skip all distress signals |
| 5 | No gate | **CORRECT** — threshold defaults to "balanced" |
| 6 | Name required (via button disable, not canGoNext) | **INCONSISTENT** — Page 6 button checks `!form.name.trim()` separately (line 350); canGoNext not consulted for final submit |

**Issues**:
- Pages 2-5 allow advancing even with zero selections, creating potentially empty buy boxes
- The final activation button (page 6) only checks the name field, not canProceedStep(6, form)
- A user could activate a buy box with NO distress signals, NO risk filters, NO owner constraints

## Form State

### Declared in BuyBoxWizard.jsx (NATIVE_FORM, lines 23-36)
```javascript
const NATIVE_FORM = {
  assets: [],
  geo: { states: [], counties: [], zips: [] },
  phys: { sf_min, sf_max, acres_min, acres_max, year_min, year_max, stories_min, units_min, units_max },
  fin: { price_min, price_max, equity_preset, assessed_below_market },
  owner: { entity, occupancy, hold_min, hold_max, out_of_state },
  signals: [],
  logic: 'OR',
  risk: { climate, flood, wildfire, wildfireOpen, heat, heatOpen },
  threshold: 'balanced',
  delivery: { cadence: 'daily', max: 25 },
  name: '',
  matchCount: 0,
};
```

### Fields referenced but not exposed in UI
1. `phys.stories_max` — defined but never set (only `stories_min` used)
2. `phys.zoning_codes` — referenced in buildPayload but no UI
3. `owner.hold_max` — initialized but never shown in Page 3 UI (only `hold_min` shown)

### Mismatch with wizardHelpers.js EMPTY_FORM
The `wizardHelpers.js` file defines a different schema with conflicting field names:
- WizardHelpers: `logic: { mode: 'or' }` (object)
- BuyBoxWizard: `logic: 'OR'` (string)
- WizardHelpers: `risk: { climate_max: 100, ... }` (use _max suffix)
- BuyBoxWizard: `risk: { climate: 10, ... }` (numeric 1-10 scale)
- WizardHelpers: `delivery: { max_per_run: 10 }`
- BuyBoxWizard: `delivery: { max: 25 }`

**Impact**: If code tries to use wizardHelpers.canProceedStep or buildPayload instead of the BuyBoxWizard versions, it will fail because field names don't align.

## Submit Flow

### Activation Handler (lines 224-240)
```javascript
const handleActivate = async () => {
  setActivating(true);
  try {
    const payload = nativeToPayload(form);
    if (mode === 'edit' && initialData?.id) {
      await api.patch(`/api/dealfeed/buy-boxes/${initialData.id}`, payload);
    } else {
      await api.post('/api/dealfeed/onboarding', payload);
    }
    setActivatedForm(form);
    setSubmitted(true);
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again.', 'error');
  } finally {
    setActivating(false);
  }
};
```

### Success State
- Sets `submitted = true` (line 234)
- Shows success modal (lines 277-293): "You're hunting. [Name] is live. First batch lands at 06:00 AM tomorrow."
- "Back to dashboard" button calls `onSuccess()` prop
- Success modal is hardcoded to show first batch delivery at "06:00 AM tomorrow" — doesn't account for user's chosen delivery cadence (daily/weekly/real-time)

### Error Handling
- Catches errors and shows toast with error message
- Does NOT provide user guidance on what went wrong (validation error vs network error)
- Does NOT offer retry mechanism
- Activating state is set to false so user can try again

## buildPayload() Completeness

### Current nativeToPayload (lines 100-130 of BuyBoxWizard.jsx)

**Fields sent to backend**:
```javascript
label, asset_classes, asset_class (null), geo_states, geo_counties, geo_zips,
sf_min, sf_max, acres_min, acres_max, year_built_min, year_built_max,
units_min, units_max, value_min, value_max, min_equity_pct, under_assessed,
owner_types, absentee_only, out_of_state_only, hold_period_min, hold_period_max,
distress_signals, distress_only (derived), distress_match_mode,
climate_risk_max, flood_exclude, wildfire_risk_max, heat_risk_max,
match_threshold, run_schedule, delivery_max_per_run
```

**Fields referenced in taxonomy but NOT sent**:
- `asset_use_codes` / `asset_subtypes` (sub-asset classes not captured)
- `zoning_codes` (collected in form but always null in wizard)
- `geo_cities` / `geo_metros` (taxonomy references but not in wizard)
- `geo_radius_miles` / `geo_radius_address` (radius search not implemented)
- `stories_min` / `stories_max` (only stories_min in form, stories_max never set)

**Schema mapping consistency**:
Payload field names are inconsistent with stored data field names:
- Form uses `distress_match_mode` but BuyBoxWizard treats `logic` as string 'OR'/'AND'
- Form uses `climate_risk_max` as scalar (e.g., 50 = 50% risk) but wizard uses `climate: 5` (1-10 scale)
- Conversion factor is 10x: `climate_risk_max: form.risk.climate < 10 ? form.risk.climate * 10 : null`

**Assessment**: buildPayload captures ~70% of available taxonomy fields. Major gaps are sub-asset classes and zoning.

## Dead/Placeholder UI

### Right Rail (BuyBoxRightRail.jsx)
1. **"Avg equity" stat**: Shows hardcoded `$184K` (line 63)
2. **"Hold" stat**: Shows hardcoded `11.3yr` and `14yr median` (lines 67-69)
3. **"Absentee" stat**: Shows hardcoded `47%` (line 72)
4. **Stats sparklines**: Hardcoded MoM/WoW deltas (e.g., `+2.4% MoM`, `-1.1% WoW`) with no data source

These stats appear to be designed for a live dashboard but in the wizard context they're always placeholders. They don't update as the user changes filters.

### Page 6 Button Labels (BuyBoxPage6.jsx)
1. **"Edit ↗" button** (line 46): No onClick handler, non-functional
2. **"Connect to email →" button** (line 62): No onClick handler, non-functional

### Page 6 UUID Display (line 34)
```javascript
UUID bb-{Math.abs(name.length * 31337 + 124).toString(16).padStart(8,'0').slice(0,8)}
```
This is a fake UUID generated from the name length, not a real backend ID. Users might think this is their actual buy box ID.

### Hardcoded Delivery Time (lines 105-106, 286)
```
"The first batch will land in your inbox at 06:00 AM tomorrow"
"First batch lands at 06:00 AM tomorrow"
```
This ignores the user's selected delivery cadence. If they pick "weekly", it should say "next Monday at 07:00 AM", not tomorrow.

### Stat Trio in Right Rail
The three stats (equity, hold, absentee) render only when a name is entered on Page 6, but they show hardcoded values. They don't reflect the filters the user selected. They're purely decorative.

## Preview Endpoint Integration

### Preview API Call (lines 195-209 of BuyBoxWizard.jsx)
- **Endpoint**: `POST /api/dealfeed/buy-boxes/preview`
- **Debounce**: 400ms after filterKey changes
- **Payload**: `nativeToPayload(formRef.current)`
- **Response**: Expects `{ count: number }`
- **Error handling**: "failure is non-fatal" — silently catches and ignores errors
- **Wiring**: ✅ Result updates `form.matchCount`
- **Displayed**: Right rail quote block + Page 6 review count + Page 5 estimate

**Assessment**: CORRECTLY WIRED. The preview updates in real-time as user changes filters, and count is displayed in multiple places.

## Verdict

### Strengths
1. **Solid 6-page workflow** with logical progression (target → profile → owner → distress → threshold → review)
2. **Real-time preview** with debounce working correctly
3. **Clean state management** using React hooks, form state passed through props
4. **Flexible filtering** across 9+ dimensions (assets, geo, physical, financial, ownership, distress, risk, threshold, delivery)
5. **Success confirmation** modal with friendly messaging
6. **Edit mode** partially working (can re-open existing buy boxes)

### Critical Issues
1. **Sub-asset classes completely missing** from UI despite being fully defined in taxonomy. Users cannot refine search to specific property types (e.g., "Warehouse only, not Light Industrial").
2. **Zoning codes in schema but not exposed** — dead field
3. **Form state mismatches** between BuyBoxWizard and wizardHelpers — two parallel schemas with conflicting field names and types
4. **No gate on Pages 2-5** — user can activate a buy box with zero distress signals, zero risk filters, zero owner constraints
5. **Hardcoded delivery time** ("06:00 AM tomorrow") doesn't match user's selected cadence (daily/weekly/real-time)
6. **Page 6 buttons non-functional** ("Edit", "Connect to email") — appear clickable but do nothing
7. **Fake UUID** shown to user as if it's a real ID

### Data Quality Issues
1. **stories_max never set** — users can only filter to a single story count, not ranges
2. **hold_max never shown in UI** — only hold_min is used, even though backend supports both
3. **Right rail stats hardcoded** — show fake equity, hold, absentee percentages that don't reflect actual pool

### Recommendation Priority
1. **CRITICAL**: Implement sub-asset class selector on Page 1 (requires adding UI + form field)
2. **CRITICAL**: Add conditional gates to Pages 2-5 or enforce minimum distress/risk selection
3. **HIGH**: Reconcile form schema between BuyBoxWizard and wizardHelpers
4. **HIGH**: Fix hardcoded delivery time message on Pages 6 to reflect cadence choice
5. **MEDIUM**: Make Page 6 "Edit" and "Connect to email" buttons functional
6. **MEDIUM**: Wire right rail stats to actual data or remove them
7. **LOW**: Generate real UUIDs or document that IDs are assigned server-side

### Overall Assessment
The wizard is **functionally complete for basic use** but **missing key features** (sub-asset classes) and has **UI/messaging inconsistencies** that may confuse users. The form state duplication (BuyBoxWizard + wizardHelpers) creates maintenance risk.
