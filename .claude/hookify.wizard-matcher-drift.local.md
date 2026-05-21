---
name: wizard-matcher-drift
enabled: true
event: file
action: warn
pattern: "(buyBoxTaxonomy\\.js|BuyBoxWizard\\.jsx|BuyBoxPage[0-9]+\\.jsx|nativeToPayload|toNativeForm)"
---
[Hook] Buy box wizard or taxonomy file edited: $FILE_PATH

The dashboard's `buyBoxTaxonomy.js` and `BuyBoxWizard.jsx::nativeToPayload` must match the backend contract. The backend enforces a 10-class taxonomy with 35+ MVP filter fields. Drift = silent payload drops or rejected POSTs.

## The 4-file taxonomy lockstep
Any change to asset class slugs or use codes must be reflected in ALL of:
  • ~/nightdrop-dashboard/src/lib/buyBoxTaxonomy.js  (this repo)
  • ~/nightdrop-api/services/assetUseCodes.js        (single source of truth, Node)
  • ~/nightdrop-api/services/assetClassMap.js        (resolved_asset_type strings)
  • ~/nightdrop-api/agents/lib/asset_class_map.py    (Python matcher)

The three backend files MUST stay in lockstep — a drift breaks the nightly matcher. The dashboard file mirrors them.

## Current taxonomy (10 classes)
self_storage, multifamily, mobile_home_rv, residential_sfr, land,
industrial, retail, gas_station_c_store, office, special_purpose

## Geography mutex (backend matcher logic)
matchProperties (now in `~/nightdrop-api/agents/lib/property_matcher.py` +
`matcher_clauses.py`) checks geo modes in priority order:
  county > city > zip > radius > state
Only ONE mode is active per box. Multi-mode selection in the wizard is
persisted but silently downgrades to the highest-priority non-empty mode.

## Payload contract
Every field the wizard sends must be in `PATCHABLE_FIELDS` in
`~/nightdrop-api/routes/dealfeed/buyboxes.js`. Unknown fields are rejected
with HTTP 400. Onboarding endpoint (`POST /api/dealfeed/onboarding`)
accepts a smaller subset — confirm coverage before adding new fields.

## Reference
See `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md` for the
field-by-field drift table.

## History
Lesson 1 (May): geo_cities, geo_zips, geo_radius_* were saved to DB for
months but never read by the matcher — zero deals for any subscriber
using those geo modes.
Lesson 2 (May 20): backend taxonomy went from 8 → 10 classes; dashboard
must catch up before next create flow works against new fields.
