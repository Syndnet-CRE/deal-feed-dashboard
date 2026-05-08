# HANDOFF
Date: 2026-05-08
Repo: deal-feed-dashboard + scoutgpt-api
Session objective: Rebuild buy box creation/editing from modal to 9-step full-page wizard
Status: COMPLETE

## What was done

### deal-feed-dashboard (commit 96f798b, pushed to main)

- `src/components/BuyBoxWizard.jsx` — new 9-step full-page wizard component
  - Steps: Name, Geography, Asset Class, Sub-Asset, Criteria, Ownership, Distress, Schedule, Review
  - Create mode: POST /api/dealfeed/onboarding; Edit mode: PATCH /api/dealfeed/buy-boxes/:id
  - Fixed position (full screen), Escape to cancel, toast on save
  - Debounced coverage check on step 2 (POST /api/dealfeed/buy-boxes/preview)
  - Inline validation per step; review step shows incomplete sections

- `src/lib/buyBoxTaxonomy.js` — full ATTOM use code taxonomy
  - ASSET_CLASSES: 6 classes, 28 sub-types with integer ATTOM codes
  - GEO_TYPES, US_STATES (51), MAJOR_METROS (47)
  - SCHEDULE_DAYS, DISTRESS_SIGNAL_OPTIONS, OWNER_TYPE_OPTIONS
  - Helpers: formatGeo(), formatUseCodes(), formatSchedule(), getAssetClass()

- `src/styles/buy-box-wizard.css` — full CSS for the stepped layout using .bbwiz-* classes

- `src/lib/wizardHelpers.js` — updated canProceedStep() for 9 steps; buildPayload() adds asset_class, asset_use_codes, run_schedule; canProceed alias kept for backward compat

- `src/lib/wizardHelpers.test.js` — 178 tests, all passing

- `src/App.jsx` — BuyBoxWizard replaces ConfigurationOverlay; /onboarding route (via useMatch) launches wizard in create mode for new subscribers post-signup

- `src/views/BuyBoxesView.jsx` — fixed to use correct API field names: label (not name), last_run_at, deals_sent_total; shows asset_class, sub-types, schedule per card

- `src/views/InviteClaimView.jsx` — redirects to /onboarding after account activation (was /)

### scoutgpt-api (commit ed23e12, pushed to main)

- `migrations/042_buybox_asset_class_schedule.sql` — adds asset_class TEXT, asset_use_codes INTEGER[], run_schedule JSONB to df_buy_boxes; check constraint on 6 valid class values; default schedule all 7 days; index on asset_class

- `services/assetUseCodes.js` — shared validation module: ASSET_CLASS_LABELS, ASSET_USE_CODE_MAP, ATTOM_CODE_TO_RESOLVED_TYPE (28 codes), validateAssetClass(), validateAssetUseCodes(), validateRunSchedule(), resolvedTypesForUseCodes()

- `routes/dealfeed/onboarding.js` — accepts and validates asset_class, asset_use_codes (required), run_schedule; INSERT expanded to 34 params

- `routes/dealfeed/buyboxes.js` — GET SELECT includes new columns; PATCH validates all 3 fields; use codes normalized to integers

- `scripts/run_deal_feed.js` — isScheduledToday() filter applied before processing; matchProperties() uses resolvedTypesForUseCodes() for precise ATTOM code matching

## What was NOT done

- ConfigurationOverlay.jsx — still present as dead code (not imported); safe to delete in a future cleanup session
- buyBoxTaxonomy.test.js — no unit tests for the taxonomy helpers yet
- E2E tests for the full wizard flow (smoke tests updated screenshot hashes only)
- Migration 042 not yet applied to the production Render/Neon database — Brady must apply it before the new wizard can save successfully

## Next session

If Brady wants to clean up dead code:
  cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
  — delete src/components/ConfigurationOverlay.jsx, src/components/NewBoxWizard.jsx, src/components/PropertyDetail.jsx, src/components/tabs/

## Blockers for Brady

1. Apply migration 042 to the Render/Neon production database before any user can create a buy box with the new wizard. The wizard will fail on save until these 3 columns exist in df_buy_boxes.
   Command (run on Render or via psql): psql $DATABASE_URL -f migrations/042_buybox_asset_class_schedule.sql

2. ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env needs valid key with credits (blocks stress test from prior session)

3. Confirm the Netlify deploy for deal-feed-dashboard looks correct at dealrunner.netlify.app
