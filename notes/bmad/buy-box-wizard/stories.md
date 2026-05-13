# Stories — Buy Box Wizard Buildout
Date: 2026-05-03
Author: SM phase
Requires: architecture.md

Each story must have a passing test before it is marked complete.
Stories longer than 2 hours must be split before implementation begins.

---

## Story 1 — Backend: migration + route updates
Repo: scoutgpt-api
Est: 30 min

Tasks:
- Write migrations/029_buybox_schema_gaps.sql (8 ALTER TABLE statements)
- Apply migration against the database
- Add 8 new fields to onboarding.js INSERT (destructure + column list + values array)
- Add 8 new fields to buyboxes.js PATCHABLE_FIELDS array
- Manual verification: POST to /api/dealfeed/onboarding with notes + value_min — confirm 201 and row in DB

Acceptance: SELECT notes, value_min, out_of_state_only FROM df_buy_boxes returns columns without error.

---

## Story 2 — Frontend CSS additions
Repo: nightdrop-dashboard
Est: 30 min

Tasks:
- Append ~80 lines to src/styles/styles.css
- Classes: .wizard-step-intro, .wizard-tabs, .wizard-tab, .wizard-tab.active,
  .check-card, .check-card.selected, .check-card-desc,
  .chip, .chip-remove, .tag-input-wrap, .toggle-row,
  .range-row, .review-section, .review-row, .wizard-confirm
- Verify both light and dark themes — no hardcoded colors, CSS vars only

Acceptance: Classes exist; no hardcoded hex colors; both themes render correctly.

---

## Story 3 — Wizard shell + Step 1: Name & Description
Repo: nightdrop-dashboard
Est: 45 min

Tasks:
- Replace NewBoxWizard.jsx with new shell (step state, form state, update helper)
- Implement StepProgress (7-segment bar)
- Implement StepName (label input + notes textarea)
- Backdrop click does NOT close; X and Cancel close from any step
- Step 1 validation: Next disabled until label is non-empty

Acceptance: Open wizard, type label, progress bar shows step 1 active, Next enables.

---

## Story 4 — Step 2: Market Geography
Repo: nightdrop-dashboard
Est: 1.5 hr

Tasks:
- Implement StepGeo with 4-tab mode selector
- State mode: US states multi-select + ChipList
- Metro mode: TagInput with typeahead placeholder + ChipList
- ZIP mode: TagInput (Enter to add) + ChipList
- Radius mode: address text input + range slider (1–100 mi, default 25)
- ChipList and TagInput primitives
- Step 2 validation: Next disabled until active mode has data

Acceptance: Each mode renders distinct input; chips appear and can be removed; Next gated correctly.

---

## Story 5 — Step 3: Asset Classes
Repo: nightdrop-dashboard
Est: 30 min

Tasks:
- Implement StepAssetClasses using CheckCard primitive
- CheckCard: label, selected state (green tint + check icon), onToggle
- 2-col grid layout
- Step 3 validation: Next disabled until at least one class selected

Acceptance: Cards toggle; at least one required to proceed.

---

## Story 6 — Step 4: Property Criteria
Repo: nightdrop-dashboard
Est: 45 min

Tasks:
- Implement StepCriteria
- MinMaxPair primitive for acres, value (dollar formatting on blur), year built
- Min hold years: number stepper (1–30) with "yr" label inline
- Zoning codes: TagInput + ChipList
- All fields optional — Next always enabled

Acceptance: Numeric fields accept numbers; value fields format on blur; min/max pairs side by side.

---

## Story 7 — Step 5: Ownership Profile
Repo: nightdrop-dashboard
Est: 30 min

Tasks:
- Implement StepOwnership
- 4 CheckCards: Individual, LLC or Entity, Trust, Corporate
- 2 ToggleRow components: absentee_only, out_of_state_only
- All optional — Next always enabled

Acceptance: Cards and toggles update form state correctly.

---

## Story 8 — Step 6: Distress Signals
Repo: nightdrop-dashboard
Est: 30 min

Tasks:
- Implement StepDistress
- 5 CheckCards (full width, each with label + description text)
- ToggleRow for distress_only at bottom
- All optional — Next always enabled

Acceptance: Signal cards toggle; distress_only toggle updates form.

---

## Story 9 — Step 7: Review + Activation
Repo: nightdrop-dashboard
Est: 1 hr

Tasks:
- Implement StepReview (read-only summary, grouped sections using fmt())
- Implement buildPayload(form): strips empty strings, converts numerics, scopes geo to active mode
- POST to /api/dealfeed/onboarding on Activate click
- submitting state disables Activate button during POST
- On 201: show ConfirmationState (success icon, box name, first-run copy)
- On error: show submitError inline, stay on step 7
- ConfirmationState "View Buy Boxes" button: calls onClose() + refetch()

Acceptance: Full wizard completes; DB row created; buy boxes list refreshes without reload.

---

## Story 10 — QA pass
Est: 30 min

Scenarios:
1. Happy path: all 7 steps with full data — confirm DB row
2. Minimal path: label + one state + one asset class — confirm submission
3. Validation gates: empty label on step 1, no geo on step 2, no class on step 3 — Next stays disabled
4. Error path: break the endpoint — confirm error displays and wizard stays open
5. Theme: switch to light mid-wizard — confirm no visual regressions
6. Max buy boxes: attempt a 4th box — confirm backend 400 surfaces as user-visible error

Acceptance: All 6 scenarios pass. No console errors.
