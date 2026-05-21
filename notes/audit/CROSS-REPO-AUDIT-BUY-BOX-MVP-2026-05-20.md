# Cross-Repo Audit — Buy Box Configurator MVP

**Date of audit:** 2026-05-20
**Auditor:** Claude (Opus 4.7)
**Repos audited:** `~/nightdrop-dashboard`, `~/nightdrop-api`
**Also read:** `~/.claude/CLAUDE.md`, `~/parcyl/notes/HANDOFF-*.md`, all dashboard `notes/`, all API `docs/`, all migrations.
**Status:** Read-only audit. No code modified.
**Trigger:** Brady asked for full read across both repos before rebuilding the buy box configurator. The user-supplied spec (10 classes, 35+ filters, no-scroll per step, preserve wizard shell) needs to be reconciled against current code and the just-shipped backend MVP.

---

## A. The headline

**The backend (nightdrop-api) shipped a 10-class taxonomy + 35-field MVP filter system on 2026-05-20 (the day this audit was run).** The dashboard is still on the 8-class taxonomy and the 13-field v1 filter set from 2026-05-11. **The two repos are not in sync.**

Three other forces complicate that gap:

1. The backend's wizard create endpoint (`POST /api/dealfeed/onboarding`) was **deliberately not touched** in the MVP rebuild. Only `POST /api/dealfeed/buy-boxes` and `PATCH /api/dealfeed/buy-boxes/:id` accept the 35 new fields. The current wizard hits onboarding — so even if all 35 fields are wired into `nativeToPayload`, they will be silently dropped on create.
2. **Migration 049 is written but not applied** to the live DB. Brady must run `psql $DATABASE_WRITE_URL -f migrations/049_df_buy_boxes_mvp_filters.sql` before any of the 35 fields can be persisted.
3. **Multiple BMAD folders** (`buy-box-wizard`, `buy-box-wizard-v2`, `buy-box-command-center`) overlap and are stale relative to the 10-class rebuild.

---

## B. Source-by-source freshness map

### Backend (`~/nightdrop-api`) — CURRENT

| Artifact | Date | Status | Notes |
|---|---|---|---|
| `CLAUDE.md` | 2026-05-20 | **Current** | Up to migration 049, Python matcher, 10-class taxonomy. |
| `docs/taxonomy/mvp-buy-box-taxonomy.md` | 2026-05-20 | **Current, authoritative** | THE 10-class spec. Use this. |
| `docs/taxonomy/buy-box-taxonomy-spec.md` | older | **Deprecated** | Marked deprecated in header. 8-class. Do not use. |
| `docs/taxonomy/full-property-taxonomy.md` | 2026-05-20 | **Current** | Every ATTOM code, locked. |
| `docs/taxonomy/property-use-codes-ground-truth.md` | 2026-05-20 | **Current** | DB audit confirming which `resolved_asset_type` strings actually exist in the live properties table. |
| `services/assetUseCodes.js` | 2026-05-20 | **Current** | 10-class + `ATTOM_CODE_TO_RESOLVED_TYPE` + validators. Single source of truth for Node. |
| `services/assetClassMap.js` | 2026-05-20 | **Current** | `resolved_asset_type` strings per class. |
| `agents/lib/asset_class_map.py` | 2026-05-20 | **Current** | Python mirror — must stay in lockstep with the two JS files. |
| `agents/lib/property_matcher.py` (238 lines) | 2026-05-20 | **Current** | Orchestrator. Replaces `scripts/run_deal_feed.js` for matching. |
| `agents/lib/matcher_clauses.py` (522 lines) | 2026-05-20 | **Current** | All WHERE-clause builders. Per API CLAUDE.md: "Most dangerous file in the system." |
| `migrations/048_df_buy_boxes_phys_filters.sql` | 2026-05-19 | Applied (per CLAUDE.md migration list) | `bedrooms_count_min`, `bath_count_min`, `distress_score_min`. |
| `migrations/049_df_buy_boxes_mvp_filters.sql` | 2026-05-20 | **NOT APPLIED on live DB** | 35 new columns + 3 GIST indices. Brady must apply: `psql $DATABASE_WRITE_URL -f migrations/049_df_buy_boxes_mvp_filters.sql`. |
| `routes/dealfeed/buyboxes.js` | 2026-05-20 | **Current** | POST/PATCH/preview accept all 35 new fields + validate. |
| `routes/dealfeed/onboarding.js` | 2026-05-13 (last major edit) | **STALE re: MVP fields** | Persists ~50 fields. Missing every column added in migration 049. |
| `scripts/run_deal_feed.js` (Node matcher) | older | **Legacy / unwired** | Kept for reference only. Does NOT enforce migration 049 filters. |
| `workers/dealFeedScheduler.js` | — | Gated off | `ENABLE_DEAL_FEED_SCHEDULER` default false. Scheduling moved to Mac Mini LaunchAgent. |
| `agents/com.nightdrop.deal_engine.plist` | 2026-05-20 | **Current** | Canonical nightly trigger — fires `python3 agents/deal_engine.py`. |
| `ARCHITECTURE_AUDIT.md` (52 KB) | 2026-05-13 | Partially stale | Pre-10-class. Useful for routes/agents map; do not trust taxonomy/matcher sections. |
| `DATABASE.md` (45 KB) | 2026-05-13 | Partially stale | Bug 1 and Bug 2 (foreclosure + tax join) marked FIXED. Other content needs spot-check. |
| `PROPERTY_DATA_AUDIT.md` (39 KB) | 2026-05-14 | Likely current | Property data quality, null rates. |

### Dashboard (`~/nightdrop-dashboard`) — STALE on taxonomy + payload

| Artifact | Date | Status | Notes |
|---|---|---|---|
| `CLAUDE.md` | current | Mostly current | Identifies BMAD folders, dangerous files, landmines. Does not mention 10-class taxonomy. Hookify rule `uuid-and-backend-target.local.md` may still reference `scoutgpt-app` per CLAUDE.md note. |
| `src/lib/buyBoxTaxonomy.js` (222 lines) | older | **STALE** | 8 classes: `sfr`, `multifamily`, `retail`, `office`, `industrial`, `land`, `hospitality`, `special_purpose`. Hospitality is now deprecated server-side. Self Storage is buried as an industrial subtype. Mobile/Manufactured is in both multifamily and SFR. No `mobile_home_rv`. No `gas_station_c_store`. |
| `src/components/BuyBoxWizard.jsx` (391 lines) | 2026-05-19 | **STALE on payload** | `nativeToPayload` emits ~30 fields. Migration 049 adds 35 more. `ASSET_CLASS_TITLES` still has 8 entries. |
| `src/components/BuyBoxPage1.jsx` (494 lines) | 2026-05-19 | **STALE on classes** | `DISPLAY_CLASSES`/`ASSET_DISPLAY` hardcodes 8 classes with mock tracked counts. `SUBTYPE_ICONS` map covers old code list. |
| `src/components/BuyBoxPage23.jsx`, `BuyBoxPage4.jsx`, `BuyBoxPage5.jsx`, `BuyBoxPage6.jsx`, `BuyBoxPage7.jsx` | 2026-05-19 | **STALE on classes/fields** | All assume the 8-class set. Page 5 ("Location rules") shows only flood + underimproved land — does not surface the 8 new location/risk fields from migration 049. |
| `src/components/BuyBoxRightRail.jsx` (147 lines) | 2026-05-19 | Functional | Stat trio derived from form state. Will need new chip mappings after schema expansion. |
| `src/lib/wizardHelpers.js` + `.test.js` | older | **Orphaned + diverged** | Zero imports anywhere. Has 34-field payload that drifts from the live `nativeToPayload`. The 197-test suite includes this file's tests. |
| `src/components/BuyBoxConfigurator/` (10 files) | older | **Orphaned** | Zero imports. Prior wizard prototype. Safe to delete. |
| `src/components/BuyBoxEditModal.jsx` | older | **Orphaned** | Zero imports. Uses wizardHelpers. |
| `BUY-BOX-AUDIT.md` (286 lines, repo root, untracked) | 2026-05-16 | **STALE** | Predates the 10-class rebuild. Claims "Buy box matching is not implemented" — wrong as of 2026-05-20. Recommends a `criteria JSONB` column — that path was NOT taken (backend used dedicated columns instead). Useful for: wizard pattern history, BuyBoxRightRail mechanics, structural references (DealDetail.jsx). |
| `notes/audit/MASTER-AUDIT-BUY-BOX-2026-05-11.md` | 2026-05-11 | **Mostly stale** | Lists 17 issues; many fixed since (`showToast` undefined → fixed via context refactor; edit-arg bug → fixed; refetch missing → fixed). Useful as a regression checklist. |
| `notes/audit/audit-wizard-flow.md` | 2026-05-11 | **STALE** | Documents 8-class wizard. Says "sub-asset selector not implemented" — now IS implemented in `BuyBoxPage1.jsx` subtype chips. |
| `notes/audit/audit-api-contract.md` | 2026-05-11 | **STALE on backend** | Predates onboarding.js v2 changes and the entire 049 column set. The wizardHelpers vs nativeToPayload split observation remains accurate. |
| `notes/audit/audit-app-wiring.md` | 2026-05-11 | Partially current | App wiring largely accurate; component locations may have drifted. |
| `notes/audit/audit-kanban-management.md` | 2026-05-11 | Partially current | Buy-boxes page UI shipped per `buy-box-command-center` PRD. |
| `notes/audit/INTROSPECTION-ROOT-CAUSE-2026-05-11.md` | 2026-05-11 | Historical | Root causes for May 11 audit issues — most fixed since. |
| `notes/audit/buy-box-configurator-spec.md` | 2026-05-11 | **Stale** | 8-class oriented. |
| `notes/REFERENCE.md` | unknown | Untouched, untracked | Mentioned by project CLAUDE.md as "full component and endpoint reference." Status unknown — needs cross-check against current code. |
| `notes/HANDOFF.md` | 2026-05-19 | **Current** | Buy Box "Tune" button → menu refactor; both commits shipped. Does not mention the 10-class rebuild — Brady disconnected from API session before that landed. |
| `notes/bmad/buy-box-wizard/` (PRD, arch, stories, requirements, LOOP_STATE) | 2026-05-03 | **Historical** | Initial wizard buildout. Story 1 (migration 029) shipped. Story 2–10 covered the 8-class wizard. |
| `notes/bmad/buy-box-wizard-v2/PRD.md` + stories | 2026-05-11 | **Historical (shipped)** | The 7-step wizard rebuild + 13 new fields. PRD success criteria largely met for v1 scope. References `scoutgpt-api` — predates the nightdrop-api split. |
| `notes/bmad/buy-box-command-center/PRD.md` | 2026-05-10 | **Historical (shipped)** | Buy Boxes page conversion to command center. Shipped earlier in May. |
| `notes/bmad/b-plus-roadmap/` | — | Status unread | Roadmap doc. |
| `notes/bmad/dashboard-redesign-v2/` | — | Status unread | Probably the current dashboard layout. |
| `notes/bmad/nightdrop-rebrand/` | — | Status unread | Brand work. |
| `notes/bmad/snowflake-sync/` | — | Status unread | Data pipeline. |
| `notes/bmad/subscriber-invite/` | — | Status unread | Invite flow. |

### Global (`~/.claude`) — CURRENT
- `~/.claude/CLAUDE.md`: BMAD workflow, debugging protocol, commit conventions. No buy-box-specific content. Current.
- `~/.claude/rules/web/*`: web coding style, hooks, testing, design quality. Applies to this rebuild.

### parcyl HANDOFFs (`~/parcyl/notes/HANDOFF-*.md`) — MIXED
- `HANDOFF-nightdrop-api.md` (2026-05-20): **Current**. Documents the MVP filter rebuild end-to-end. Action items including "Apply migration 049" DEFERRED to Brady.
- `HANDOFF-nightdrop-dashboard.md`: per global rule this should be the canonical dashboard handoff. **NOT WRITTEN YET** — the project-local `notes/HANDOFF.md` was used instead. Drift between global rule and project rule.
- 25 other HANDOFFs exist for parcyl, scoutgpt-api, cortex, local-ai-os, nightdrop-landing, nightdrop-web, B1–B4, F1–F4, MUNI1–2, SPRINT2, FRONTEND_CARDS. Mostly historical context for sibling repos, not load-bearing for this work.

---

## C. The actual API contract (what to build against)

### Asset class taxonomy (the 10, exact strings)
From `services/assetUseCodes.js::ASSET_CLASS_LABELS`:

```
self_storage, multifamily, mobile_home_rv, residential_sfr, land,
industrial, retail, gas_station_c_store, office, special_purpose
```

### Use codes per class (integers, validated server-side)
- `self_storage`: [229]
- `multifamily`: [366, 383, 386, 369, 378, 375]
- `mobile_home_rv`: [373]
- `residential_sfr`: [385, 401, 360, 380, 388, 381]
- `land`: [389, 120, 392, 117, 105, 109, 118]
- `industrial`: [238, 212, 220, 222, 210, 231, 280, 184]
- `retail`: [135, 393, 126, 361, 148, 124, 169, 146, 171, 172, 127, 186]
- `gas_station_c_store`: [167, 124]
- `office`: [178, 160, 139, 193, 194, 183]
- `special_purpose`: [150, 339, 151, 348, 133, 155, 296, 175, 264, 359]

### Land sub-asset slugs (4 only)
`urban_infill`, `suburban_fringe`, `agricultural_rural`, `path_of_growth`.

`path_of_growth` triggers the Land Transitional rule via three configurable per-buy-box columns: `land_trans_dev_potential_min` (default 40), `land_trans_impr_land_max` (default 0.25), `land_trans_flu_codes` (default `['Commercial','Residential']`).

### Building class (multi-select)
`building_classes TEXT[]` — subset of `{'A','B','C'}`. Matcher OR's the year_built clauses: A → `>=2010`, B → `1985..2009`, C → `<=1984`. Year_built min/max can be ANDed manually on top.

### Three-state booleans (TRUE / FALSE / NULL)
`has_pool, has_elevator, opportunity_zone, tif_district, in_etj, ss_is_reit_owned, ss_has_foreclosure_history, mf_lihtc_flag`. The UI must support `null` ("no filter") as a real third state.

### Two-state booleans (TRUE-only filters)
`wetlands_exclude, water_service_required, sewer_service_required, electricity_nearby_required, gas_pipeline_nearby_required, corner_lot_required, absentee_only, out_of_state_only, distress_only, flood_exclude, assemblage_potential`. NULL or false means "no filter."

### Every patchable field
From `routes/dealfeed/buyboxes.js::PATCHABLE_FIELDS` (91 entries). Buckets:
- Identity: `label`, `notes`
- Asset: `asset_classes`, `sub_assets`, `prop_classes`, `asset_class`, `asset_use_codes`, `asset_class_version`
- Geography: `geo_states`, `geo_cities`, `geo_zips`, `geo_counties`, `geo_radius_miles`, `geo_radius_address`, `geo_radius_lat`, `geo_radius_lng`
- Size + vintage: `sf_min/max`, `acres_min/max`, `lot_sf_min/max`, `lot_width_min`, `lot_depth_min`, `year_built_min/max`, `stories_min/max`, `units_min/max`, `bedrooms_count_min/max`, `bath_count_min/max`
- Physical: `construction_types`, `foundation_types`, `roof_types`, `garage_types`, `has_pool`, `has_elevator`, `improvement_to_land_max`, `development_potential_min`, `price_per_unit_max`, `building_classes`
- Hold + ownership: `hold_period_min/max`, `min_hold_yrs`, `absentee_only`, `out_of_state_only`, `owner_types`
- Value + financial: `value_min/max`, `min_equity_pct`, `min_equity_dollar`, `ltv_max`, `assessed_below_market`
- Distress: `distress_only`, `distress_signals`, `distress_match_mode`, `distress_score_min`
- Location: `flood_exclude`, `opportunity_zone`, `wetlands_exclude`, `tif_district`, `in_etj`, `zoning_codes`, `future_land_use_codes`
- Utilities: `water_service_required`, `sewer_service_required`, `electricity_nearby_required`, `gas_pipeline_nearby_required`, `utility_proximity_max_ft`
- Traffic / frontage: `aadt_min`, `road_frontage_min_ft`, `road_frontage_max_ft`, `corner_lot_required`
- Self storage: `ss_is_reit_owned`, `ss_has_foreclosure_history`
- Multifamily: `pct_renter_occupied_min`, `mf_lihtc_flag`, `mf_lihtc_proximity_ft`
- Land transitional: `land_trans_dev_potential_min`, `land_trans_impr_land_max`, `land_trans_flu_codes`
- Assemblage: `assemblage_potential`
- Climate: `climate_risk_max`, `wildfire_risk_max`, `heat_risk_max`
- Delivery: `run_schedule`, `delivery_max_per_run`, `match_threshold`
- Misc / legacy: `criteria`

### Numeric validators (server-side)
Server enforces ranges. Highlights:
- `year_built_min/max`: integer 1800..2100
- `min_equity_pct`: 0..100
- `ltv_max`: 0..200
- `distress_score_min`: integer 0..100
- `development_potential_min`: integer 0..100
- `match_threshold`: 0..1 (decimal)
- `pct_renter_occupied_min`: 0..100
- `land_trans_dev_potential_min`: integer 0..100

---

## D. Drift findings (dashboard ↔ backend)

| # | Drift | Severity | Where to fix |
|---|---|---|---|
| 1 | Dashboard taxonomy = 8 classes; backend = 10 | CRITICAL | `src/lib/buyBoxTaxonomy.js` |
| 2 | Hospitality still in dashboard; deprecated server-side (code 131 → 'hotel' back-compat only). `validateAssetClass` rejects new POSTs with `hospitality`. | CRITICAL | Remove from taxonomy + UI |
| 3 | Asset class IDs: dashboard uses `sfr`, backend uses `residential_sfr`. PATCH will reject. | CRITICAL | Rename in taxonomy + every consumer (FeedDealCard.normalizeAssetClass, DashboardView filter, AdminView, BuyBoxesView) |
| 4 | Self Storage is a subtype of `industrial` (code 229) on dashboard; backend promotes it to its own class | CRITICAL | Move out of industrial subtypes; create `self_storage` class with single subtype |
| 5 | Mobile/Manufactured Home is in multifamily AND sfr subtype lists on dashboard; backend gives it its own class `mobile_home_rv` (code 373) | CRITICAL | Remove code 373 from MF and SFR; create `mobile_home_rv` class |
| 6 | Gas station (code 167) is in `special_purpose` subtypes on dashboard; backend promotes to its own class `gas_station_c_store` with codes [167, 124] | CRITICAL | New class, remove from special_purpose |
| 7 | Wizard create posts to `/api/dealfeed/onboarding`, which only INSERTs ~50 columns — every column added in migration 049 is silently dropped on first save | CRITICAL | Either (a) switch wizard to `POST /api/dealfeed/buy-boxes` (preferred — already accepts all 35), or (b) extend onboarding.js's INSERT to include the 35 new columns. **Backend HANDOFF explicitly says onboarding.js was "not touched per scope."** Direction required. |
| 8 | Wizard's NATIVE_FORM has no fields for: `lot_sf`, `lot_width/depth`, `building_classes`, `construction/foundation/roof/garage_types`, `has_pool`, `has_elevator`, `opportunity_zone`, `wetlands_exclude`, `tif_district`, `in_etj`, `future_land_use_codes`, `water/sewer/electricity/gas_*_required`, `utility_proximity_max_ft`, `aadt_min`, `road_frontage_min/max_ft`, `corner_lot_required`, `ss_is_reit_owned`, `ss_has_foreclosure_history`, `pct_renter_occupied_min`, `mf_lihtc_flag`, `mf_lihtc_proximity_ft`, `land_trans_*`, `assemblage_potential`, `price_per_unit_max`, `improvement_to_land_max`, `development_potential_min`, `min_equity_dollar`, `ltv_max` | HIGH | Expand `NATIVE_FORM` + `nativeToPayload` + `toNativeForm` |
| 9 | Wizard's `subtypes[]` is an array of integers (use codes); backend expects integers (matches). But subtype taxonomy on dashboard is wrong — code 229 is in industrial subtypes, not self_storage. After taxonomy rewrite, the codes will serialize correctly. | MED | After fix 1, this resolves itself |
| 10 | `formatUseCodes()` in dashboard's `buyBoxTaxonomy.js` references the old 8-class subtypes — used by `BuyBoxesView.jsx`, `AdminView.jsx`, possibly elsewhere | MED | Update after taxonomy rewrite |
| 11 | Dashboard `BuyBoxRightRail.jsx` stat trio is hardcoded to `equity / hold / occupancy`. After MVP filter expansion, no rail change is required by user's spec, but the rail should still reflect new filter chips via `buildFilters()`. | LOW | Update `buildFilters` after schema expansion |
| 12 | Risk fields (climate, wildfire, heat): dashboard stores 1–10, sends ×10 to backend. Backend stores 0–100. UI for wildfire/heat is hidden ("expandable" but never wired) — only flood is visible. The MVP user spec drops climate/wildfire/heat entirely. | LOW | OK to leave; or remove from form for clarity |
| 13 | Dashboard's `STATE_COUNTS` exposes 51 states + DC with property counts that are mostly fake (Parcyl DB only covers 5 Central TX counties: Travis, Bastrop, Hays, Williamson, Caldwell). | MED — user-trust | UI should constrain or label clearly that coverage is Central TX MVP |
| 14 | Hookify rule `uuid-and-backend-target.local.md` per CLAUDE.md may still mention `scoutgpt-app` | LOW | Update rule |
| 15 | Dashboard's HANDOFF location ambiguity — global rule says `~/parcyl/notes/HANDOFF-{repo}.md`; project CLAUDE.md says `notes/HANDOFF.md` (local). | LOW | Decide which |
| 16 | Three-state booleans: dashboard `Toggle` component is two-state. For 8 fields the backend treats `null` as "no filter" and explicitly distinguishes from `false` ("must NOT have"). Dashboard can't express "no filter" today on these. | HIGH | Need a tri-state UI control (e.g. 3-button chip: Any / Yes / No) |
| 17 | Owner type: dashboard uses single string `'individual'/'llc'/'trust'` mapped to single-element array on send. Backend column is `owner_types TEXT[]` and matcher uses array semantics. Currently works due to ENTITY_MAP, but doesn't allow multi-select. | LOW |  |
| 18 | "Tax delinquent" and "Active foreclosure" as standalone toggles (user spec) are not in the schema as dedicated columns; they're entries in `distress_signals TEXT[]` (`'tax-delinquent'`, `'active-foreclosure'`). | DESIGN | Either render them as their own toggles that secretly write into `distress_signals[]`, or surface them only inside the distress signal cards. Spec implies dedicated toggles — possible but requires plumbing. |
| 19 | "Pad" count for Mobile Home / RV: no `pads_min/max` column. Backend's `units_min/max` is the only count field. User spec asks for "pad and unit count" — likely both map to `units_min/max`, or this needs a new migration. | OPEN | Confirm with backend |
| 20 | Land sub-asset slug "Timberland": user spec lists it as a Land subtype. Backend `LAND_SUB_ASSET_SLUGS` has only 4 (urban_infill, suburban_fringe, agricultural_rural, path_of_growth). Timberland (code 118) currently rolls into `agricultural_rural`. User wants it as its own selection — either rename a slug or expand the list. | OPEN | Confirm with backend |

---

## E. What I do NOT know and need to confirm

1. **Onboarding vs. buy-boxes create path** — should the wizard switch to `POST /api/dealfeed/buy-boxes`, or should onboarding.js be expanded? Backend session deferred this.
2. **Has migration 049 been applied to live DB?** Backend HANDOFF lists it as DEFERRED to Brady. Until applied, sending any of the 35 new fields = `column does not exist` 500 error.
3. **Mobile Home pads** — separate field or alias of `units_min/max`?
4. **Timberland subtype** — separate slug or rolled into `agricultural_rural`?
5. **"Strip Mall / Shopping Center" vs "Neighborhood Shopping Center"** — user spec lists both as Retail subtypes; backend has both (codes 393 + 126). User also separately lists "Community Retail" which is code 361. Already aligned.
6. **`tax_delinquent` / `active_foreclosure` standalone toggles** — keep them inside the distress signal grid, or surface them as separate top-level toggles in Step 3?
7. **Match threshold default** — backend allows 0..1 (NUMERIC). UI today offers 0.70 / 0.80 / 0.90 chips. Stick with three chips for MVP?
8. **HANDOFF location** — global rule vs project rule.
9. **Hookify rule** — need to update `uuid-and-backend-target.local.md` to remove scoutgpt-app references?
10. **`notes/REFERENCE.md`** — referenced by project CLAUDE.md but unread. Is it canonical or also stale?
11. **5-county coverage UI honesty** — should we restrict the state picker to TX-only for MVP, or keep the 51-state UI?
12. **Three-state boolean UI control** — does Brady want a tri-toggle (Any / Yes / No), or are most of these acceptable as two-state for MVP (knowing some filter expressiveness is lost)?

---

## F. What's missing from documentation entirely

- **No frontend integration spec** for migration 049 — no PRD/architecture for "how the wizard exposes the 35 new fields." This task is the spec.
- **No mapping table** from "user spec field" → "backend column" → "wizard form key" in any committed doc. I had to derive it cross-repo.
- **`notes/REFERENCE.md`** content unread — may exist but unverified.
- **No e2e/Playwright suite** for new MVP filters. `tests/smoke.spec.js` is the only Playwright file and it's old.
- **No migration verification script** that proves migration 049 is applied (no `npm run check-migrations` or similar).
- **No screenshot/mockup** of what the rebuilt step layouts should look like at 1920×1080 to validate the no-scroll constraint before coding.

---

## G. What I am confident in

- **Backend contract**: every field, validator, taxonomy slug, use code, three-state semantic. Documented and current.
- **Dashboard active code paths**: `BuyBoxWizard.jsx` → `BuyBoxPage1-7` → `nativeToPayload` → `POST /onboarding` (create) or `PATCH /buy-boxes/:id` (edit).
- **Dashboard dead code**: `BuyBoxConfigurator/` (10 files), `BuyBoxEditModal.jsx`, `wizardHelpers.js`, `wizardHelpers.test.js` — zero imports, safe to delete.
- **Dead-code removal cost**: ~1900 lines reduction.
- **Test surface**: 197 tests pass. If `wizardHelpers.test.js` gets deleted, expect ~30–40 tests removed.

---

## H. Recommended next steps (no code yet)

1. **Answer the 12 open questions in §E.**
2. Write a "Field Matrix" doc — single table mapping every user-spec field to (backend column, validator, default, form key, UI control type). One source of truth for the rebuild.
3. Write a single new BMAD folder `buy-box-mvp-rebuild/` with PRD, architecture, stories — and mark `buy-box-wizard`, `buy-box-wizard-v2`, `buy-box-command-center` folders as historical in their `LOOP_STATE` / a README.
4. Migration 049 gets applied (Brady's blocker, not the dashboard's).
5. Then start coding.

---

## I. Quick reference — file pointers for next session

**Authoritative backend specs:**
- `~/nightdrop-api/docs/taxonomy/mvp-buy-box-taxonomy.md`
- `~/nightdrop-api/services/assetUseCodes.js`
- `~/nightdrop-api/services/assetClassMap.js`
- `~/nightdrop-api/migrations/049_df_buy_boxes_mvp_filters.sql`
- `~/nightdrop-api/routes/dealfeed/buyboxes.js`
- `~/nightdrop-api/CLAUDE.md`

**Live frontend code (to be modified):**
- `~/nightdrop-dashboard/src/lib/buyBoxTaxonomy.js`
- `~/nightdrop-dashboard/src/components/BuyBoxWizard.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage1.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage23.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage4.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage5.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage6.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxPage7.jsx`
- `~/nightdrop-dashboard/src/components/BuyBoxRightRail.jsx`
- `~/nightdrop-dashboard/src/styles/buy-box-wizard.css`
- `~/nightdrop-dashboard/src/styles/buy-box-wizard-pages.css`

**Dead code to delete:**
- `~/nightdrop-dashboard/src/components/BuyBoxConfigurator/` (entire directory, 10 files)
- `~/nightdrop-dashboard/src/components/BuyBoxEditModal.jsx`
- `~/nightdrop-dashboard/src/lib/wizardHelpers.js`
- `~/nightdrop-dashboard/src/lib/wizardHelpers.test.js`

**Cross-repo lockstep rule (DO NOT BREAK):**
The 10-class taxonomy must stay identical across these three files. Any drift breaks the nightly matcher:
- `~/nightdrop-api/services/assetUseCodes.js`
- `~/nightdrop-api/services/assetClassMap.js`
- `~/nightdrop-api/agents/lib/asset_class_map.py`

The dashboard's `~/nightdrop-dashboard/src/lib/buyBoxTaxonomy.js` should mirror the asset_class strings and use codes but is a fourth file — not part of the lockstep rule, but it must match.

---

*End of audit. No files modified. Awaiting answers to §E before any code is written.*
