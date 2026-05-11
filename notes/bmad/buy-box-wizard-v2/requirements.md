# Requirements — buy-box-wizard-v2

Date: 2026-05-11
Feature: buy-box-wizard-v2
Repo: deal-feed-dashboard

## Purpose and Criticality

The buy box wizard is the core data capture layer for the automated CRE deal feed agent. Every filter saved by a user in the wizard is read by run_deal_feed.js (Node.js script in scoutgpt-api) to match properties from a 423K-property database and deliver deal recommendations to subscribers. A single field saved incorrectly cascades into wrong deals delivered, degrading subscriber trust and causing churn.

This is a critical feature in the deal-feed system and requires pixel-perfect implementation with full test coverage.

## Functional Requirements

### Multi-Page Wizard Structure

The wizard is a 6-page stateful form for creating and editing buy boxes.

**Page 1: Asset Class and Geography**
- Asset class selection: 8-card grid (SFR, small MF, large MF, commercial, industrial, mixed, land, hospitality). User selects 1+ cards. Store as asset_classes TEXT[] array.
- Geography: State combobox, county drill-down (multi-select if state selected), ZIP code chip input. Store as geo_states TEXT[], geo_counties TEXT[], geo_zips TEXT[].

**Page 2: Physical and Financial Ranges**
- Physical: sqft min/max, lot acres min/max, year built min/max, stories min/max, units min/max. Store as sf_min, sf_max, acres_min, acres_max, year_built_min, year_built_max, stories_min, stories_max, units_min, units_max.
- Financial: price min/max (value_min, value_max), equity preset (0/25/50/75 percent, store as min_equity_pct INT), assessed below market checkbox (assessed_below_market BOOLEAN).

**Page 3: Owner Characteristics**
- Owner entity type: entity[] multi-select (corp, trust, individual, llc, etc). Store as owner_types TEXT[].
- Occupancy: single choice selector. "Absentee" sets absentee_only BOOLEAN TRUE. Store as boolean.
- Hold period: min/max years. Store as hold_period_min, hold_period_max.
- Out of state toggle: sets out_of_state_only BOOLEAN.

**Page 4: Distress Signals and Risk**
- Distress signals: multi-select checklist (foreclosure, ltv, arm, equity, longhold). Store as distress_signals TEXT[].
- AND/OR logic: radio choice. "Match all" = AND, "Match any" = OR. Store as distress_match_mode TEXT ('and' or 'or').
- Climate risk: max slider 0-100. Store as climate_risk_max INT.
- Flood exclude: checkbox. Store as flood_exclude BOOLEAN.
- Wildfire and heat risk: max sliders 0-100. Store as wildfire_risk_max INT, heat_risk_max INT.

**Page 5: Match Threshold Selection**
- Three threshold cards (70% Volume / 80% Balanced / 90%+ Precision). User selects one. Store as match_threshold NUMERIC(3,2) (0.70 / 0.80 / 0.90).

**Page 6: Buy Box Activation**
- Buy box label/name: text input. Store as label TEXT.
- Delivery cadence: cards for daily, weekly, realtime. Store as run_schedule JSON ({"days": ["mon","tue",...]} for weekly, all days for daily/realtime).
- Max deals per run: number stepper. Store as delivery_max_per_run INT.
- Live match count: debounced hero number updated on field change via POST /preview.
- Activate button: submits entire form payload to backend.

### Right Rail (Persistent)

A fixed right sidebar visible across all 6 pages:
- Debounced match count (updated 400ms after field change, via POST /preview).
- Delta indicator (count trend: up/down/stable).
- Three stat tiles (placeholder values for V1, preview accuracy is estimate).
- Geographic concentration map thumbnail.
- Active filter chip display (shows what's been selected so far).

### Create Mode

User starts with EMPTY_FORM (all fields null/empty/defaults). Navigates 6 pages. On page 6, clicks Activate. Payload is sent to POST /api/dealfeed/onboarding. Response contains saved buy_box object. Call onSuccess(savedBuyBox).

### Edit Mode

User passes mode="edit" and initialData (a buy box from GET /api/dealfeed/buy-boxes). Form initializes via toFormState(initialData), reconstructing the handoff form state from all saved database fields. User navigates and edits fields. On submit, payload is sent to PATCH /api/dealfeed/buy-boxes/:id. Response contains updated buy_box object. Call onSuccess(savedBuyBox).

## Non-Functional Requirements

### Design Fidelity

- Pixel-perfect port of the handoff design (nightdrop aesthetic: Bloomberg terminal, dot-grid backdrop, dark mode by default).
- All layout, spacing, typography, and color scheme sourced from the provided handoff code.
- No design changes or improvements.
- Font override: --font-mono must be JetBrains Mono (not DM Sans) within the .buy-box-wizard CSS scope.

### Code Quality and Structure

- Component organization: BuyBoxWizard.jsx (shell), 6 page subcomponents, RightRail component, icons module (all ported from handoff).
- CSS isolation: all wizard styles scoped to .buy-box-wizard root class; no global style overrides.
- No hardcoded colors: all color values must reference tokens from tokens.css or be overridden via CSS variables within the wizard scope.
- No console.log statements in final code.
- Functions must be under 50 lines; files under 800 lines (split subcomponents as needed).

### Test Coverage

- wizardHelpers.js: 100% coverage (EMPTY_FORM shape, canProceedStep for all 6 steps, buildPayload for all field mappings and edge cases, toFormState round-trip).
- Overall application: minimum 80% coverage.
- All tests use TDD approach: tests written first, then implementation.

### API Contract Compliance

- buildPayload() must generate payloads that match backend INSERT/PATCH expectations exactly.
- toFormState() must reconstruct the form state identically from a saved buy box object (full round-trip fidelity).
- All 13 new fields must be included in every payload (no skipping optional fields).
- asset_class must be sent as null (not included in the form; new wizard uses asset_classes array instead).

## Out of Scope

- Design changes or improvements (handoff is final).
- Realtime delivery infrastructure (cadence is stored; realtime infra deferred to V2).
- match_threshold being actively used by run_deal_feed.js matcher (field is stored; active filtering deferred to V2).
- Improving preview endpoint accuracy (current endpoint only uses 10 fields; estimate is labeled as such).
- Removing or refactoring old wizard code at cleanup time (NewBoxWizard.jsx will remain as dead code).

## Data Integrity and Safety Requirements

### Bidirectional Conversion

- buildPayload() and toFormState() are inverse functions: buildPayload(toFormState(savedBox)) must produce a payload identical to the original save.
- All form fields must be tested for round-trip fidelity in wizardHelpers.test.js.
- Edit mode must restore every saved field correctly; missing or incorrect restoration is a blocker.

### Silent Failure Prevention

- buildPayload() field name mismatches immediately cause agent criteria errors (agent runs with wrong filter = wrong deals delivered).
- All field mappings must be explicitly verified in tests (no implicit conversions).
- run_schedule JSON structure must be validated (delivery.cadence must map to exactly one of three run_schedule formats).

### Database Schema Alignment

- Wizard fields must exactly match database columns (names and types).
- Migration 043 must define all 13 new columns before frontend ships.
- PATCHABLE_FIELDS in buyboxes.js must include all 13 new fields, or PATCH will return 400 Bad Request.
- All new fields must be included in onboarding.js INSERT query (null asset_class is acceptable; null new fields are not).

## Acceptance Criteria (Feature Level)

- [ ] All 6 pages render without errors in browser.
- [ ] Page navigation (Next/Back) works bidirectionally.
- [ ] Create mode: filling all 6 pages, clicking Activate creates a buy box in the database with all fields saved correctly.
- [ ] Edit mode: opening an existing buy box restores all fields to the form, editing and saving updates the database correctly.
- [ ] Match count updates within 400ms of a field change (visible in right rail).
- [ ] Cancel button on any page closes the wizard without saving.
- [ ] Form validation gates prevent moving to the next page without required fields (e.g., no asset selected on page 1 disables Next).
- [ ] No console errors or warnings.
- [ ] wizardHelpers.test.js passes 100% coverage.
- [ ] Playwright smoke tests pass (create, edit, validation, error handling scenarios).
