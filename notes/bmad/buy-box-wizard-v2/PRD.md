# PRD — buy-box-wizard-v2

Date: 2026-05-11
Feature: buy-box-wizard-v2
Repo: nightdrop-dashboard

## Problem Statement

The current buy box wizard (10-step, 786-line BuyBoxWizard.jsx) has poor user experience, missing data fields, and does not reflect actual database fill rates or agent matching logic. Users cannot express filters that the agent actually reads, leading to mismatched deal delivery and subscriber frustration.

A design handoff provides a complete prototype of a 6-page, reorganized wizard with a persistent right-rail match count display. The redesign consolidates pages, removes dead-end steps, and adds 13 critical filter dimensions (distress signals, risk thresholds, ownership characteristics, physical ranges) that the agent currently lacks.

This feature requires porting the handoff design exactly and wiring it into the React app with full backend support (database migration, API routes, form state management).

## Success Criteria

- [ ] Wizard completes without console errors or warnings.
- [ ] All form fields are saved to the database on create and update.
- [ ] Edit mode restores all saved fields without loss of fidelity.
- [ ] Match count updates within 400ms of field change.
- [ ] Form validation gates prevent invalid state transitions (e.g., no Next button when required fields missing).
- [ ] Database round-trip: buildPayload(toFormState(savedBox)) == originalPayload for all field combinations.
- [ ] No hardcoded colors; all styles use tokens.css or CSS variable overrides.
- [ ] Test coverage: wizardHelpers.js 100%, overall 80%+.
- [ ] Playwright smoke tests pass (create, edit, validation, error handling, agent field verification).

## V1 Scope

**Frontend (nightdrop-dashboard):**
- Port handoff design (6 pages + right rail) to BuyBoxWizard.jsx with 6 subcomponent pages.
- Rewrite wizardHelpers.js: EMPTY_FORM shape, canProceedStep logic, buildPayload, toFormState.
- Wire create (POST /api/dealfeed/onboarding) and edit (PATCH /api/dealfeed/buy-boxes/:id) API calls.
- Debounced (400ms) preview count fetch (POST /preview).
- CSS port with font override (--font-mono to JetBrains Mono).
- Full TDD test suite for wizardHelpers.js (100% coverage).
- Playwright smoke tests (create, edit, validation, error handling, DB verification).

**Backend (scoutgpt-api):**
- Migration 043: add 13 new columns to df_buy_boxes (distress_match_mode, min_equity_pct, assessed_below_market, climate_risk_max, flood_exclude, wildfire_risk_max, heat_risk_max, delivery_max_per_run, match_threshold, stories_min, stories_max, units_min, units_max).
- Update onboarding.js: skip validateAssetClass when asset_class is null, destructure + INSERT all 13 new fields.
- Update buyboxes.js: add all 13 new fields to PATCHABLE_FIELDS array.
- Confirm both routes compile and deploy without errors on scoutgpt-app.

## V2 Scope (Deferred)

- **Preview endpoint enhancement:** return avg_equity, avg_hold, pct_absentee stats for right-rail tiles instead of placeholders.
- **Realtime delivery infra:** support continuous match delivery (currently cadence only supports daily/weekly).
- **Active match_threshold filtering:** run_deal_feed.js currently ignores match_threshold; V2 will implement percentile-based score filtering.
- **Agent field verification:** full audit of which fields the matcher actually reads; add missing reads.

## Dependencies

**Blocking:** Migration 043 must be deployed to scoutgpt-app and run before frontend ships. If new columns do not exist, INSERT/PATCH will fail with column not found errors.

**Testing:** Render shell access to scoutgpt-app for manual SQL verification of new columns and successful migration.

**Timing:** Both frontend and backend deploys happen in lockstep. Frontend ships 10 minutes after scoutgpt-app migration is confirmed applied.

## Risk Assessment

### Risk 1: Silent Failures in buildPayload

**Severity:** Critical
**Description:** Field name mismatch (e.g., wizard sends min_equity_pct but database expects min_equity_percent) = agent receives incomplete or malformed criteria = wrong deals delivered.
**Mitigation:** Full round-trip testing (buildPayload/toFormState). Test every field explicitly in wizardHelpers.test.js. Verify generated payloads against migration 043 column names.

### Risk 2: Incomplete Form State Reconstruction

**Severity:** High
**Description:** toFormState fails to reconstruct a field in edit mode = user edits with missing data = saves incomplete payload = agent criteria silently drops the field.
**Mitigation:** TDD test for every field: savedBox -> toFormState -> form state -> buildPayload -> savedBox must be identical. Test with 5+ multi-field combinations.

### Risk 3: New Backend Columns Not Deployed in Time

**Severity:** Critical
**Description:** Frontend ships before migration 043 runs on scoutgpt-app = all INSERT/PATCH requests fail with 500.
**Mitigation:** Deploy migration first. Verify column existence with SQL query before releasing frontend. Include rollback plan (revert migration if needed, frontend gracefully falls back to old wizard).

### Risk 4: CSS Cascade Interference

**Severity:** Medium
**Description:** Wizard styles bleed into other views or vice versa = layout breaks in map, settings, or other pages.
**Mitigation:** All wizard CSS scoped to .buy-box-wizard root class. No global class overrides. Test both light and dark themes on all pages.

## Success Metrics

- Zero console errors on wizard completion.
- 100% of test scenarios pass (unit, integration, E2E).
- Database integrity: SELECT count(*) FROM df_buy_boxes WHERE created_at > '2 minutes ago' > 0 (at least one buy box created successfully).
- Edit mode round-trip: after edit, all fields match what was entered (manual DB query verification).
- Match count accuracy: count from /preview matches human count for sample buy boxes (V2 will improve this).

## Timeline

**Week 1:**
- Mon: BMAD phases 1-4 complete (this document).
- Tue-Wed: Backend migration + API route updates (Story 1).
- Thu: Code review on backend changes. Deploy to scoutgpt-app.
- Fri: Confirm migration applied on prod, SQL verification passes.

**Week 2:**
- Mon: Frontend CSS port (Story 2).
- Tue: wizardHelpers.js TDD (Story 3).
- Wed-Thu: BuyBoxWizard.jsx port (Story 4).
- Fri: Integration and Playwright smoke tests (Stories 5-6).

**Week 3:**
- Mon: Code review (code-reviewer agent).
- Tue: Final QA and sign-off.
- Wed: Release (push main, Netlify auto-deploys).

## Communication Plan

- Handoff document link: ~/Downloads/agent-buy-box-extracted/design_handoff_buy_box_configurator/nightdrop/
- Questions about handoff design: refer to Brady (designer).
- Backend blockers: escalate to scoutgpt-api on-call engineer.
- Test coverage questions: code-reviewer agent post-implementation.
