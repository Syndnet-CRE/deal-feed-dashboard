# Buy Box Configurator — Current-State Spec

**Repo:** nightdrop-dashboard
**Captured:** 2026-05-19 (revised, after backend re-verification)
**Frontend source of truth:** `src/components/BuyBoxWizard.jsx` and the six page files it composes
**Backend:** `~/nightdrop-api` (GitHub `Syndnet-CRE/nightdrop-api`, branch `main`) deployed at `https://nightdrop-api.onrender.com`. Matcher: `scripts/run_deal_feed.js`, function `matchProperties(box, limit)` at line 181.
**Scope:** Everything a subscriber sees when they create or edit a buy box today

This file is a self-contained snapshot of the active wizard. It is intended to be uploaded to a separate Claude session (e.g. claude.ai web app) as project knowledge so another agent can reason about the configurator without having access to the repo.

---

## 1. Overview

### Routes

| Path | Component | Mode |
|---|---|---|
| `/buy-boxes/new` | `pages/BuyBoxPage.jsx` → `BuyBoxWizard` | `new` |
| `/buy-boxes/:id/edit` | `pages/BuyBoxPage.jsx` → `BuyBoxWizard` | `edit` |

In edit mode, the page looks up the box from `useDeals().buyBoxes`. If `loading` and not yet found, shows "Loading...". If finished loading and still not found, shows a "Buy box not found" guard.

### Shell

`BuyBoxWizard` renders a full-screen overlay with:
- **Header (top bar):** brand + 7-step stepper + previous/next icons + close
- **Content column:** the active step's component
- **Footer:** Back / status text (`Step N of 7 · {matchCount} matches`) / Continue (or Save changes / Review & activate on step 7)
- **Right rail:** `BuyBoxRightRail` — persistent across all 7 steps

### Keyboard

| Key | Action |
|---|---|
| `Cmd/Ctrl + Enter` | Next step (if `canGoNext`) |
| `Alt + ←` | Previous step |
| `Alt + →` | Next step |
| `Esc` | Cancel (calls `onCancel`) |

### Submit

- New: `POST /api/dealfeed/onboarding` with the payload from `nativeToPayload(form)`
- Edit: `PATCH /api/dealfeed/buy-boxes/:id` with the same payload
- On success: opens `BuyBoxActivatedDialog`, then navigates back to `/buy-boxes`
- Backend routes live in `~/nightdrop-api/routes/dealfeed/{onboarding,buyboxes,auth,admin}.js`

### Live preview

Debounced 400 ms on every criteria change: `POST /api/dealfeed/buy-boxes/preview` with the current payload. Updates `form.matchCount`. Endpoint may not exist on the backend; failures are swallowed silently.

---

## 2. Step inventory

The top stepper labels are: **Target · Profile · Owner · Distress · Location · Threshold · Activate**. Seven steps.

| # | Component | Step title | Eyebrow label (as shown) |
|---|---|---|---|
| 1 | `BuyBoxPage1` | What are you hunting? | `01/06 · Target` |
| 2 | `BuyBoxPage2` | Spec the asset. | `02/06 · Property profile` |
| 3 | `BuyBoxPage3` | Who owns it? | `03/06 · Owner profile` |
| 4 | `BuyBoxPage4` | What does motivated look like? | `04/06 · Distress signals` |
| 5 | `BuyBoxPage5` | Where should we exclude? | `05/07 · Location rules` |
| 6 | `BuyBoxPage6` | How good does a match need to be? | `06/07 · Match threshold` |
| 7 | `BuyBoxPage7` | Last look before it goes live. | `07/07 · Review & activate` |

> **Drift:** Steps 1-4 eyebrows read "of 06" while steps 5-7 read "of 07". Stepper actually has 7 steps. Bug.

---

## 3. Step-by-step field map

Legend for the "Conditional" column:
- **U** = universal (always shown)
- `asset = X` = visible only when the selected asset class equals X
- `asset != X` = visible for everything except X
- "states ≥ 1" = visible only when at least one state is selected

### Step 1 — Target

#### Section A · Asset class (U)
Card grid, single-select. Picking a new card replaces the previous selection.

| Card id | Title | Sub | "Tracked" count |
|---|---|---|---|
| `sfr` | Single-family | Detached, condo, co-op | 4,280,400 |
| `multifamily` | Multifamily | 2+ units, apartments | 1,391,000 |
| `retail` | Commercial / Retail | Storefronts, shopping centers | 412,100 |
| `office` | Office | Professional, medical | 218,400 |
| `industrial` | Industrial | Warehouse, flex, storage | 198,400 |
| `land` | Vacant land | Lots, acreage, agricultural | 1,840,000 |
| `hospitality` | Hospitality | Hotels, motels, resorts | 64,800 |
| `special_purpose` | Special Purpose | Gas station, parking, medical | 48,200 |

#### Section A.1 · Sub-asset class — conditional (exactly 1 asset class selected)
Multi-select chips, **maximum 3**, optional. Per-class subtype lists (from `src/lib/buyBoxTaxonomy.js`):

- **SFR (4):** Single Family Residence, Condominium, Cooperative (Co-op), Mobile / Manufactured Home (SFR)
- **Multifamily (7):** Duplex, Triplex, Quadruplex, Apartment / Multifamily 5+, Mobile / Manufactured Home, Loft / Live-Work, Residential Income (NEC)
- **Retail (13):** Retail (General), Strip Mall / Shopping Center, Neighborhood Shopping Center, Community / Neighborhood Retail, Supermarket / Grocery, Convenience Store, Restaurant / Food Service, Fast Food / QSR, Auto Dealership, Auto Repair / Service, Drugstore / Pharmacy, Car Wash / Laundromat, Retail (Specialty)
- **Office (8):** Office Building (General), Professional Office, Medical Office, Office Park, Mixed-Use Commercial, Commercial Loft / Mixed-Use, Mixed Residential / Commercial, Commercial (NEC / Misc)
- **Industrial (9):** Light Industrial, Warehouse / Distribution, Heavy Industrial / Manufacturing, Flex Industrial, Self Storage / Mini-Warehouse, Truck Terminal / Freight, Processing / Packaging, Industrial Park, Industrial (General)
- **Land (7):** Vacant Land (General), Vacant Land (Agricultural), Agricultural (General), Ranch / Range Land, Cropland / Row Crops, Pastureland / Grazing, Timberland / Forestry
- **Hospitality (5):** Hotel, Motel, Extended Stay / Suite Hotel, Resort, Bed & Breakfast / Inn
- **Special Purpose (6):** Service Station / Gas Station, Parking Lot / Garage, Healthcare / Medical Clinic, Rehabilitation / Skilled Nursing, Townhouse, Planned Unit Development

#### Section B · Geography (U)

| Control | Form key | Conditional | Notes |
|---|---|---|---|
| States combobox (search + multi-select) | `geo.states[]` | U | 50 states + DC. Required. Each has a hardcoded "tracked" count. |
| Counties/Metros tab switcher | (UI only) | U | Default tab: Counties |
| Counties combobox | `geo.counties[]` | states ≥ 1 | Keys are `STATE:CountyName`. Fetched from `GET /api/dealfeed/geo/counties?states=...`; falls back to hardcoded list. |
| Metros combobox | `geo.metros[]` | U | 47 hardcoded `MAJOR_METROS`. If states selected and no query, auto-filters to those states. |
| ZIP chip input | `geo.zips[]` | U | Type 5 digits, press Enter. Backspace removes last. Non-digits stripped. |

**Gate to step 2:** `assets.length > 0 && geo.states.length > 0`. This is the *only* step gate in the entire wizard.

### Step 2 — Profile

#### Section A · Physical

| Field | Form key | Unit | Conditional |
|---|---|---|---|
| Building size min/max | `phys.sf_min`, `phys.sf_max` | sqft (step 100) | U |
| Lot size min/max | `phys.acres_min`, `phys.acres_max` | acres (step 0.1) | U |
| Year built min/max | `phys.year_min`, `phys.year_max` | yr | U |
| Stories preset chips (1 / 2 / 3 / 4-6 / 7+) | `phys.stories_min` | — | `asset != land` |
| Unit count min/max | `phys.units_min`, `phys.units_max` | units | `asset = multifamily` |
| Bedrooms minimum (Any / 2+ / 3+ / 4+) | `phys.beds_min` | — | `asset = sfr` |
| Bathrooms minimum (Any / 1+ / 2+ / 3+) | `phys.baths_min` | — | `asset = sfr` |

All stories/beds/baths chips are single-select; clicking the active value clears it.

#### Section B · Financial (U)

| Field | Form key | Notes |
|---|---|---|
| Assessed value min/max | `fin.price_min`, `fin.price_max` | step $50,000 |
| Minimum owner equity (25% / 40% / 50% / 60% / 75%) | `fin.equity_preset` | single-select, click again to clear |
| "Assessed value below market value" toggle | `fin.assessed_below_market` | boolean |

### Step 3 — Owner (universal across all asset classes)

| Field | Form key | Options |
|---|---|---|
| Entity type | `owner.entity` | `any` / `individual` / `llc` / `trust` |
| Occupancy | `owner.occupancy` | `any` / `owner` / `absentee` / `rented` |
| Hold period | `owner.hold_min` | `''` (Any) / `3` / `5` / `10` / `20` |
| Out-of-state owners only | `owner.out_of_state` | toggle |

> **Drift:** Only `occupancy === 'absentee'` maps to a payload field (`absentee_only`). `owner` and `rented` values are inert at submit. There is no UI for `owner.hold_max` even though it is in the state shape.

### Step 4 — Distress (universal)

#### Section A · Distress signals
Multi-select card grid. Each card: icon, title, "in geo" count, description.

| id | Title | Count shown |
|---|---|---|
| `active-foreclosure` | Active foreclosure record | 84.2K |
| `tax-delinquent` | Tax delinquent | 218.4K |
| `absentee-owner` | Absentee owner | 1480.0K |
| `long-term-hold` | Long-term hold, no refi | 318.9K |
| `quit-claim-deed` | Quit-claim deed in history | 142.6K |
| `non-arms-length` | Non-arms-length prior sale | 98.1K |
| `investor-buyer` | Investor buyer at last purchase | 612.4K |
| `arm-mortgage` | ARM or variable-rate mortgage | 226.4K |
| `high-ltv` | High LTV (80%+) | 412.8K |
| `free-and-clear` | Free and clear (no mortgage) | 384.6K |
| `near-mortgage-maturity` | Balloon or ARM reset within 18 months | 4.7K |
| `prior-foreclosure-auction` | Prior foreclosure auction on record | 6.6K |

#### Match logic toggle
Segmented `AND` / `OR` (default `OR`). Sets `form.logic`.

#### Advanced (collapsible)
"Distress score floor" preset chips: `Any` / `30+` / `40+` / `60+`. Sets `form.distress_floor`.

> **Drift:** `src/lib/buyBoxTaxonomy.js` `DISTRESS_SIGNAL_OPTIONS` lists 10 signals. Wizard renders 12. They are out of sync.

### Step 5 — Location

| Field | Form key | Conditional |
|---|---|---|
| Exclude floodplain properties (toggle) | `risk.flood` | U |
| Underimproved land only (toggle) | `underimproved_land` | `asset = land` |

> **Drift:** `NATIVE_FORM.risk` also holds `climate`, `wildfire`, `heat` (and their `*Open` flags). `nativeToPayload` serializes them as `climate_risk_max` / `wildfire_risk_max` / `heat_risk_max`. The right rail's filter chip logic references them. **No UI control exists** to set them today. The "Climate ≤X" filter chip is unreachable.

### Step 6 — Threshold (universal)

Single-select card group:

| id | Display | Default |
|---|---|---|
| `volume` | 70% — More deals, wider funnel | |
| `balanced` | 80% — The default | ✓ |
| `precision` | 90%+ — Fewer deals, tighter signal | |

Maps to `match_threshold` on payload via `THRESHOLD_MAP = { volume: 0.70, balanced: 0.80, precision: 0.90 }`.

Below the cards: a static estimate line that hardcodes "up to **5** deals per delivery" regardless of `delivery.max`.

### Step 7 — Activate (universal)

| Field | Form key | Required? |
|---|---|---|
| Buy box name (text input) | `name` | Yes — Activate button disabled until non-empty |
| Filters summary (read-only chips) | derived | — |
| Delivery cadence (Daily / Weekly / Realtime cards) | `delivery.cadence` | — |
| Activate buy box button | — | — |

> **Drift 1:** `realtime` cadence has a UI option but `nativeToPayload` collapses anything that is not `'weekly'` into the 7-day Daily schedule. Realtime cadence is not actually persisted.
> **Drift 2:** `delivery.max` lives in state and is serialized as `delivery_max_per_run`, but the UI has no control to set it. It is locked to 5.

---

## 4. Right rail (persistent on all 7 steps)

Source: `src/components/BuyBoxRightRail.jsx`

| Element | Source field | Notes |
|---|---|---|
| Live status pill + clock | local | HH:MM:SS ticking |
| Live match pool | `form.matchCount` | Pulse animation + delta on change |
| Min equity stat cell | `form.fin.equity_preset` | Shows `≥ {preset}` or `--` |
| Hold period stat cell | `form.owner.hold_min/max` | Shows `≥{n}yr`, `≤{n}yr`, `{min}-{max}yr` |
| Occupancy stat cell | `form.owner.occupancy` | Shows `Absentee` or `--` (does not surface `owner` / `rented`) |
| Geographic concentration | `form.geo.states[]` | One chip per state code |
| Active filters | derived | Removable chips for every applied filter |

---

## 5. Form state shape

This is the exact starting state of the wizard (`NATIVE_FORM` in `BuyBoxWizard.jsx`).

```json
{
  "assets": [],
  "subtypes": [],
  "geo": { "states": [], "counties": [], "metros": [], "zips": [] },
  "phys": {
    "sf_min": "", "sf_max": "",
    "acres_min": "", "acres_max": "",
    "year_min": "", "year_max": "",
    "stories_min": "",
    "units_min": "", "units_max": "",
    "beds_min": "", "baths_min": ""
  },
  "fin": {
    "price_min": "", "price_max": "",
    "equity_preset": "",
    "assessed_below_market": false
  },
  "owner": {
    "entity": "",
    "occupancy": "",
    "hold_min": "", "hold_max": "",
    "out_of_state": false
  },
  "signals": [],
  "logic": "OR",
  "distress_floor": "",
  "risk": {
    "climate": 10, "flood": false,
    "wildfire": 10, "wildfireOpen": false,
    "heat": 10, "heatOpen": false
  },
  "underimproved_land": false,
  "threshold": "balanced",
  "delivery": { "cadence": "daily", "max": 5 },
  "name": "",
  "matchCount": 0
}
```

Notes:
- Numeric input fields are stored as **strings** (empty string = unset). `toNum()` converts to number-or-null at payload time.
- `geo.counties` entries are `STATE:CountyName` strings.
- `subtypes` holds 0-3 integer use codes.
- `signals` is an array of signal-id strings.
- `risk.climate / wildfire / heat` are stored on a 0-10 scale; payload multiplies by 10.

---

## 6. Backend payload contract

Output of `nativeToPayload(form)` in `BuyBoxWizard.jsx`.

```json
{
  "label": "string",
  "asset_classes": ["sfr" | "multifamily" | "retail" | "office" | "industrial" | "land" | "hospitality" | "special_purpose"] | null,
  "asset_class": null,
  "asset_use_codes": [123, 456] | null,
  "geo_states": ["TX", "FL"] | null,
  "geo_counties": ["Harris", "Dallas"] | null,
  "geo_cities": ["Austin, TX"] | null,
  "geo_zips": ["75205"] | null,
  "sf_min": null, "sf_max": null,
  "acres_min": null, "acres_max": null,
  "year_built_min": null, "year_built_max": null,
  "stories_min": null,
  "units_min": null, "units_max": null,
  "bedrooms_count_min": null,
  "bath_count_min": null,
  "value_min": null, "value_max": null,
  "min_equity_pct": 0.25 | 0.40 | 0.50 | 0.60 | 0.75 | null,
  "assessed_below_market": false,
  "owner_types": ["individual" | "llc" | "trust"] | null,
  "absentee_only": false,
  "out_of_state_only": false,
  "hold_period_min": null, "hold_period_max": null,
  "distress_signals": ["active-foreclosure", "..."] | null,
  "distress_only": false,
  "distress_match_mode": "and" | "or",
  "climate_risk_max": null,
  "flood_exclude": false,
  "wildfire_risk_max": null,
  "heat_risk_max": null,
  "underimproved_land": false,
  "match_threshold": 0.70 | 0.80 | 0.90,
  "run_schedule": { "days": ["mon"] | ["mon","tue","wed","thu","fri","sat","sun"] },
  "delivery_max_per_run": 5,
  "distress_score_min": null
}
```

Key transforms:

| Form value | Payload field |
|---|---|
| `geo.counties` of `STATE:Name` | `geo_counties` stripped to just `Name` |
| `geo.metros` | `geo_cities` |
| `fin.equity_preset` "25%" | `min_equity_pct` 0.25 |
| `threshold` "balanced" | `match_threshold` 0.80 |
| `owner.entity` "llc" | `owner_types: ["llc"]` |
| `owner.occupancy` "absentee" | `absentee_only: true` |
| `risk.climate` 7 | `climate_risk_max: 70` (only if < 10) |
| `signals.length > 0` | sets `distress_only: true` |
| `delivery.cadence` "weekly" | `run_schedule.days = ["mon"]` |
| anything else (including "realtime") | `run_schedule.days = [all 7]` |

---

## 7. Conditional-rule summary

| Rule | Where defined |
|---|---|
| Sub-asset chips appear | `sel.length === 1` in `BuyBoxPage1.jsx` |
| Counties tab usable | `activeStates.length > 0` in `BuyBoxPage1.jsx` |
| Metros pre-filtered by state | `activeStates.length > 0 && !metroQ` |
| Stories field | `!NO_STORIES_CLASSES.has(assetClass)` — `NO_STORIES_CLASSES = {'land'}` |
| Unit count field | `UNITS_CLASSES.has(assetClass)` — `UNITS_CLASSES = {'multifamily'}` |
| Bedrooms minimum | `SFR_CLASSES.has(assetClass)` — `SFR_CLASSES = {'sfr'}` |
| Bathrooms minimum | same as bedrooms |
| Underimproved land toggle | `form.assets?.includes('land')` |
| Step 1 → 2 gate | `assets.length > 0 && geo.states.length > 0` |
| Steps 2-6 → next gate | always true |
| Activate enabled | `name.trim() !== ''` |

Everything else is universal.

---

## 8. Audit findings (post backend re-verification, 2026-05-19)

This section supersedes the earlier flat "known drift" list. Findings are organized by tier; tier maps to severity and whether the fix is frontend-only, backend-only, or both.

### 8.1 Backend endpoint contract — verified clean

All four endpoints the wizard calls exist on `~/nightdrop-api`. The previous CLAUDE.md note that preview "may not exist yet" was stale.

| Frontend call | Backend handler | Status |
|---|---|---|
| `POST /api/dealfeed/buy-boxes/preview` | `routes/dealfeed/buyboxes.js:204` | exists |
| `PATCH /api/dealfeed/buy-boxes/:id` | `routes/dealfeed/buyboxes.js:352` | exists |
| `POST /api/dealfeed/onboarding` | `routes/dealfeed/onboarding.js:31` | exists |
| `GET /api/dealfeed/geo/counties?states=...` | `routes/dealfeed/geo.js:10` | exists |

No 404s waiting in the wizard. Preview-failure handling is still silent (see §8.11) but the endpoint is real.

### 8.2 Tier 1 — Critical: Controls that lie (sent → stored → never matched)

These are the worst kind of dead UI. The user sees the chip activate, the payload is built, the API call succeeds, the DB column is set, the box shows "active" — but `matchProperties()` (`~/nightdrop-api/scripts/run_deal_feed.js:181-376`) never references the field. The configured filter has **zero** effect on which deals show up.

| # | Wizard control | Page | Form key | Payload field | Backend behavior |
|---|---|---|---|---|---|
| A | "Minimum owner equity" chips (25/40/50/60/75%) | 2 | `fin.equity_preset` | `min_equity_pct` | Stored, never read |
| B | "Assessed value below market value" toggle | 2 | `fin.assessed_below_market` | `assessed_below_market` | Stored, never read |
| C | Entity type chips (Individual / LLC / Trust) | 3 | `owner.entity` | `owner_types` | Stored, never read |
| D | "Out-of-state owners only" toggle | 3 | `owner.out_of_state` | `out_of_state_only` | Stored, never read |
| E | Hold-period chips (3+ / 5+ / 10+ / 20+ years) | 3 | `owner.hold_min` | `hold_period_min` / `hold_period_max` | Stored, never read |
| F | Threshold cards (Volume 70% / Balanced 80% / Precision 90%) | 6 | `threshold` | `match_threshold` | Stored, never read |

**What the matcher actually narrows on:** geo, `sf_min/max`, `acres_min/max`, `year_built_min/max`, `value_min/max`, `absentee_only`, `distress_signals` (12 IDs), `bedrooms_count_min`, `bath_count_min`, `stories_min`, `distress_score_min`, `flood_exclude`, and four keys inside the `criteria` JSONB (`unit_count_min`, `occupancy_rate_min`, `price_per_unit_max`, `pad_count_min`). Anything else from the payload is metadata only.

**Resolution requires a product call:** either extend `matchProperties()` to honor these fields (backend work), or hide the controls until it does (frontend).

### 8.3 Tier 2 — Critical: Land subtypes are inert for matching

`BuyBoxPage1.jsx` exposes 7 land subtypes that send numeric `asset_use_codes` (389/120/392/117/105/109/118).

The matcher's land branch (`run_deal_feed.js:188-214`) does **not** read `asset_use_codes` for the land class. It branches on `box.sub_assets` slugs (`urban_infill`, `suburban_fringe`, `agricultural_rural`) — which the wizard never sends. Without `sub_assets`, the matcher falls through to all 7 land use codes.

Net effect: every Land buy box matches the same universe of land properties regardless of which subtype chips the user selected. Land subtypes work as **filters of the wizard's own taxonomy display**, not as filters of the deal feed.

For the other 7 asset classes (SFR, multifamily, retail, office, industrial, hospitality, special purpose), subtypes do work because the matcher uses `resolved_asset_type = ANY($1)` derived from `asset_use_codes`.

**Resolution:** either map wizard land subtypes to backend `sub_assets` slugs, or remove subtype chips for the Land class.

### 8.4 Tier 3 — Fields silently dropped on create

| Field | Wizard sends? | `POST /onboarding` | `PATCH /:id` | Matcher |
|---|---|---|---|---|
| `underimproved_land` | yes (Step 5 toggle, land-only) | **destructure missing** — no column set | **not in `PATCHABLE_FIELDS`** | not read |
| `distress_score_min` | yes (Step 4 Advanced chips) | **destructure missing** — value dropped | in `PATCHABLE_FIELDS` — stored | read at `run_deal_feed.js:302` |

**`underimproved_land` is end-to-end dead.** Toggle fires, payload includes it, backend ignores at every layer.

**`distress_score_min` is asymmetric.** A new box created via `POST /onboarding` silently drops it. Editing that same box via `PATCH /buy-boxes/:id` will store and honor it. Same field, two different behaviors depending on the entry point. The user could set "30+" on a new box, see the chip light up, save, and the new box has no floor. Edit the box, re-pick "30+", save again, and now the floor sticks.

### 8.5 Tier 4 — Phantom payload fields (no UI, never reachable)

| Field | Form-state key | Payload | UI | Matcher |
|---|---|---|---|---|
| `climate_risk_max` | `risk.climate` (default 10) | sent if `< 10` | none | not read |
| `wildfire_risk_max` | `risk.wildfire` (default 10) | sent if `< 10` | none | not read |
| `heat_risk_max` | `risk.heat` (default 10) | sent if `< 10` | none | not read |
| `wildfireOpen`, `heatOpen` | `risk.*Open` | never sent | none | n/a |

Always serialize as `null` in production because no UI ever changes the defaults. Even if a control existed and the user moved a slider, the matcher would still ignore the values. Two layers of dead.

**Resolution:** either build the UI and add matcher logic, or strip the plumbing (≈12 lines across `NATIVE_FORM`, `buildFilters`, `buildSummary`, `nativeToPayload`, `toNativeForm`).

### 8.6 Tier 5 — Backend supports, wizard never surfaces

These are product opportunities, not bugs.

| Backend capability | Where supported | Wizard exposure |
|---|---|---|
| Radius targeting (`geo_radius_lat/lng/miles/address`) | onboarding, PATCH, preview, matcher | none (dead `BuyBoxEditModal` has a "coming soon" tab) |
| `stories_max` | onboarding, PATCH, matcher would honor it | wizard only sends `stories_min` |
| `bedrooms_count_min` / `bath_count_min` for non-SFR classes | matcher applies them universally | wizard only shows them for SFR |
| `criteria.unit_count_min` | matcher reads via JSONB | no UI |
| `criteria.occupancy_rate_min` | matcher reads via JSONB | no UI |
| `criteria.price_per_unit_max` | matcher reads via JSONB | no UI |
| `criteria.pad_count_min` | matcher reads via JSONB | no UI |
| `notes` | onboarding column | no UI |
| `prop_classes` | onboarding column | no UI |
| `zoning_codes` | onboarding column | no UI |
| `min_hold_yrs` | onboarding column (legacy) | no UI |
| `asset_class_version` | onboarding column | no UI (defaults to 1) |
| `asset_class` (singular) | matcher prefers it | wizard always sends `null` |

The `asset_class: null` is **load-bearing by accident**. `run_deal_feed.js:182` does `box.asset_class === 'land' || (!box.asset_class && (box.asset_classes||[]).every(s => s.toLowerCase() === 'land'))`. The wizard always sends `asset_class: null`, so the second branch always fires. If anyone changes the matcher to prefer `asset_class` strictly, every wizard-created box silently misclassifies its asset universe.

### 8.7 Tier 6 — Stories chip labels lie about ranges

`BuyBoxPage23.jsx:114` chips:
```js
[{label: '1', value: 1}, {label: '2', value: 2}, {label: '3', value: 3}, {label: '4–6', value: 4}, {label: '7+', value: 7}]
```

Every chip sets only `phys.stories_min`. Matcher applies `stories_count >= stories_min`. So:
- "1" matches **everything** (1-story and taller)
- "2" matches 2-story and taller (not 2-story only)
- "4–6" matches 4-story and taller — including 50-story towers
- "7+" matches 7-story and taller (label is honest)

Only "7+" matches its label. Pure frontend fix: chips with a range need to send both `stories_min` and `stories_max`. Backend already has `stories_max` plumbed.

### 8.8 Tier 7 — 3-box cap is not pre-checked

`onboarding.js:97` returns `400 "Buy box limit reached (max 3)"` if the subscriber already has 3 non-deleted boxes. The wizard never reads this in advance. A capped user can walk all 7 steps, name the box, hit Activate, and only then learn they're blocked.

**Resolution:** check `useDeals().buyBoxes.length >= 3` on wizard mount; either block entry or show a clear notice on Step 7.

### 8.9 Tier 8 — Geo mutual-exclusion invisible to the user

`matchProperties()` at `run_deal_feed.js:229` evaluates geo modes in priority order: **county > city > zip > radius > state**. Only one mode actually narrows the query. The wizard lets the user multi-select all four simultaneously — Counties, Metros, ZIPs, and States. The non-priority modes are persisted to the DB but silently neutralized in matching. The UI gives zero hint.

**Resolution:** either communicate the priority in the UI ("Counties override Metros override ZIPs override States"), or constrain the controls to one mode at a time. Frontend-only.

### 8.10 Dead code (orphaned, deletable)

| File / directory | Lines | Verified by |
|---|---|---|
| `src/components/BuyBoxConfigurator/` (9 files) | ~1,270 | Zero imports outside the folder. Includes its own duplicate `buildPayload`. |
| `src/components/BuyBoxEditModal.jsx` | 386 | Zero imports anywhere. |
| `src/lib/wizardHelpers.js` | 256 | Only consumer is `BuyBoxEditModal` (dead). Active wizard uses inline `nativeToPayload` instead. |
| `src/lib/wizardHelpers.test.js` | 1,914 | Tests for unused helpers. |
| `src/styles/buy-box-edit-modal.css` | 259 | Only imported by `BuyBoxEditModal`. |

Total: ~4,085 lines of orphaned frontend code that the build still ships in `dist/`.

Two parallel form-mapper implementations exist (`wizardHelpers.buildPayload` vs `BuyBoxWizard.nativeToPayload`) with different field shapes (helpers store empty as `null`; wizard stores empty as `''`; helpers treat `owner.entity` as array; wizard treats as string). They drift silently because nothing forces them to agree.

### 8.11 Cosmetic + half-finished items

| Item | Where | Effect |
|---|---|---|
| Step eyebrow labels read "of 06" on steps 1-4 and "of 07" on steps 5-7 | `BuyBoxPage1-4.jsx` vs `BuyBoxPage5-7.jsx` | Stepper has 7 steps; eyebrow numbers contradict |
| `delivery.cadence = 'realtime'` collapses to Daily | `nativeToPayload:144` | UI option doesn't persist |
| `delivery.max` has no UI input (hardcoded to 5) | `BuyBoxWizard.jsx:39` | Field is in state and payload, never set by user |
| Step 6 estimate hardcodes "up to 5 deals per delivery" | `BuyBoxPage6.jsx:66` | Ignores `delivery.max` |
| `owner.hold_max` has no UI control | `BuyBoxPage23.jsx` | Field in state, never set |
| Occupancy chips `owner` and `rented` are inert | `BuyBoxPage23.jsx:270` | Only `absentee` maps to payload |
| `distress_signals` taxonomy mismatch | `buyBoxTaxonomy.js` has 10 vs wizard renders 12 | Taxonomy file is only used by the dead `BuyBoxEditModal` — strictly orphan after §8.10 cleanup |
| Preview endpoint failures silent | `BuyBoxWizard.jsx:226` | `catch {}` — preview-error never surfaces; if endpoint 500s, user just sees match count stuck |
| Stepper allows click-back only | `BuyBoxWizard.jsx:336` | Forward jump past current step is blocked |
| `subtypes` chip limit (max 3) | `BuyBoxPage1.jsx:184` | Hardcoded with no UX hint when blocked |

### 8.12 Severity-ordered fix queue

| Severity | Item | Where |
|---|---|---|
| 🔴 Critical | §8.2 — 6 lying controls (equity, assessed-below-market, entity, out-of-state, hold, threshold) | Backend matcher OR hide UI |
| 🔴 Critical | §8.3 — Land subtypes inert | Backend `sub_assets` mapping OR hide UI |
| 🔴 Critical | §8.4a — `underimproved_land` end-to-end dead | Backend column/matcher OR remove toggle |
| 🟠 High | §8.4b — `distress_score_min` asymmetric POST/PATCH | Backend — add to onboarding destructure |
| 🟠 High | §8.8 — Geo mutex silent to user | Frontend UX |
| 🟠 High | §8.7 — 3-box cap not pre-checked | Frontend |
| 🟡 Medium | §8.7 — Stories chip labels lie | Frontend (send `stories_max`) |
| 🟡 Medium | §8.5 — Phantom climate/wildfire/heat plumbing | Strip or build UI + matcher |
| 🟡 Medium | §8.10 — Dead-code cleanup (~4,085 lines) | Frontend delete |
| 🟢 Low | §8.6 — Surface radius / stories_max / criteria JSONB / etc. | Product roadmap |
| 🟢 Low | §8.11 cosmetic items | Frontend polish |

---

## 9. Reference source excerpts

These are the exact constants and functions another agent would need to reason about the configurator without repo access. All from the active code path.

### Conditional-asset-class sets (`BuyBoxPage23.jsx`)

```js
const UNITS_CLASSES     = new Set(['multifamily'])
const NO_STORIES_CLASSES = new Set(['land'])
const SFR_CLASSES       = new Set(['sfr'])
```

### Threshold and equity maps (`BuyBoxWizard.jsx`)

```js
const EQUITY_MAP    = { '25%': 0.25, '40%': 0.40, '50%': 0.50, '60%': 0.60, '75%': 0.75 };
const THRESHOLD_MAP = { volume: 0.70, balanced: 0.80, precision: 0.90 };
const ENTITY_MAP    = { individual: ['individual'], llc: ['llc'], trust: ['trust'] };
```

### Step gate (`BuyBoxWizard.jsx`)

```js
function canGoNext(page, form) {
  if (page === 1) return form.assets.length > 0 && form.geo.states.length > 0;
  return true;
}
```

### Payload builder (`BuyBoxWizard.jsx`)

```js
function nativeToPayload(form) {
  return {
    label: form.name || '',
    asset_classes: form.assets.length ? form.assets : null,
    asset_class: null,
    asset_use_codes: form.subtypes?.length ? form.subtypes : null,
    geo_states: form.geo.states.length ? form.geo.states : null,
    geo_counties: form.geo.counties.length
      ? form.geo.counties.map(c => c.includes(':') ? c.split(':')[1] : c)
      : null,
    geo_cities: form.geo.metros?.length ? form.geo.metros : null,
    geo_zips: form.geo.zips.length ? form.geo.zips : null,
    sf_min: toNum(form.phys.sf_min), sf_max: toNum(form.phys.sf_max),
    acres_min: toNum(form.phys.acres_min), acres_max: toNum(form.phys.acres_max),
    year_built_min: toNum(form.phys.year_min), year_built_max: toNum(form.phys.year_max),
    stories_min: toNum(form.phys.stories_min),
    units_min: toNum(form.phys.units_min), units_max: toNum(form.phys.units_max),
    bedrooms_count_min: toNum(form.phys.beds_min),
    bath_count_min: toNum(form.phys.baths_min),
    value_min: toNum(form.fin.price_min), value_max: toNum(form.fin.price_max),
    min_equity_pct: form.fin.equity_preset ? (EQUITY_MAP[form.fin.equity_preset] ?? null) : null,
    assessed_below_market: form.fin.assessed_below_market || false,
    owner_types: ENTITY_MAP[form.owner.entity] ?? null,
    absentee_only: form.owner.occupancy === 'absentee',
    out_of_state_only: form.owner.out_of_state || false,
    hold_period_min: toNum(form.owner.hold_min), hold_period_max: toNum(form.owner.hold_max),
    distress_signals: form.signals.length ? form.signals : null,
    distress_only: form.signals.length > 0,
    distress_match_mode: form.logic.toLowerCase(),
    climate_risk_max:  form.risk.climate  < 10 ? form.risk.climate  * 10 : null,
    flood_exclude:     form.risk.flood || false,
    wildfire_risk_max: form.risk.wildfire < 10 ? form.risk.wildfire * 10 : null,
    heat_risk_max:     form.risk.heat     < 10 ? form.risk.heat     * 10 : null,
    underimproved_land: form.underimproved_land || false,
    match_threshold: THRESHOLD_MAP[form.threshold] ?? 0.80,
    run_schedule: form.delivery.cadence === 'weekly'
      ? { days: ['mon'] }
      : { days: ['mon','tue','wed','thu','fri','sat','sun'] },
    delivery_max_per_run: form.delivery.max || 5,
    distress_score_min: toNum(form.distress_floor) || null,
  };
}
```

### Reverse mapper for edit mode (`BuyBoxWizard.jsx`)

```js
function toNativeForm(b) {
  if (!b) return { ...NATIVE_FORM };
  const reversedEquity    = Object.entries(EQUITY_MAP).find(([, v]) => v === b.min_equity_pct)?.[0] || '';
  const reversedThreshold = Object.entries(THRESHOLD_MAP).find(([, v]) => v === b.match_threshold)?.[0] || 'balanced';
  const rawEntity         = b.owner_types;
  const reversedEntity    = rawEntity?.length === 1
    ? (Object.entries(ENTITY_MAP).find(([, v]) => v[0] === rawEntity[0])?.[0] || 'any')
    : rawEntity?.length > 1 ? 'any' : '';
  // ... returns NATIVE_FORM-shaped object
}
```

---

## 10. File index

| File | Role |
|---|---|
| `src/pages/BuyBoxPage.jsx` | Route component — looks up box, mounts wizard |
| `src/components/BuyBoxWizard.jsx` | Wizard shell, state, payload mapping, submit |
| `src/components/BuyBoxPage1.jsx` | Step 1 — asset class, subtypes, geography |
| `src/components/BuyBoxPage23.jsx` | Steps 2 and 3 — profile, owner |
| `src/components/BuyBoxPage4.jsx` | Step 4 — distress signals |
| `src/components/BuyBoxPage5.jsx` | Step 5 — location rules |
| `src/components/BuyBoxPage6.jsx` | Step 6 — threshold |
| `src/components/BuyBoxPage7.jsx` | Step 7 — review and activate |
| `src/components/BuyBoxRightRail.jsx` | Persistent right rail |
| `src/components/BuyBoxActivatedDialog.jsx` | Post-submit confirmation modal |
| `src/components/buybox-icons.jsx` | `Ic.*` icon set used across the wizard |
| `src/lib/buyBoxTaxonomy.js` | Asset class subtypes, US_STATES, MAJOR_METROS, distress options |
| `src/lib/wizardHelpers.js` | Alternative `EMPTY_FORM`/`buildPayload`/`toFormState` — used only by `BuyBoxEditModal`, not by the main wizard |
| `src/components/BuyBoxConfigurator/` | Dead v2 scaffold; not imported |

---

## 11. End-to-end happy path (what a subscriber actually does)

1. Subscriber clicks "+ New buy box" on `/buy-boxes` → navigates to `/buy-boxes/new` → wizard mounts.
2. **Step 1 — Target.** Picks one asset class (e.g. `sfr`). Sub-asset chips appear. Selects 0-3 subtypes. Picks one or more states. Optionally adds counties or metros or ZIPs. Clicks **Continue**.
3. **Step 2 — Profile.** Enters any physical and financial ranges. SFR users see bed/bath chips. Multifamily users see unit count. Land users do not see stories. Toggles "assessed below market" if relevant. Clicks **Continue**.
4. **Step 3 — Owner.** Picks entity type, occupancy, hold period. Toggles out-of-state if relevant. Clicks **Continue**.
5. **Step 4 — Distress.** Picks any distress signals. Toggles AND / OR. Optionally opens Advanced and sets a distress score floor. Clicks **Continue**.
6. **Step 5 — Location.** Toggles floodplain exclude. Land users see an underimproved-land toggle. Clicks **Continue**.
7. **Step 6 — Threshold.** Picks Volume / Balanced / Precision. Clicks **Continue**.
8. **Step 7 — Activate.** Names the box. Reviews chip summary. Picks cadence. Clicks **Activate buy box**. Wizard POSTs to `/api/dealfeed/onboarding`. On success, `BuyBoxActivatedDialog` opens.
