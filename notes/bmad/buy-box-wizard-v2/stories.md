# Stories — buy-box-wizard-v2

Date: 2026-05-11
Feature: buy-box-wizard-v2
Repo: nightdrop-dashboard

All stories are estimated at 2 hours or less. Complex stories are split. Each story is not complete until tests pass.

---

## Story 1: Backend Migration and API Routes (scoutgpt-api)

**Estimated Time:** 30 minutes
**Depends On:** None
**Blocks:** All frontend stories (must exist before frontend can successfully save/load)

**Objective:** Create database schema for 13 new buy box fields and update API routes to accept/persist them.

### Tasks

1. Create `migrations/043_buybox_wizard_v2.sql`
   - Add 13 new columns to df_buy_boxes:
     - distress_match_mode TEXT DEFAULT 'or'
     - min_equity_pct INTEGER
     - assessed_below_market BOOLEAN DEFAULT FALSE
     - climate_risk_max INTEGER DEFAULT 100
     - flood_exclude BOOLEAN DEFAULT FALSE
     - wildfire_risk_max INTEGER DEFAULT 100
     - heat_risk_max INTEGER DEFAULT 100
     - delivery_max_per_run INTEGER DEFAULT 10
     - match_threshold NUMERIC(3,2) DEFAULT 0.80
     - stories_min INTEGER
     - stories_max INTEGER
     - units_min INTEGER
     - units_max INTEGER
   - Use ALTER TABLE IF EXISTS syntax for safety.
   - No down migration needed (V2 defers rollback strategy).

2. Update `routes/dealfeed/onboarding.js`
   - Locate validateAssetClass() call (~line 45).
   - Modify to skip validation if request.body.asset_class is null:
     ```javascript
     if (request.body.asset_class !== null) {
       validateAssetClass(request.body.asset_class);
     }
     ```
   - Locate INSERT query (~line 65).
   - Add all 13 new fields to destructuring:
     ```javascript
     const { distress_match_mode, min_equity_pct, assessed_below_market, ... } = request.body;
     ```
   - Add all 13 columns to INSERT column list.
   - Add all 13 placeholders to VALUES tuple.

3. Update `routes/dealfeed/buyboxes.js`
   - Locate PATCHABLE_FIELDS array (~line 30).
   - Add all 13 field names:
     ```javascript
     const PATCHABLE_FIELDS = [
       'label', 'status', 'geo_states', ..., 
       'distress_match_mode', 'min_equity_pct', 'assessed_below_market', 
       'climate_risk_max', 'flood_exclude', 'wildfire_risk_max', 'heat_risk_max',
       'delivery_max_per_run', 'match_threshold', 'stories_min', 'stories_max',
       'units_min', 'units_max'
     ];
     ```

4. Commit with message: `feat(buybox): migration 043 + new fields for wizard-v2`

5. Push to main branch.

6. Render deploy: monitor scoutgpt-app deployment (~2 min). Verify build succeeds.

7. Apply migration on production database via Render shell:
   ```bash
   cd /app && npm run migrate
   ```

### Acceptance Criteria

- [ ] Migration file 043 exists at migrations/043_buybox_wizard_v2.sql
- [ ] All 13 columns exist in df_buy_boxes after running migration:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name='df_buy_boxes' 
  AND column_name IN (
    'distress_match_mode', 'min_equity_pct', 'assessed_below_market',
    'climate_risk_max', 'flood_exclude', 'wildfire_risk_max', 'heat_risk_max',
    'delivery_max_per_run', 'match_threshold', 'stories_min', 'stories_max',
    'units_min', 'units_max'
  );
  ```
  Should return exactly 13 rows.
- [ ] POST /api/dealfeed/onboarding accepts request.body.asset_class as null without error.
- [ ] POST /api/dealfeed/onboarding INSERT includes all 13 new fields (no omitted columns).
- [ ] PATCH /api/dealfeed/buy-boxes/:id accepts all 13 new fields in request.body and updates database (no 400 validation errors).
- [ ] No console errors or warnings on either route.
- [ ] Render deployment for scoutgpt-app succeeds and migration applies without rollback.

### Test Method (Manual)

1. Render shell to scoutgpt-app, run migration.
2. SQL SELECT to verify columns exist.
3. POST /onboarding with all 13 fields + valid buy box payload, verify 201 response and DB insert.
4. PATCH /buy-boxes/:id with 13 fields, verify 200 response and DB update.
5. No errors in Render logs.

---

## Story 2: CSS Port and Design Token Mapping

**Estimated Time:** 45 minutes
**Depends On:** Story 1 (DB schema finalized)
**Blocks:** Story 4 (component port needs CSS)

**Objective:** Port nightdrop CSS prototype to src/styles/buy-box-wizard.css, map design tokens, override font, ensure both light/dark themes work.

### Tasks

1. Copy CSS from handoff nightdrop/styles.css.

2. Create src/styles/buy-box-wizard.css with all wizard CSS scoped under .buy-box-wizard root class.

3. Map design tokens:
   - Identify all color values in the handoff CSS.
   - For each hardcoded hex color, check if it's defined in src/styles/tokens.css (--green, --bg, --text, etc.).
   - If a token exists, replace hardcoded hex with var(--token-name).
   - If no token exists, add it to tokens.css in the appropriate section.
   - Document any new tokens added (e.g., --dot-grid-color, --card-border, etc.).

4. Override --font-mono:
   - Within .buy-box-wizard scope, set:
     ```css
     .buy-box-wizard {
       --font-mono: 'JetBrains Mono', monospace;
     }
     ```
   - Do NOT modify tokens.css global value.

5. Strip TweaksPanel CSS:
   - If nightdrop/styles.css contains any rules for .tweaks-panel, .tweaks, or similar debug UI, remove them.
   - No debug UI should be present in src/styles/buy-box-wizard.css.

6. Theme support:
   - Verify CSS uses prefers-color-scheme or explicit dark/light selectors.
   - Test rendered output with data-theme="light" and data-theme="dark" on <html>.
   - Both themes must render without missing colors or missing elements.

7. No global overrides:
   - Scan the entire file for selector patterns that leak outside .buy-box-wizard (e.g., body, *, html root rules).
   - All such rules must be scoped or moved inside .buy-box-wizard.

### Acceptance Criteria

- [ ] src/styles/buy-box-wizard.css exists and contains all wizard styles.
- [ ] All CSS is scoped under .buy-box-wizard root class (no global selector rules outside scope).
- [ ] No hardcoded hex colors in the file; all colors reference tokens.css variables or are overridden within wizard scope.
- [ ] --font-mono is overridden to JetBrains Mono within .buy-box-wizard scope.
- [ ] TweaksPanel CSS is completely removed (no debug UI rules).
- [ ] Browser test: npm run dev, wizard renders at localhost:5173, both light and dark themes display correctly.
- [ ] No console CSS warnings (missing var references, undefined classes, etc.).

### Test Method (Manual)

1. npm run dev.
2. Open wizard in browser (localhost:5173).
3. Toggle theme (click theme toggle in ParcylBar).
4. Verify light theme renders: all text readable, no missing backgrounds, correct colors.
5. Verify dark theme renders: same checks.
6. Open browser DevTools Styles tab, search .buy-box-wizard, verify no hardcoded hex colors in the file.
7. Search for any .tweaks or TweaksPanel references, should find zero results.

---

## Story 3: wizardHelpers.js Test-Driven Rewrite

**Estimated Time:** 1 hour
**Depends On:** Story 2 (CSS done, no blocking work)
**Blocks:** Story 4 (wizardHelpers must be ready for BuyBoxWizard to use)

**Objective:** Write comprehensive unit tests for wizardHelpers.js FIRST, then rewrite the module to pass all tests. Full round-trip testing (buildPayload <-> toFormState).

### Tasks

1. Write src/lib/wizardHelpers.test.js from scratch (TDD approach):

   **Test Group 1: EMPTY_FORM Shape (5 tests)**
   - Verify EMPTY_FORM is an object.
   - Verify all top-level keys exist (assets, geo, phys, fin, owner, signals, logic, risk, threshold, name, delivery).
   - Verify nested objects exist (geo.states, phys.sf_min, etc.).
   - Verify array fields are initialized as empty arrays.
   - Verify boolean fields default to false (or correct value).
   - Verify numeric fields default to null or correct value (threshold defaults to 0.80).

   **Test Group 2: canProceedStep (15+ tests, 2-3 per step)**
   - Step 1:
     - PASS: assets has 1+ item AND geo.states has 1+ item.
     - FAIL: assets empty, geo.states filled.
     - FAIL: assets filled, geo.states empty.
     - FAIL: both empty.
   - Step 2: Always passes (no gates).
   - Step 3: Always passes (no gates).
   - Step 4: (distress signals are optional; no gate in V1, but document if future gate needed).
   - Step 5: Always passes (threshold has default).
   - Step 6:
     - PASS: name is non-empty string.
     - FAIL: name is empty string.
     - FAIL: name is null.

   **Test Group 3: buildPayload (25+ tests)**
   - Asset mapping: assets: ['sfr', 'commercial'] -> asset_class: null, asset_classes: ['sfr', 'commercial'].
   - Geo mapping: geo.states, geo.counties, geo.zips map directly to geo_states, geo_counties, geo_zips.
   - Physical mapping: phys.sf_min/max -> sf_min/max (all numeric fields).
   - Financial mapping:
     - price min/max -> value_min/max.
     - equity_preset (null) -> min_equity_pct: null.
     - equity_preset (25) -> min_equity_pct: 25.
     - assessed_below_market: false -> assessed_below_market: false.
   - Owner mapping:
     - entity: ['corp', 'llc'] -> owner_types: ['corp', 'llc'].
     - occupancy: 'absentee' -> absentee_only: true.
     - occupancy: 'owner_occupied' -> absentee_only: false.
     - occupancy: null -> absentee_only: false.
     - hold_min/max -> hold_period_min/max.
     - out_of_state: true -> out_of_state_only: true.
   - Signal mapping:
     - signals: ['foreclosure', 'ltv'] -> distress_signals: ['foreclosure', 'ltv'].
     - logic.mode: 'and' -> distress_match_mode: 'and'.
   - Risk mapping: risk.* -> climate_risk_max, flood_exclude, wildfire_risk_max, heat_risk_max (all map directly).
   - Delivery mapping:
     - cadence: 'daily' -> run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }.
     - cadence: 'weekly' -> run_schedule: { days: ['mon'] }.
     - cadence: 'realtime' -> run_schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] } (same as daily).
     - max_per_run: 10 -> delivery_max_per_run: 10.
   - Payload completeness: all 13 new fields present in output.
   - Edge cases: null/empty arrays handled gracefully (no exceptions).

   **Test Group 4: toFormState (15+ tests)**
   - Reverse asset mapping: asset_classes: ['sfr'] -> assets: ['sfr'].
   - Reverse geo mapping: geo_states, geo_counties, geo_zips map directly.
   - Reverse physical: all fields map directly by name.
   - Reverse financial:
     - value_min/max -> price_min/max.
     - min_equity_pct: 25 -> equity_preset: 25.
     - min_equity_pct: null -> equity_preset: null.
   - Reverse owner:
     - owner_types: ['corp'] -> entity: ['corp'].
     - absentee_only: true -> occupancy: 'absentee'.
     - absentee_only: false -> occupancy: 'owner_occupied' (or null, depending on design).
     - hold_period_min/max -> hold_min/max.
     - out_of_state_only: true -> out_of_state: true.
   - Reverse signal: distress_signals -> signals, distress_match_mode -> logic.mode.
   - Reverse risk: all fields map directly.
   - Reverse delivery:
     - run_schedule: { days: ['mon', 'tue', ..., 'sun'] } -> cadence: 'daily'.
     - run_schedule: { days: ['mon'] } -> cadence: 'weekly'.
     - delivery_max_per_run -> max_per_run.
   - Completeness: output is a valid EMPTY_FORM shape.

   **Test Group 5: Round-Trip (5+ tests)**
   - buildPayload(toFormState(savedBox)) === originalPayload (deep equality).
   - Test with 5 different multi-field combinations (minimal, maximal, mixed).
   - Test with null/empty fields preserved correctly.

2. Run tests: npx vitest run src/lib/wizardHelpers.test.js
   - All tests FAIL (RED state).

3. Rewrite src/lib/wizardHelpers.js to pass all tests:

   ```javascript
   export const EMPTY_FORM = { /* shape from requirements */ }

   export function canProceedStep(step, form) {
     switch (step) {
       case 1:
         return form.assets.length > 0 && form.geo.states.length > 0;
       case 2:
       case 3:
       case 4:
       case 5:
         return true;
       case 6:
         return form.name && form.name.trim().length > 0;
       default:
         return false;
     }
   }

   export function buildPayload(form) {
     const deliveryDaysMap = {
       'daily': ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
       'weekly': ['mon'],
       'realtime': ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
     };

     return {
       asset_class: null,
       asset_classes: form.assets,
       geo_states: form.geo.states,
       geo_counties: form.geo.counties,
       geo_zips: form.geo.zips,
       sf_min: form.phys.sf_min,
       sf_max: form.phys.sf_max,
       acres_min: form.phys.acres_min,
       acres_max: form.phys.acres_max,
       year_built_min: form.phys.year_min,
       year_built_max: form.phys.year_max,
       stories_min: form.phys.stories_min,
       stories_max: form.phys.stories_max,
       units_min: form.phys.units_min,
       units_max: form.phys.units_max,
       value_min: form.fin.price_min,
       value_max: form.fin.price_max,
       min_equity_pct: form.fin.equity_preset,
       assessed_below_market: form.fin.assessed_below_market,
       owner_types: form.owner.entity,
       absentee_only: form.owner.occupancy === 'absentee',
       hold_period_min: form.owner.hold_min,
       hold_period_max: form.owner.hold_max,
       out_of_state_only: form.owner.out_of_state,
       distress_signals: form.signals,
       distress_match_mode: form.logic.mode,
       climate_risk_max: form.risk.climate_max,
       flood_exclude: form.risk.flood_exclude,
       wildfire_risk_max: form.risk.wildfire_max,
       heat_risk_max: form.risk.heat_max,
       match_threshold: form.threshold,
       label: form.name,
       run_schedule: { days: deliveryDaysMap[form.delivery.cadence] || deliveryDaysMap['daily'] },
       delivery_max_per_run: form.delivery.max_per_run
     };
   }

   export function toFormState(buyBox) {
     const cadenceMap = {
       ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']: 'daily',
       ['mon']: 'weekly'
     };

     const cadence = buyBox.run_schedule && buyBox.run_schedule.days
       ? (buyBox.run_schedule.days.length === 7 ? 'daily' : buyBox.run_schedule.days.length === 1 ? 'weekly' : 'daily')
       : 'daily';

     return {
       assets: buyBox.asset_classes || [],
       geo: {
         states: buyBox.geo_states || [],
         counties: buyBox.geo_counties || [],
         zips: buyBox.geo_zips || []
       },
       phys: {
         sf_min: buyBox.sf_min,
         sf_max: buyBox.sf_max,
         acres_min: buyBox.acres_min,
         acres_max: buyBox.acres_max,
         year_min: buyBox.year_built_min,
         year_max: buyBox.year_built_max,
         stories_min: buyBox.stories_min,
         stories_max: buyBox.stories_max,
         units_min: buyBox.units_min,
         units_max: buyBox.units_max
       },
       fin: {
         price_min: buyBox.value_min,
         price_max: buyBox.value_max,
         equity_preset: buyBox.min_equity_pct,
         assessed_below_market: buyBox.assessed_below_market || false
       },
       owner: {
         entity: buyBox.owner_types || [],
         occupancy: buyBox.absentee_only ? 'absentee' : 'owner_occupied',
         hold_min: buyBox.hold_period_min,
         hold_max: buyBox.hold_period_max,
         out_of_state: buyBox.out_of_state_only || false
       },
       signals: buyBox.distress_signals || [],
       logic: {
         mode: buyBox.distress_match_mode || 'or'
       },
       risk: {
         climate_max: buyBox.climate_risk_max || 100,
         flood_exclude: buyBox.flood_exclude || false,
         wildfire_max: buyBox.wildfire_risk_max || 100,
         heat_max: buyBox.heat_risk_max || 100
       },
       threshold: buyBox.match_threshold || 0.80,
       name: buyBox.label || '',
       delivery: {
         cadence,
         max_per_run: buyBox.delivery_max_per_run || 10
       }
     };
   }
   ```

4. Run tests: npx vitest run src/lib/wizardHelpers.test.js
   - All tests PASS (GREEN state).

5. Verify coverage: npx vitest run src/lib/wizardHelpers.test.js --coverage
   - wizardHelpers.js coverage must be 100%.

6. Commit: `feat(wizard): wizardHelpers.js TDD rewrite with full round-trip tests`

### Acceptance Criteria

- [ ] src/lib/wizardHelpers.test.js exists with 60+ test cases.
- [ ] All test cases pass: npx vitest run src/lib/wizardHelpers.test.js returns 0 (success).
- [ ] Code coverage: 100% for src/lib/wizardHelpers.js (all lines, branches, functions covered).
- [ ] Round-trip tests verify bidirectional fidelity (buildPayload(toFormState(box)) deep equality to original).
- [ ] No console errors or warnings during test run.
- [ ] EMPTY_FORM constant exported and used correctly throughout.
- [ ] canProceedStep logic matches page requirements (step 1 requires assets + geo, step 6 requires name).
- [ ] buildPayload handles all 13 new fields explicitly.
- [ ] toFormState handles all 13 new fields with proper reverse mapping.

### Test Method (Automated)

```bash
npx vitest run src/lib/wizardHelpers.test.js
npx vitest run src/lib/wizardHelpers.test.js --coverage
```

Both commands must succeed with 0 exit code and 100% coverage.

---

## Story 4: BuyBoxWizard.jsx Port and Component Integration

**Estimated Time:** 2 hours (at the limit; do not expand scope)
**Depends On:** Story 2 (CSS ready), Story 3 (wizardHelpers tests passing)
**Blocks:** Story 5 (integration testing)

**Objective:** Port BuyBoxWizard.jsx from handoff prototype, wire form state, handle create/edit modes, API calls, and match count debounce.

### Tasks

1. Create new src/components/BuyBoxWizard.jsx:
   - Port nightdrop/app.jsx structure.
   - Define component shell with state: currentPage, form, matchCount, loading, error.
   - Import EMPTY_FORM and helper functions from wizardHelpers.js.
   - Initialize form:
     - mode='create': form = EMPTY_FORM.
     - mode='edit': form = toFormState(initialData).
   - Render 6 page subcomponents based on currentPage.
   - Render RightRail component (persistent across pages).
   - Implement Next/Back/Cancel/Submit button handlers.
   - No changes to App.jsx prop interface.

2. Create src/components/pages/Page1.jsx (Asset class + Geography):
   - Import from handoff nightdrop/page1.jsx.
   - Props: { form, setForm }.
   - Render 8-card grid for asset selection.
   - Render state combobox, county drill-down, ZIP input.
   - Update form on user interaction.

3. Create src/components/pages/Page23.jsx (Physical + Financial + Owner):
   - Import from handoff nightdrop/page23.jsx.
   - Props: { form, setForm }.
   - Render page 2 sections: sqft, acres, year, stories, units, price, equity preset, assessed toggle.
   - Render page 3 sections: entity, occupancy, hold, out_of_state.
   - Update form on user interaction.

4. Create src/components/pages/Page4.jsx (Signals + Risk):
   - Import from handoff nightdrop/page4.jsx.
   - Props: { form, setForm }.
   - Render signal checklist, AND/OR logic radio, climate/flood/wildfire/heat sliders.
   - Update form on user interaction.

5. Create src/components/pages/Page5.jsx (Threshold):
   - Import from handoff nightdrop/page5.jsx.
   - Props: { form, setForm }.
   - Render 3 threshold cards (70/80/90).
   - Update form.threshold on selection.

6. Create src/components/pages/Page6.jsx (Activation):
   - Import from handoff nightdrop/page6.jsx.
   - Props: { form, setForm, matchCount, onActivate, isLoading }.
   - Render name input, delivery cadence cards, max stepper, match count hero, Activate button.
   - Update form on user interaction.
   - Call onActivate() on Activate button click.

7. Create src/components/BuyBoxRightRail.jsx:
   - Import from handoff nightdrop/right-rail.jsx.
   - Props: { form, matchCount, isLoading }.
   - Render match count display (debounced, labeled as estimate), delta, stat tiles, map thumbnail, filter chips.
   - Read-only; no state updates.

8. Create src/components/buybox-icons.jsx:
   - Copy inline SVG icon functions from handoff nightdrop/icons.jsx.
   - Do NOT merge into src/components/Icons.jsx (keep separate to avoid namespace conflicts).
   - Import locally within BuyBoxWizard and subcomponents.

9. Implement form state management in BuyBoxWizard.jsx:
   - Use useState for form, currentPage, matchCount, loading, error.
   - Define setForm(newForm) to update form state (immutable pattern: return {...form, ...updates}).
   - All child components call setForm when form fields change.

10. Implement debounced preview fetch:
    - On every form change, debounce (400ms) a POST /api/dealfeed/buy-boxes/preview call.
    - Extract preview-relevant fields (geo_states, geo_counties, geo_zips, value_min, value_max, year_built_min, year_built_max, acres_min, acres_max, absentee_only).
    - Call buildPayload, filter to preview fields, POST.
    - On response: setMatchCount(response.count).
    - On error: log to console, matchCount stays at previous value (silent failure acceptable for V1).

11. Implement API calls for save:
    - On Next/Back: validate form.canProceedStep(currentPage, form), if false disable button (button disabled state).
    - On Submit (Activate button on page 6):
      - Validate form.canProceedStep(6, form).
      - Call buildPayload(form) to generate payload.
      - setLoading(true).
      - If mode='create': api.post('/api/dealfeed/onboarding', payload).
      - If mode='edit': api.patch('/api/dealfeed/buy-boxes/' + initialData.id, payload).
      - On success (200 or 201):
        - setLoading(false).
        - Call onSuccess(response.buy_box or response.data.buy_box).
      - On error (400, 500, etc.):
        - setLoading(false).
        - setError(error.message or generic "Failed to save").
        - Show error toast via useToast() hook.
        - Form state preserved (user can correct and retry).

12. Implement cancel:
    - Cancel button on any page calls onCancel().
    - Add confirmation if form has unsaved changes (optional, nice-to-have; not required for V1).

13. Strip TweaksPanel:
    - No TweaksPanel component imported or rendered.
    - No tweaks state management.

### Acceptance Criteria

- [ ] BuyBoxWizard.jsx mounts without errors in browser (npm run dev).
- [ ] Page navigation works (Next/Back buttons navigate correctly, canProceedStep gates work).
- [ ] Form state persists across page navigation (user fills page 1, goes to page 2, back to page 1, values still there).
- [ ] Match count updates within 400ms of field change (visible in right rail).
- [ ] Create mode: complete all 6 pages, click Activate, API call succeeds (mock or real backend).
- [ ] Edit mode: initialData props passed, form pre-populates, edit and save works.
- [ ] Cancel button closes wizard without saving.
- [ ] No console errors or warnings.
- [ ] Right rail renders and displays match count, stat tiles, filter chips.

### Test Method (Manual)

1. npm run dev.
2. Open browser to localhost:5173.
3. Click "Create Buy Box" (or trigger showWizard state).
4. Page 1: Select 1 asset, select 1 state, click Next.
5. Verify Next button enabled, page advances to Page 2.
6. Click Back, verify page returns to Page 1 with values preserved.
7. Advance to Page 6, verify right rail shows match count (may be 0 if backend not ready).
8. Fill name, click Activate, observe API call in DevTools Network tab.
9. Edit mode: if backend has saved buy boxes, open one for edit, verify form pre-populates.
10. No errors in DevTools console.

---

## Story 5: Integration Smoke Test (Create/Edit/DB Round-Trip)

**Estimated Time:** 30 minutes
**Depends On:** Story 4 (BuyBoxWizard working), Story 1 (backend deployed)
**Blocks:** Story 6 (QA comprehensive testing)

**Objective:** Manual integration test: create a buy box via the wizard, verify it saves to the database with all fields, edit it, verify updates. Full round-trip.

### Tasks

1. Start dev environment:
   ```bash
   cd ~/nightdrop-dashboard && npm run dev
   ```
   (Keep running in background terminal.)

2. Create a new buy box:
   - Open localhost:5173 in browser.
   - Trigger create wizard (e.g., AppShell button or mock onboarding state).
   - Page 1: Select asset "SFR", select state "CA", add ZIP "90210", click Next.
   - Page 2: Enter sf_min=1000, sf_max=5000, price_min=200000, price_max=1000000, click Next.
   - Page 3: Select entity "Corp", occupancy "Owner Occupied", hold_min=2, hold_max=10, click Next.
   - Page 4: Select signals "foreclosure" and "ltv", mode "Or", risk sliders default, click Next.
   - Page 5: Select threshold "80% Balanced", click Next.
   - Page 6: Enter name "Test Buy Box 1", cadence "Daily", max=10, click Activate.
   - Observe success (toast or page redirect).

3. Verify database:
   - Connect to scoutgpt-app Neon database via Render shell or psql:
     ```bash
     SELECT id, label, geo_states, asset_classes, sf_min, sf_max, value_min, value_max,
            owner_types, distress_signals, distress_match_mode, match_threshold
     FROM df_buy_boxes
     WHERE label = 'Test Buy Box 1'
     LIMIT 1;
     ```
   - Verify all fields match what was entered:
     - label: 'Test Buy Box 1'
     - geo_states: ['CA']
     - geo_zips: ['90210']
     - asset_classes: ['sfr']
     - sf_min: 1000, sf_max: 5000
     - value_min: 200000, value_max: 1000000
     - owner_types: ['corp'] (lowercase expected from backend)
     - distress_signals: ['foreclosure', 'ltv']
     - distress_match_mode: 'or'
     - match_threshold: 0.80

4. Edit the saved buy box:
   - Fetch the saved buy box from GET /api/dealfeed/buy-boxes.
   - Open edit wizard with initialData = savedBuyBox.
   - Verify form pre-populates:
     - Page 1: asset "SFR" selected, state "CA" selected, ZIP "90210" visible.
     - Page 2: sf_min=1000, sf_max=5000, price values populated.
     - Other pages match.
   - Edit page 2: change sf_max from 5000 to 6000.
   - Advance to Page 6, change name to "Test Buy Box 1 EDITED", click Save.
   - Observe success.

5. Verify database update:
   ```bash
   SELECT label, sf_max FROM df_buy_boxes WHERE id = '<buy_box_id>';
   ```
   - label: 'Test Buy Box 1 EDITED'
   - sf_max: 6000

6. Verify match count:
   - While editing or creating, observe right rail match count updating as fields change.
   - If match count is 0 or > 0, it should update within 400ms of field change.

7. No console errors:
   - Open DevTools Console while performing the above steps.
   - Should see zero error messages (warnings OK, errors not OK).

### Acceptance Criteria

- [ ] Create workflow completes successfully (no 500 errors, success toast/redirect).
- [ ] Created buy box appears in database with all fields saved correctly.
- [ ] Edit workflow: initialData restores all fields in form.
- [ ] Edit save updates database correctly (new name, changed field values).
- [ ] Match count displays in right rail and updates on field change.
- [ ] No console errors during create/edit workflows.
- [ ] Database round-trip: API payload matches database row exactly (validate with direct SELECT query).

### Test Method (Manual, No Automation)

Follow the tasks above. Use browser DevTools, psql, and Render shell for verification. Record results in a checklist (copy acceptance criteria above).

---

## Story 6: Playwright E2E Smoke Tests and QA Plan

**Estimated Time:** 45 minutes
**Depends On:** Story 5 (integration verified)
**Blocks:** None (final story)

**Objective:** Write and execute Playwright E2E smoke tests covering 6 scenarios (create, edit, validation, error handling, agent field verification). Update tests/smoke.spec.js.

### Tasks

1. Write/update tests/smoke.spec.js with 6 scenarios:

**Scenario 1: Happy Path Create (Full Data)**
- Test name: "should create buy box with full data"
- Steps:
  1. Navigate to / (dashboard).
  2. Trigger create wizard.
  3. Page 1: Click asset "SFR", click asset "Commercial", select state "TX", add ZIP "77001", click Next.
  4. Page 2: Enter sqft 1000-5000, acres 2-10, year 2000-2020, stories 1-3, units 0-50, price 100K-1M, select equity 25%, toggle assessed, click Next.
  5. Page 3: Select entity "Corp", select entity "LLC", occupancy "Absentee", hold 1-5, toggle out_of_state, click Next.
  6. Page 4: Check "Foreclosure", check "LTV", select "And", set climate 80, toggle flood, set wildfire 70, set heat 75, click Next.
  7. Page 5: Click "90%+ Precision" (0.90), click Next.
  8. Page 6: Enter name "E2E Full Buy Box", cadence "Daily", max 15, click Activate.
  9. Expect success state (page redirects or toast shows success).
- Assertion: Buy box row appears in buy boxes list with label "E2E Full Buy Box".

**Scenario 2: Minimal Path Create (Required Only)**
- Test name: "should create buy box with minimal data"
- Steps:
  1. Open wizard.
  2. Page 1: Click asset "SFR", select state "CA", click Next.
  3. Page 2-5: Skip to defaults (don't fill optional fields), click Next on each.
  4. Page 6: Enter name "E2E Minimal Buy Box", click Activate.
  5. Expect success.
- Assertion: Buy box created (verify via API GET /buy-boxes returns it).

**Scenario 3: Edit Mode Pre-Population**
- Test name: "should pre-populate edit form from saved buy box"
- Prerequisites: An existing buy box in the database (create one in Scenario 1).
- Steps:
  1. Open buy boxes list.
  2. Click Edit on "E2E Full Buy Box" (from Scenario 1).
  3. Page 1: Verify assets include "SFR" and "Commercial", state is "TX", ZIP is "77001".
  4. Page 2: Verify sqft 1000-5000, acres 2-10, etc.
  5. Click Next, Next, ... advance to Page 6.
  6. Change name to "E2E Full Buy Box EDITED", click Save.
  7. Expect success.
- Assertion: Buy box name updated in list and database.

**Scenario 4: Validation Gates (Step 1 Required Fields)**
- Test name: "should prevent proceeding without required fields on page 1"
- Steps:
  1. Open wizard.
  2. Page 1: Do NOT select any asset, do NOT select any state.
  3. Attempt to click Next.
  4. Expect Next button disabled or error message.
- Assertion: Page does not advance to Page 2.

**Scenario 5: Error Handling (Simulate 500)**
- Test name: "should handle API error and preserve form"
- Prerequisites: Mock or intercept the onboarding endpoint to return 500.
- Steps:
  1. Complete wizard pages 1-5.
  2. Page 6: Enter name, click Activate.
  3. Expect error toast or error message displayed.
  4. Verify form is still open and fields are preserved.
  5. (If mocking allows) Fix the mock to return success, click Activate again.
  6. Expect success.
- Assertion: Error handling preserves form state; retry succeeds.

**Scenario 6: Agent Field Verification (DB Check)**
- Test name: "should persist all agent-required fields to database"
- Steps:
  1. Create buy box with specific values:
     - assets: ['sfr', 'commercial']
     - geo_states: ['TX']
     - distress_signals: ['foreclosure', 'arm']
     - min_equity_pct: 50
     - units_min: 10, units_max: 100
  2. Query database directly:
     ```sql
     SELECT asset_classes, distress_signals, min_equity_pct, units_min, units_max
     FROM df_buy_boxes
     WHERE id = '<created_id>';
     ```
  3. Verify:
     - asset_classes: ['sfr', 'commercial']
     - distress_signals: ['foreclosure', 'arm']
     - min_equity_pct: 50
     - units_min: 10, units_max: 100
- Assertion: All agent-required fields persisted correctly.

2. Playwright configuration check:
   - Verify playwright.config.js sets webServer: null (tests expect dev server already running).
   - Verify tests/smoke.spec.js imports { test, expect } from '@playwright/test'.

3. Run tests:
   ```bash
   npm run dev  # in one terminal
   npx playwright test tests/smoke.spec.js  # in another terminal
   ```

4. If tests fail:
   - Diagnose: check browser output, check backend logs.
   - Fix: update test selectors or implementation.
   - Retry: npx playwright test tests/smoke.spec.js.
   - Do NOT move to next story until all 6 tests pass.

5. Generate report:
   ```bash
   npx playwright show-report
   ```
   - Verify visual evidence of tests passing (screenshots, videos if enabled).

6. Commit: `test(smoke): buy-box-wizard-v2 E2E scenarios (create, edit, validation, error, db-verify)`

### Acceptance Criteria

- [ ] tests/smoke.spec.js exists with 6 test scenarios.
- [ ] All 6 tests pass: npx playwright test tests/smoke.spec.js returns 0 (success).
- [ ] No console errors in Playwright logs (warnings OK).
- [ ] HTML report generated and viewable (npx playwright show-report).
- [ ] Scenario 1 (happy path): buy box created, appears in list.
- [ ] Scenario 2 (minimal path): buy box created with defaults.
- [ ] Scenario 3 (edit): form pre-populates, edit saves correctly.
- [ ] Scenario 4 (validation): required field gates enforce, Next disabled.
- [ ] Scenario 5 (error): 500 error shows toast, form preserved, retry works.
- [ ] Scenario 6 (DB): all agent fields persisted correctly, direct SQL verification passes.

### Test Method (Automated)

```bash
# Terminal 1
npm run dev

# Terminal 2
npx playwright test tests/smoke.spec.js
npx playwright show-report
```

Both commands succeed (0 exit code). Report shows all 6 tests passing.

---

## Story Order and Dependencies

```
Story 1 (Backend Migration)     [30 min]
  |-> Story 2 (CSS Port)       [45 min]
         |-> Story 4 (Component Port)    [2 hr]
              |-> Story 5 (Integration) [30 min]
                   |-> Story 6 (E2E QA) [45 min]
  |-> Story 3 (wizardHelpers)  [1 hr]
```

**Parallel:** Stories 2 and 3 can run in parallel after Story 1 is done. Story 4 waits for both.

**Sequenced:** Stories 5 and 6 must run after 4, in order.

---

## Session Handoff

After all stories complete, create/update notes/HANDOFF.md with:
- Status: COMPLETE
- What was done: [exact files changed, line numbers, what was added/removed]
- What was NOT done: [defer V2 scope items]
- Next session: Link to buy-box-wizard-v2 BMAD folder
- Blockers: None (if all stories pass)
