HANDOFF
Date: 2026-05-20
Repo: nightdrop-dashboard
Session objective: Rebuild Buy Box Configurator wizard to match backend MVP filter contract (10-class taxonomy + 35 new filter fields). Ship to main.
Status: COMPLETE (commits pushed, Netlify auto-deploy triggered, awaiting Brady visual verification on live production + migration 049 apply)

---

## What was done

### Commit 6b51fb5 — Buy Box Wizard MVP rebuild (47 files, +4494 / -4548)

**Taxonomy & data layer**
- `src/lib/buyBoxTaxonomy.js` rewritten for the 10-class MVP set (self_storage, multifamily, mobile_home_rv, residential_sfr, land, industrial, retail, gas_station_c_store, office, special_purpose) with exact ATTOM use codes mirroring `~/nightdrop-api/services/assetUseCodes.js`. Legacy aliases (`sfr`, `hospitality`, `gas_station`, `rv_park`, `mixed_use`, `medical_office`, `hotel`) normalized for back-compat via `normalizeAssetClassSlug()`.
- NEW `src/lib/buyBoxFieldSchema.js` — per-class field visibility map. CONSTRUCTION_TYPES / FOUNDATION_TYPES / ROOF_TYPES / GARAGE_TYPES enums.
- NEW `src/lib/wizardFormState.js` — extracted EMPTY_FORM, nativeToPayload, toNativeForm from BuyBoxWizard. Payload covers all 91 PATCHABLE_FIELDS. Empty-subtypes fallback: serializes to full class codes so backend `validateAssetUseCodes()` passes while UI shows nothing checked.
- NEW `src/lib/numberFormat.js` — int / money / year / decimal formatters with thousand-separator + decimal point handling.

**Wizard pages**
- `BuyBoxPage1.jsx` — 10 asset class cards in 5×2 grid, Land sub-asset slug chips (urban_infill / suburban_fringe / agricultural_rural / path_of_growth), 7 counters wrapped with `.count.active` className for green-when-active progress feedback. `toggleAsset` no longer auto-fills subtypes; user picks 0 to 3.
- `BuyBoxPage23.jsx` — side-by-side A+B layout (Physical + Financial). Class-conditional fields (units, beds/baths min+max, lot width/depth, construction/foundation/roof/garage multi-chips, building class A/B/C with year_built defaults, price_per_unit, improvement_to_land, dev_potential). Page 3 adds tax-delinquent + active-foreclosure toggles writing into `form.signals[]` (single source of truth).
- `BuyBoxPage4.jsx` — distress signals tier-coded (red urgent / amber pressure / blue flag) via 3px left stripe `::before` pseudo-element. Stripe hides on toggle-on. Cards reordered into 2-row bands: pressure (top) → flag → urgent (bottom). Distress score min surfaced out of Advanced. Description text-align fixed (was inheriting `<button>` center default).
- `BuyBoxPage5.jsx` — 4 utility toggles, universal risk overlays (flood_exclude, wetlands_exclude, opportunity_zone tri-state, tif_district tri-state), class-specific section (road frontage, AADT heat-map slider 10K-150K with blue→yellow→red RGB lerp, corner lot, has_pool, has_elevator, pct_renter_occupied, LIHTC, REIT, foreclosure history, assemblage, in_etj, zoning_codes, future_land_use_codes).
- `BuyBoxWizard.jsx` — switched create from `POST /api/dealfeed/onboarding` to `POST /api/dealfeed/buy-boxes` (the 35 new MVP fields persist now). Added `useScrollHint()` hook: green chevron with 4px bounce auto-appears on any page that overflows, hides at bottom via ResizeObserver + scroll listener.

**Shared themed inputs**
- NEW `src/components/buyBoxInputs.jsx` — NumberField (focused-raw / blurred-formatted), RangeInputs, SingleInput. Used by Page 2, Page 5. Hidden native browser spinner arrows. Tabular figures via Inter.

**Visual treatment**
- DM Sans replaces Manrope as wizard primary (`--font-ui`). Inter introduced as `--font-secondary` for numeric/meta displays. `font-feature-settings: 'tnum','zero'` applied to all Inter-rendered numeric elements. Loaded via extended `@import` in `tokens.css`.
- Cropped Nightdrop logo icon in wizard topbar (40px width, background-position left, scaled to height via PNG asset reuse). Replaces the green N-box + "Nightdrop" wordmark.
- Wizard-wide focus pass: suppress global `:focus-visible` ring inside `.buy-box-wizard`, restore intentional halos (solid `var(--green)` on `.bb-input-shell:focus-within` and `.combo:focus-within`), 2px offset outline on chips/cards/buttons/segments.
- Counter active state: `.count.active { color: var(--green) }` with 120ms transition. Applied to 8 counters: 1 subtype, 1 sub-asset, 4 geography categories (states/counties/metros/zips), 1 distress signals, 1 right rail geo concentration.

**Consumers updated**
- `feed/FeedDealCard.jsx::normalizeAssetClass` covers all 10 classes.
- `views/BuyBoxesView.jsx::formatAsset` uses `getAssetClass()` for humanized labels.

**Cleanup (-1900 lines)**
- Deleted `src/components/BuyBoxConfigurator/` (10 files, prior prototype).
- Deleted `src/components/BuyBoxEditModal.jsx` (orphaned, zero imports).
- Deleted `src/lib/wizardHelpers.js` + `wizardHelpers.test.js` (orphaned, -77 tests).

**Docs**
- NEW `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md` (26 KB) — load-bearing reference enumerating taxonomy drift, endpoint contract, validators, 3-state booleans, 12 open questions answered with locked defaults. Copy at `~/Downloads/`.
- Banner 11 stale docs (BUY-BOX-AUDIT.md root + 7 notes/audit + 3 BMAD PRDs) pointing to the new audit.
- `notes/REFERENCE.md` rewritten — fixed Page count (7 not 6), marked dead files, added missing endpoints (POST create, DELETE, pause/resume, geo, owner-portfolio).
- `CLAUDE.md` updated — KEY FILES dead-code notes, KNOWN LANDMINES, BACKEND CONTRACT with 10-class taxonomy + 4-file lockstep, BMAD historical/active split.
- 2 hookify rules fixed — scoutgpt-app → nightdrop-api in `uuid-and-backend-target`, 4-file taxonomy lockstep replaces old wizardHelpers/run_deal_feed pattern in `wizard-matcher-drift`.

### Follow-up commits
- Codemaps generated in `docs/CODEMAPS/` (5 files, ~3,450 tokens) + `.reports/codemap-diff.txt`.
- This HANDOFF.md update.

---

## What was NOT done

- **Migration 049 not applied to live DB.** Brady's task: `psql $DATABASE_WRITE_URL -f ~/nightdrop-api/migrations/049_df_buy_boxes_mvp_filters.sql`. Until applied, POST/PATCH with new MVP fields returns 500 "column does not exist."
- **End-to-end buy box save + reload round-trip not verified against live backend.** Wizard UI walked visually in dev (port 5174); no real create + edit cycle exercised.
- **No Playwright E2E for new wizard.** Existing `tests/smoke.spec.js` predates the rebuild.
- **No browser screenshot pass at multiple viewports.** Brady walked at his preferred resolution only.
- **UX inconsistency by design:** user picks 0 subtype chips → backend stores all class codes → reload displays all checked. Documented in audit; acceptable for MVP. Backend would need to accept empty array + interpret as "all codes" to fix properly.
- **Legacy focus rules unaligned.** `.chip-input:focus-within` (Page 1 ZIP codes) and `.review-name-input:focus` (Page 7) keep old `box-shadow: var(--ring)` instead of the new solid-green halo. Slight inconsistency.
- **Page 5 raw inputs** (zoning_codes, future_land_use_codes) get a 2px outline fallback instead of the `.bb-input-shell` halo treatment. Should be refactored.
- **Three-state boolean serialization** (null/true/false for has_pool, has_elevator, opportunity_zone, tif_district, in_etj, ss_is_reit_owned, ss_has_foreclosure_history, mf_lihtc_flag) never tested with real PATCH.

---

## Next session

Apply migration 049, walk wizard end-to-end on https://nightdropai.netlify.app, create a real buy box covering at least one class-specific field per class, save, reload, verify round-trip. If any field fails to persist or reload, debug in this order: (a) three-state boolean null serialization, (b) building_classes[] array shape, (c) sub_assets[] for non-Land classes, (d) verify migration 049 columns exist (`\d df_buy_boxes` in psql).

Start command: `cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions`

---

## Blockers for Brady

1. **Apply migration 049** — `psql $DATABASE_WRITE_URL -f ~/nightdrop-api/migrations/049_df_buy_boxes_mvp_filters.sql`. Until done, the new MVP filter fields can't persist and POST/PATCH will return 500.
2. **Verify Netlify production deploy** at https://nightdropai.netlify.app shows commit `6b51fb5`. If still showing prior commit `a74427f`, check the Netlify build log.
3. **No other manual steps required.** Frontend is shipped, backend is unblocked once migration runs.

---

## Reference docs

- Cross-repo audit (load-bearing): `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`
- Backend taxonomy spec: `~/nightdrop-api/docs/taxonomy/mvp-buy-box-taxonomy.md`
- Backend HANDOFF: `~/parcyl/notes/HANDOFF-nightdrop-api.md`
- Codemaps: `docs/CODEMAPS/{architecture,backend,frontend,data,dependencies}.md`
- Session detail (this conversation): `~/.claude/session-data/2026-05-20-bb-mvp-rebuild-session.tmp`
