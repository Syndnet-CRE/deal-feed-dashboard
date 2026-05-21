> **STALE — 2026-05-20**
>
> This document predates the backend MVP rebuild that shipped 2026-05-20 (nightdrop-api commits `c8b3291`, `cd1e935`, migration 049). The 10-class taxonomy replaced the 8-class one; 35 new filter fields were added; the Python matcher (`agents/lib/property_matcher.py` + `matcher_clauses.py`) replaced the Node matcher.
>
> Specifically wrong claims below: "buy box matching pipeline does not exist" (it does, in Python), "no asset-class-specific criteria possible without `criteria JSONB`" (backend chose dedicated columns instead).
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`
> **Backend spec:** `~/nightdrop-api/docs/taxonomy/mvp-buy-box-taxonomy.md`
>
> Kept for historical context — the right rail mechanics, wizard pattern history, and DealDetail.jsx structural references remain useful.

---

# Buy Box Configurator — Full Audit
*Date: 2026-05-16 | Read-only across nightdrop-dashboard, scoutgpt-api, nightdrop-web*

---

## Design System Constraints (Pre-flight)

All rebuild work must conform to the Parcyl brand design system (`parcyl-design/SKILL.md`):

- **Font:** Manrope only. No exceptions.
- **Primary green:** `#1DAF29` — buttons, active states, progress bar fill. The dashboard token `--green` (#5BCC48) is mid-green; use `--green-deep` / `#1DAF29` for primary CTAs.
- **App shell:** `#0D0D0D` page background, `#1E1E24` panels/cards, `#40424D` borders
- **No gradients** on solid surfaces. No decorative flourishes.

---

## Finding 1: The Configurator Is a Modal Overlay — Not a Routed Page

**Verdict: MODAL / OVERLAY. Confirmed.**

In **nightdrop-dashboard**, the buy box configurator renders as a fixed overlay on top of the dashboard. Exact mechanism:

- `src/App.jsx` lines 104–137: `WizardLayer` component conditionally renders the wizard based on `showWizard` boolean state
- `src/App.jsx` lines 281–292: `WizardLayer` is mounted at the root level of `AppShell`, always in the DOM, visible/hidden via state
- `src/components/BuyBoxWizard.jsx` lines 284–374: wizard wraps itself in `.buy-box-wizard` div with `.backdrop` overlay
- **No URL changes on open.** No `/buy-boxes/new` route exists anywhere in the router. The wizard is triggered by `setShowWizard(true)` — a state call, not a `navigate()` call.
- Escape key closes it (`App.jsx` lines 182–193). No backdrop click-to-close — intentional to prevent accidental dismissal mid-flow.

In **nightdrop-web**, the configurator is also a modal (`components/dashboard/configuration-overlay.jsx`) — same pattern.

**Neither repo has a routed buy box page. The rebuild starts from scratch on routing.**

---

## Finding 2: Every Current Buy Box Field

### Step structures differ between repos

- **Dashboard:** 6 steps (Target, Profile, Owner, Distress/Risk, Threshold, Activate)
- **Web:** 9 steps (Name, Geography, Asset Class, Sub-Asset, Criteria, Ownership, Distress, Schedule, Review)

The table below covers the unified field inventory across both forms.

| Field | Dashboard State Key | Web State Key | DB Column | Agent 2 Uses? |
|---|---|---|---|---|
| Buy box name | `form.name` | `form.name` | `label` | No |
| Asset class | `form.assets[0]` | `form.asset_class` | `asset_class` | No |
| Sub-asset codes | `form.subtypes[]` | `form.asset_use_codes[]` | `asset_use_codes` | No |
| States | `form.geo.states[]` | `form.geo_states[]` | `geo_states` | No |
| Counties | `form.geo.counties[]` | — | `geo_counties` | No |
| Cities / Metros | `form.geo.metros[]` | `form.geo_cities[]` | `geo_cities` | No |
| ZIP codes | `form.geo.zips[]` | `form.geo_zips[]` | `geo_zips` | No |
| Radius address | — | `form.geo_radius_address` | `geo_radius_address` | No |
| Radius miles | — | `form.geo_radius_miles` | `geo_radius_miles` | No |
| Radius lat/lng | — | `form.geo_radius_lat/lng` | `geo_radius_lat / geo_radius_lng` | No |
| Building SF min/max | `form.phys.sf_min/max` | `form.sf_min/max` | `sf_min / sf_max` | No |
| Lot acres min/max | `form.phys.acres_min/max` | `form.acres_min/max` | `acres_min / acres_max` | No |
| Year built min/max | `form.phys.year_min/max` | `form.year_built_min/max` | `year_built_min / year_built_max` | No |
| Stories min | `form.phys.stories_min` | — | `stories_min / stories_max` | No |
| Units min/max | `form.phys.units_min/max` | — | `units_min / units_max` | No |
| Assessed value min/max | `form.fin.price_min/max` | `form.value_min/max` | `value_min / value_max` | No |
| Min equity % | `form.fin.equity_preset` | — | `min_equity_pct` | No |
| Assessed below market | `form.fin.assessed_below_market` | — | `assessed_below_market` | No |
| Owner entity type | `form.owner.entity` | `form.owner_types[]` | `owner_types` | No |
| Absentee only | `form.owner.occupancy` | `form.absentee_only` | `absentee_only` | No |
| Out-of-state owner | `form.owner.out_of_state` | `form.out_of_state_only` | `out_of_state_only` | No |
| Min hold years | `form.owner.hold_min` | `form.min_hold_yrs` | `hold_period_min / min_hold_yrs` | No |
| Distress signals | `form.signals[]` | `form.distress_signals[]` | `distress_signals` | No |
| Distress match mode | `form.logic` | `form.distress_match_mode` | `distress_match_mode` | No |
| Climate risk max | `form.risk.climate` | — | `climate_risk_max` | No |
| Flood exclude | `form.risk.flood` | — | `flood_exclude` | No |
| Wildfire risk max | `form.risk.wildfire` | — | `wildfire_risk_max` | No |
| Heat risk max | `form.risk.heat` | — | `heat_risk_max` | No |
| Match threshold | `form.threshold` | — | `match_threshold` | No |
| Run schedule | `form.delivery.cadence` | `form.run_schedule` | `run_schedule` | No |
| Max per run | `form.delivery.max` | — | `delivery_max_per_run` | No |

**Agent 2 uses none of these fields.** See Finding 3.

---

## Finding 3: Dead Fields and Unmapped Columns

### Critical finding: Agent 2 does not match buy boxes at all

Agent 2 (`agent2-site-intelligence.js`) is a **single-property analysis agent**. It takes one `attom_id`, calls tools like `get_property_details`, `get_owner_portfolio`, and `get_zoning_analysis`, and produces an intelligence package for that one property. It does NOT read `df_buy_boxes`. It does NOT construct match queries.

**There is no buy box matching pipeline in the codebase.** The entire `df_buy_boxes` → properties match flow has not been implemented. The dashboard's preview endpoint (`POST /api/dealfeed/buy-boxes/preview`) is flagged in CLAUDE.md as a known landmine that "may not exist on backend yet — fails silently."

### Dead columns in df_buy_boxes

| Column | Status |
|---|---|
| `asset_classes` | Superseded by `asset_class` (v2) — remove |
| `sub_assets` | Never referenced in any code — remove |
| `prop_classes` | Never referenced in any code — remove |
| `hold_period_min` | Superseded by `min_hold_yrs` — consolidate and remove |
| `hold_period_max` | No current matching logic — remove |
| `notes` | Metadata only, no query relevance |
| `coverage_score` / `coverage_notes` | Historical — not used in matching |
| `deals_sent_total` | Analytics only |

### Asset class mismatch across all three surfaces

| Surface | Asset Classes Offered |
|---|---|
| Dashboard wizard | sfr, multifamily, retail, office, industrial, land, hospitality, special_purpose |
| Web wizard | multifamily, industrial, retail, office, land, special_purpose |
| DB column (`asset_class`) | Free TEXT — no enum constraint |
| **Rebuild target (spec)** | Self Storage, Multifamily, RV/Mobile Home Parks, Land, Retail, Gas Stations/C-Stores, Residential SFR/2-4 unit, Warehouse/Industrial |

None of the rebuild's 8 target asset classes appear in either form. The DB column is free TEXT so no migration is needed for the column type — taxonomy files and application validation need updating.

---

## Finding 4: Can df_buy_boxes Support Asset-Class-Specific Criteria?

**No — not in its current form.**

The schema is flat and generic. Every row has the same columns regardless of asset class. A self-storage deal and a multifamily deal share identical columns. There is no mechanism to surface "unit count and occupancy rate for self-storage" vs "ceiling height and loading docks for industrial."

### Recommended change: add a `criteria JSONB` column

```sql
ALTER TABLE df_buy_boxes ADD COLUMN criteria JSONB DEFAULT '{}';
```

Base universal columns (`geo_*`, `sf_min/max`, `year_built_*`, etc.) stay. Asset-class-specific fields go into `criteria` as a keyed object:

```json
// Self Storage
{ "unit_count_min": 50, "occupancy_rate_min": 0.80, "price_per_unit_max": 15000 }

// Multifamily
{ "avg_rent_min": 900, "pct_vacant_max": 0.15, "noi_cap_rate_min": 0.05 }

// Industrial
{ "ceiling_height_min_ft": 24, "loading_docks_min": 2 }

// Land
{ "entitlement_status": ["none", "pre-app"], "environmental_phase_required": false }

// Gas Stations / C-Stores
{ "canopy_count_min": 4, "underground_tank_age_max_yrs": 20 }
```

### Migration path

1. `ALTER TABLE df_buy_boxes ADD COLUMN criteria JSONB DEFAULT '{}'` — zero downtime, backward compatible, old records get `{}`
2. Add `asset_class_version` column to track the JSON schema version (for future migrations of the JSONB shape)
3. New UI writes asset-class-specific fields into `criteria`; universal fields go into existing columns as before
4. Backend matching agent reads `criteria` after exhausting base columns

### Missing fields per asset class (not in current schema)

**Self Storage**
- `unit_count_min/max` — more intuitive than building SF for storage
- `occupancy_rate_min/max`
- `price_per_unit_max`

**Multifamily**
- `avg_rent_min/max`
- `pct_vacant_max`
- `noi_cap_rate_min/max`

**Industrial / Warehouse**
- `ceiling_height_min_ft`
- `loading_docks_min`
- `power_capacity_amp`

**Land**
- `entitlement_status` (none, pre-app, approved)
- `environmental_phase_required` (boolean)
- `tract_subdivision_yield_min`

**Gas Stations / C-Stores**
- `canopy_count_min`
- `underground_tank_age_max_yrs`

**RV / Mobile Home Parks**
- `pad_count_min/max`
- `pct_park_owned_units_max`

---

## Finding 5: The Live Match Pool Panel

### What it is

Component: `src/components/BuyBoxRightRail.jsx`

A right-side panel inside the wizard showing real-time property match estimates as the user configures their buy box. It renders:

- A live clock (HH:MM:SS, refreshes every 1s) — visual reinforcement of "live data"
- A large animated match count number (the pool size)
- A delta indicator — count change from previous call (+N / -N) with green/red color coding
- A stat trio: min equity, hold period, occupancy
- State code badges for geographic concentration
- Active filter chips derived from current form state

### How it works

The panel is passive — it does not make API calls itself. The parent `BuyBoxWizard.jsx` debounces (400ms) a `POST /api/dealfeed/buy-boxes/preview` call on any filter change. The response `data.estimated_count` is passed to the rail via `form.matchCount` prop. The rail renders the count and calculates delta from the previous value, with a 600ms animation on change.

### Recommendation for full-page layout

**Keep it. Move it to the right content column of the full-page layout.**

In the current modal, the panel is squeezed into a narrow column. In a full-page layout at `/buy-boxes/new`, a proper 3-column layout gives it room:

- Left: nav sidebar (stays per spec, ~240px)
- Center: wizard step content (flex, fills remaining width)
- Right: live match pool panel — full-height sticky, 300–360px

Enhancements that make sense at full-page width:
- Expand the stat trio cards to include field labels, not just values
- Add a match breakdown bar per state (already partially there via state badges)
- The animated clock stays — it's a product differentiator

---

## Finding 6: Architectural Observations

### 6a. Two wizards, two repos, no shared code

Both nightdrop-dashboard and nightdrop-web have independent wizard implementations with no cross-repo imports. They share the same form shape and API contract by convention only. Taxonomy files (`buy-box-taxonomy.js`, `wizardHelpers.js`) are duplicated in both repos. The rebuild should consolidate: either a shared package, or the taxonomy lives in the API and the frontend fetches it at runtime.

### 6b. The onboarding endpoint is the create path — that's wrong

New buy boxes `POST /api/dealfeed/onboarding` — not a dedicated create endpoint. The onboarding route appears to handle subscriber creation + first buy box as a combined flow. The rebuild should normalize this:

- `POST /api/dealfeed/buy-boxes` — create
- `PATCH /api/dealfeed/buy-boxes/:id` — edit
- `DELETE /api/dealfeed/buy-boxes/:id` — delete (exists in web, not dashboard)

### 6c. The CRM buy box endpoints are dead legacy

`/api/crm/buy-boxes/*` in scoutgpt-api targets the old `buy_boxes` table (not `df_buy_boxes`). Nothing in the dashboard or web calls these endpoints. Flag for removal.

### 6d. The web's step structure is the better starting point

Dashboard 6-step structure compresses asset class + geography into step 1, forcing premature choices. Web's 9-step structure separates these properly. The rebuild's step structure is up for revision per the brief — the web's approach is closer to right. Suggested structure for the full-page rebuild:

1. **Asset Class** — select one of 8 classes (sub-classes appear inline below)
2. **Geography** — state / metro / zip / radius with mode tabs
3. **Property Criteria** — SF, lot, year built, stories, units (fields adapt per asset class)
4. **Asset-Class Criteria** — fields from `criteria` JSONB, specific to selected class
5. **Ownership Profile** — entity type, absentee, out-of-state, hold period
6. **Distress Signals** — multi-select + match mode
7. **Risk Filters** — climate, flood, wildfire, heat
8. **Threshold and Delivery** — match threshold + run schedule collapsed into one step
9. **Review and Activate** — summary + name entry + confirm

### 6e. Geo contract drift is a live landmine

`buildPayload()` in wizardHelpers.js serializes `geo_cities` / `geo_zips` / `geo_radius_*` but the backend `matchProperties()` only reads `geo_states` / `geo_counties`. This gap exists today. The rebuild touches `wizardHelpers.js` — the contract must be verified and reconciled front-to-back before shipping.

**Reference:** CLAUDE.md "KNOWN LANDMINES" section.

### 6f. DealDetail.jsx is the best structural reference

It has full-page layout with left nav + main content + right rail, tab navigation at the top of the content area, multiple content areas that swap on tab select, header with context, footer actions. The CSS patterns (`content-col`, `rail`, flex layout with token-based widths from `deal-detail.css`) are the right foundation for the rebuilt configurator. Follow this structure, do not invent a new layout pattern.

---

## Summary

| Question | Answer |
|---|---|
| Configurator pattern | **Modal overlay** — `App.jsx` WizardLayer + `BuyBoxWizard.jsx` backdrop |
| Routed page exists | **No** — no `/buy-boxes/new` route anywhere in either repo |
| Total fields in form | ~30 fields across 6 dashboard steps / 9 web steps |
| Agent 2 uses buy box fields | **No** — Agent 2 is a single-property analyzer only |
| Buy box matching implemented | **No** — the df_buy_boxes → properties matching pipeline does not exist |
| Schema supports asset-class criteria | **No** — flat/generic; needs `criteria JSONB` column |
| Dead schema columns | 8 confirmed: `asset_classes`, `sub_assets`, `prop_classes`, `hold_period_min/max`, `notes`, `coverage_score/notes` |
| Live match pool panel | `BuyBoxRightRail.jsx` — passive renderer, data from preview API |
| Panel recommendation | Keep, move to right column of full-page layout, widen to 300–360px |
| Shared code between dashboard/web | **None** — fully duplicated |
| Best step structure reference | Start from web's 9-step structure, revised per Finding 6d |
| Best layout reference | `DealDetail.jsx` — existing full-page pattern in the dashboard |

---

*Audit produced from read-only pass. No files modified. Waiting for instructions.*
