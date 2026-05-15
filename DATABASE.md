# Night Drop Database Audit

**Date:** 2026-05-14
**Database:** Neon PostgreSQL (single endpoint for read and write)
**DATABASE_URL / DATABASE_WRITE_URL:** same pooler endpoint
**Total properties:** 956,188
**Geographic scope:** Austin-Round Rock MSA — Travis (444K), Williamson (282K), Hays (123K), Bastrop (72K), Caldwell (30K). ~4,800 scattered Texas records. Do not market this as multi-metro Texas coverage.

---

## CONFIRMED PIPELINE BUGS

### Bug 1 — Foreclosure status never matches

**File:** `scripts/run_deal_feed.js:134` and `scripts/run_deal_feed.js:276`

`deriveDistressSignals()` checks `prop.foreclosure_status`. `composeFallbackNarrative()` would surface it. But `matchProperties()` SQL at line 275-276 only joins `properties p LEFT JOIN ownership o`. It never joins `foreclosure_records`. So `prop.foreclosure_status` is always undefined.

Additionally, the prior audit doc claimed foreclosure statuses were "Scheduled/Canceled/Sold/Unsold". Live DB shows:
- Active: 22,114 rows
- Completed: 19,848 rows
- NULL: 45,884 rows

Active foreclosures are 100% invisible to the pipeline. Fix: add `LEFT JOIN foreclosure_records fr ON fr.attom_id = p.attom_id AND fr.status = 'Active'` in `matchProperties()`.

### Bug 2 — tax_delinquent_year sourced from wrong table

**File:** `scripts/run_deal_feed.js:133`, `services/narrativeGenerator.js:33`

Both files reference `prop.tax_delinquent_year`. This column does NOT exist on the `properties` table (verified via `\d properties` — 155 columns, no `tax_delinquent_year`). It only exists on `tax_assessments`. Since `matchProperties()` never joins `tax_assessments`, `prop.tax_delinquent_year` is always null. The delinquency signal is silently lost for all 6,047 tax-delinquent properties in the database.

Fix: add `LEFT JOIN tax_assessments ta ON ta.attom_id = p.attom_id` in `matchProperties()` and `SELECT ta.tax_delinquent_year` in the SELECT list.

---

## CURRENT PIPELINE — WHAT IT ACTUALLY DOES

**`matchProperties()` in `scripts/run_deal_feed.js:265-282`:**
- Joins only: `properties p LEFT JOIN ownership o`
- SELECT list: 28 fields
- Distress filter: `p.distress_score DESC` — works, but distress_score is 0 for 54% of properties
- Missing joins: foreclosure_records, current_loans, tax_assessments, climate_risk, property_valuations, property_gis_profile, building_permits, property_details, sales_transactions

**`narrativeGenerator.js`:**
- Model: `claude-haiku-4-5-20251001`
- max_tokens: 200 (yields ~2-3 sentences, often truncated)
- Input: 17 fields (address, asset_type, lot_acres, building_sf, year_built, zoning, assessed_value, owner, entity_type, absentee_owner, owner_since_year, years_held, tax_delinquent_year [ALWAYS NULL], foreclosure_status [ALWAYS NULL], distress_score, out_of_state_owner)
- Bug: `prop.zoning` is also always empty — `properties.zoning` is 0% populated. Real zoning is in `property_gis_profile.zoning_code` (65% of GIS-enrolled properties).

**`deriveDistressSignals()` in `scripts/run_deal_feed.js:130-141`:**
Checks: absentee_owner (works), tax_delinquent_year (ALWAYS NULL), foreclosure_status (ALWAYS NULL), long-term hold (works if owner_since_year populated), high distress_score (works if score > 0).

**`scoreProperty()` in `scripts/run_deal_feed.js:41-48`:**
Uses only: distress_score, is_absentee_owner, owner1_name_full. Returns 1-10. Max score is 9 for a high-distress absentee-owned property with known owner.

---

## TABLE INVENTORY — ROW COUNTS

| Table | Row Count | Notes |
|---|---|---|
| properties | 956,188 | Core parcel table |
| ownership | 951,728 | One primary owner per property (ownership_sequence=1) |
| tax_assessments | 951,728 | Most recent; historical available |
| sales_transactions | 2,701,175 | All recorded transactions, every property |
| building_permits | 4,136,526 | Full Austin permit history |
| gis_infrastructure | 3,745,083 | 33 unified_group types, spatial polygons |
| parcel_adjacency | 2,417,010 | 1.2M touching parcel pairs for assemblage |
| climate_risk | 911,509 | 5 of 7 scores populated |
| property_details | 951,728 | Construction, materials, amenities |
| current_loans | 708,865 | Up to 3 mortgages per property |
| property_gis_profile | 418,647 | Zoning, flood, OZ, school district, utility proximity |
| property_valuations | 667,820 | Monthly rental estimates (NOT AVM values) |
| foreclosure_records | 87,846 | Active + completed |
| self_storage_facilities | 4,719 | Enriched self-storage with REIT/loan/FC data |
| lihtc_projects | 281 | LIHTC affordable housing projects |
| df_subscribers | 10 | Night Drop subscribers |
| df_buy_boxes | 3 | Subscriber buy boxes |
| df_deals_sent | 445 | Deal delivery log |

---

## PROPERTIES TABLE — 155 COLUMNS

### Identifiers (100% populated)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| attom_id | bigint | 100 | Primary key |
| fips_code | varchar | 100 | County FIPS |
| parcel_number_raw | varchar | ~99 | Raw APN |
| parcel_number_formatted | varchar | ~99 | Formatted APN |
| parcel_number_alternate | text | sparse | Alternate APN |
| parcel_account_number | text | sparse | |

### Address (100% populated)
| Column | Type | Pop% |
|---|---|---|
| address_full | varchar | 100 |
| address_house_number | varchar | ~99 |
| address_street_name | varchar | ~99 |
| address_street_suffix | varchar | ~99 |
| address_city | varchar | 100 |
| address_state | varchar | 100 |
| address_zip | varchar | 100 |
| address_zip4 | varchar | ~85 |
| address_unit_prefix | varchar | sparse |
| address_unit_number | varchar | sparse |

### Geolocation (100% populated)
| Column | Type | Pop% |
|---|---|---|
| latitude | float | 100 |
| longitude | float | 100 |
| location | geometry(Point) | 100 |
| geo_quality_code | text | ~99 |

### Property Classification
| Column | Type | Pop% | Notes |
|---|---|---|---|
| property_use_code | varchar | ~99 | ATTOM use code |
| property_use_standardized | varchar | ~99 | Standardized use string |
| property_use_group | varchar | ~99 | Broad group |
| resolved_asset_type | text | 47 | Mapped CRE asset class — 448,772 rows |
| asset_slug | text | 47 | kebab slug of resolved_asset_type |
| cre_target | boolean | ~47 | True for CRE-relevant assets |

### Physical — Building
| Column | Type | Pop% | Notes |
|---|---|---|---|
| year_built | integer | 84 | |
| effective_year_built | integer | sparse | |
| area_building | integer | 83 | Building SF |
| area_lot_sf | integer | 100 | Lot square feet |
| area_lot_acres | numeric | 100 | Always populated |
| bedrooms_count | integer | ~50 | |
| bath_count | numeric | ~50 | |
| bath_full_count | integer | ~50 | |
| bath_half_count | integer | sparse | |
| rooms_count | integer | ~40 | |
| stories_count | numeric | ~40 | |
| units_count | integer | ~20 | For multifamily |
| buildings_count | integer | sparse | |
| lot_depth | numeric | sparse | |
| lot_width | numeric | sparse | |

### Zoning (CRITICAL: columns differ by source)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| zoning | varchar | **0%** | DEAD COLUMN — never use |
| zoning_local | text | 28.5 | Raw code, 272,567 rows |
| zoning_jurisdiction | text | ~28 | Jurisdiction name |
| future_land_use | varchar | 10 | 95,131 rows |
| flu_jurisdiction | varchar | ~10 | FLU jurisdiction |

Use `property_gis_profile.zoning_code` for enriched GIS zoning (65% of GIS-enrolled properties = ~270K).

### Flood / Environmental
| Column | Type | Pop% | Notes |
|---|---|---|---|
| flood_zone | text | 44 | 418,469 rows |
| flood_zone_desc | text | ~44 | |
| in_floodplain | boolean | 100 | All 956K rows (false for most) |
| nearest_water_ft | numeric | sparse | |
| nearest_water_diam | numeric | sparse | |
| nearest_water_material | text | sparse | |
| nearest_sewer_ft | numeric | sparse | |
| nearest_sewer_diam | numeric | sparse | |
| nearest_storm_ft | numeric | sparse | |
| nearest_storm_diam | numeric | sparse | |

### Financial
| Column | Type | Pop% | Notes |
|---|---|---|---|
| tax_assessed_value_total | numeric | 99.9 | 954,973 rows |
| last_sale_date | date | 87.7 | 838,687 rows |
| last_sale_price | numeric | 1.9 | **17,893 rows only — TX non-disclosure** |
| improvement_to_land_ratio | numeric | 45 | 433,753 rows |
| years_owned | numeric | 39 | 375,860 rows |
| mortgage_maturity_approx | date | sparse | |
| mortgage_maturity_is_approx | boolean | sparse | |

### Scores (all computed, ~46% populated)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| distress_score | integer | 46.5 | 444,312 rows; 0-100 scale; AVG=12.1 |
| seller_motivation_score | integer | 46.5 | 444,312 rows; AVG=18.9 |
| development_potential_score | integer | 46.5 | 444,312 rows; AVG=28.0 |
| market_momentum_score | numeric | 46.5 | |
| assemblage_score | numeric | 46.4 | 443,608 rows; AVG=22.3 |
| scores_refreshed_at | timestamp | 46.5 | |

### Assemblage
| Column | Type | Pop% | Notes |
|---|---|---|---|
| assemblage_group_id | text | sparse | Group ID for same-owner clusters |
| assemblable_acreage | numeric | sparse | Total acreage if assembled |
| assemblage_parcel_count | integer | sparse | Number of parcels in group |
| same_owner_parcel_count | integer | ~4 | 40,191 owners with multiple parcels |

### Area Demographics (denormalized)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| median_hh_income | integer | 43 | 411,396 rows |
| population_density | float | 43 | |
| pct_renter_occupied | float | 43 | |
| median_gross_rent | integer | 43 | |
| median_home_value | integer | 43 | |
| in_opportunity_zone | boolean | **0%** | Empty — use property_gis_profile.opportunity_zone |
| opportunity_zone_tract | text | 0 | |

### Rent / ZORI (Austin MSA data, ~45% populated)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| zori_rent_index | float | 45 | 432,017 rows — Zillow Observed Rent Index |
| zori_yoy_change | float | 45 | Year-over-year rent change |
| hud_fmr_1br | integer | **0%** | Columns exist, data NOT LOADED |
| hud_fmr_2br | integer | **0%** | HUD Fair Market Rent — free data, not loaded |
| hud_fmr_3br | integer | **0%** | |

### Nearest Infrastructure
| Column | Type | Pop% | Notes |
|---|---|---|---|
| nearest_road_name | varchar | ~33 | |
| nearest_road_aadt | integer | 33 | 312,442 rows — daily vehicle count |
| nearest_road_ft | numeric | ~33 | Distance to road |
| nearest_substation_ft | float | sparse | |
| nearest_substation_voltage | text | sparse | |
| nearest_substation_name | text | sparse | |
| nearest_rail_yard_ft | float | sparse | |
| nearest_rail_yard_name | text | sparse | |

### Ownership Flags (denormalized from ownership table)
| Column | Type | Pop% | Notes |
|---|---|---|---|
| owner_is_out_of_state | boolean | 46 | 444,268 rows |

### Location Context
| Column | Type | Pop% | Notes |
|---|---|---|---|
| county_name | text | 100 | |
| state_code | text | 100 | |
| county_fips | text | ~99 | |
| state_fips | text | ~99 | |
| cbsa_name | text | ~99 | "Austin-Round Rock-Georgetown, TX" for most |
| cbsa_code | text | ~99 | |
| msa_name | text | ~99 | |
| msa_code | text | ~99 | |
| csa_name | text | sparse | |
| school_district | text | ~43 | |
| school_district_rating | text | ~43 | |
| jurisdiction_name | text | ~99 | City/municipality |
| city_jurisdiction | varchar | sparse | |
| in_etj | boolean | sparse | Extra-territorial jurisdiction |
| etj_city | varchar | sparse | |
| etj_released | boolean | sparse | |
| census_tract | varchar | ~99 | |
| census_block | varchar | ~99 | |
| census_block_group | text | ~99 | |
| census_place_code | text | ~99 | |
| congressional_district | text | ~99 | |
| neighborhood_code | text | sparse | |

### Development Context
| Column | Type | Pop% | Notes |
|---|---|---|---|
| active_permits_1mi | integer | sparse | Rolled up from building_permits |
| active_subdivisions_1mi | integer | sparse | |

---

## OWNERSHIP TABLE — 80 COLUMNS, 951,728 ROWS

All queries should filter `WHERE ownership_sequence = 1` for current primary owner.

| Column | Pop% | Notes |
|---|---|---|
| owner1_name_full | 99.9 | 951,262 rows |
| owner1_name_first / last | ~99 | |
| owner2_name_full | sparse | Second owner if joint |
| owner3_name_full / owner4_name_full | sparse | |
| ownership_type | 40 | 381,136 rows — ownership structure code |
| company_flag | 100 | Boolean — true if LLC/Corp |
| trust_flag | 100 | Boolean — true if trust |
| is_owner_occupied | 100 | |
| is_absentee_owner | 100 | Derived from mail vs property address |
| owner_out_of_state | ~99 | 951,249 rows with mailing state |
| mail_address_full / city / state / zip | ~99 | |
| trust_description | 21 | 201,158 rows — trust name/details |
| vesting_relation_code | 100 | Legal vesting relationship code |
| ownership_transfer_date | 77 | 737,900 rows |
| deed_owner1_name_full | ~99 | Name as recorded on deed |
| transfer_document_number | sparse | |
| transfer_transaction_id | ~77 | Links to sales_transactions |

---

## TAX_ASSESSMENTS TABLE — 29 COLUMNS, 951,728 ROWS

| Column | Pop% | Notes |
|---|---|---|
| tax_year | 100 | 2023-2025 range |
| assessed_value_total | 99.9 | 950,526 rows |
| assessed_value_land | 95.6 | 909,916 rows |
| assessed_value_improvements | 83.6 | 796,070 rows |
| market_value_total | 99.9 | 950,526 rows |
| market_value_land | sparse | |
| market_value_improvements | sparse | |
| assessed_improvements_pct | 83.3 | 793,048 rows |
| tax_amount_billed | 89.1 | 847,431 rows |
| tax_rate | **0%** | Empty |
| tax_delinquent_year | 0.6 | **6,047 rows** — NOT on properties table |
| has_homeowner_exemption | 100 | |
| has_senior_exemption | 100 | |
| has_veteran_exemption | 100 | |
| has_disabled_exemption | 100 | |
| prior_sale_date | sparse | |
| prior_sale_amount | sparse | |

**CRITICAL:** `tax_delinquent_year` lives here, not on `properties`. All pipeline code referencing `prop.tax_delinquent_year` is broken.

---

## SALES_TRANSACTIONS TABLE — 60+ COLUMNS, 2,701,175 ROWS

**Texas non-disclosure state.** Only 52,689 rows (2%) have `sale_price > 0`. Do not use sale price for comps.

| Column | Pop% | Notes |
|---|---|---|
| recording_date | 64.9 | 1,752,373 rows |
| sale_price | 2.0 | **52,689 rows with price** — TX non-disclosure |
| grantor1_name_full (seller) | 62.6 | 1,690,937 rows |
| grantee1_name_full (buyer) | 99.9 | 2,700,038 rows |
| is_arms_length | 100 | |
| is_foreclosure_auction | 100 | |
| is_distressed | 100 | |
| is_multi_parcel | 100 | |
| grantee_investor_flag | 100 | |
| document_type | ~99 | Deed type |
| grantor_owner_type / grantee_owner_type | partial | Buyer/seller entity type |
| grantor_grantee_relationship | sparse | Related-party flag |
| title_company_standardized | sparse | |
| down_payment | sparse | |
| purchase_ltv | sparse | |

**Useful flags even without price:** `is_foreclosure_auction`, `is_distressed`, `grantee_investor_flag`, transaction count per property (velocity signal), most recent recording_date, buyer/seller entity type transitions (individual → LLC is a flip/assignment signal).

---

## CURRENT_LOANS TABLE — 40 COLUMNS, 708,865 ROWS

| Column | Pop% | Notes |
|---|---|---|
| first_loan_amount | 55.7 | 532,154 rows |
| first_loan_recording_date | 55.7 | 532,155 rows |
| first_lender_name_last | 55.7 | 531,765 rows — lender name |
| first_loan_type | 5.3 | 50,523 rows |
| first_interest_rate | 0 | Empty |
| first_interest_rate_type | sparse | |
| first_mortgage_type | sparse | |
| second_loan_amount | 9.2 | 87,445 rows |
| second_lender_name_last | sparse | |
| third_loan_amount | sparse | |
| ltv | 67.2 | **640,164 rows** — loan-to-value ratio |
| available_equity | 61.5 | 585,971 rows — dollar equity estimate |
| lendable_equity | 61.5 | 585,971 rows |
| publication_date | ~100 | Data freshness date |

**Key insight:** `ltv` and `available_equity` are on current_loans, not properties. 640K properties have LTV data. Properties with LTV > 85 and distress signals are strong motivated-seller targets.

---

## FORECLOSURE_RECORDS TABLE — 37 COLUMNS, 87,846 ROWS

### Status breakdown:
- Active: 22,114 (currently in foreclosure — the signal we want)
- Completed: 19,848 (resolved — historical)
- NULL: 45,884 (status unknown)

| Column | Pop% | Notes |
|---|---|---|
| record_type | 100 | |
| foreclosure_recording_date | 98.5 | 86,493 rows |
| status | 47.8 | Active / Completed / NULL |
| original_loan_amount | 27.5 | 24,131 rows |
| loan_balance | 0.007 | Essentially empty |
| default_amount | 0.002 | Essentially empty |
| borrower_name | 46.9 | 41,192 rows |
| lender_name_standardized | 46.3 | 40,722 rows |
| auction_date | 41.6 | 36,573 rows |
| auction_opening_bid | 0.5 | 445 rows |
| estimated_value | 31.9 | 28,082 rows |
| loan_maturity_date | sparse | |
| original_loan_interest_rate | sparse | |

**Fix required:** `matchProperties()` must join with `WHERE fr.status = 'Active'`. The old "Scheduled/Canceled/Sold/Unsold" status values from the prior audit doc are WRONG — they do not exist in this database.

---

## CLIMATE_RISK TABLE — 30 COLUMNS, 911,509 ROWS

| Column | Pop% | Notes |
|---|---|---|
| heat_risk_score | 100 | All 911,509 rows |
| storm_risk_score | 100 | |
| wildfire_risk_score | 100 | |
| drought_risk_score | 100 | |
| flood_risk_score | 100 | |
| wind_risk_score | **0%** | Empty |
| air_quality_risk_score | **0%** | Empty |
| total_risk_score | 43.5 | 415,847 rows |
| flood_chance_future | 100 | All 911,509 rows |
| heat_future_avg | 100 | Projected future temperature |
| heat_baseline_avg | ~100 | Current baseline |
| storm_baseline_avg_counts | ~100 | |
| storm_future_avg_counts | ~100 | |
| drought_baseline_avg | ~100 | |
| drought_future_avg | ~100 | |
| flood_high_tide_future | ~100 | |
| flood_depth_future | ~100 | |
| fema_flood_risk | sparse | |

**Prior audit error:** Claimed total_risk_score = 100% populated. Live DB: 43.5% (415,847 rows). Individual component scores ARE 100% populated.

---

## PROPERTY_VALUATIONS TABLE — 22 COLUMNS, 667,820 ROWS

**Critical finding:** `estimated_value` = 0% populated (no AVM values). `confidence_score` = 0% populated. This table does NOT contain property valuations. It contains **monthly rental estimates**.

| Column | Pop% | Notes |
|---|---|---|
| estimated_value | **0%** | EMPTY — no AVM here |
| confidence_score | **0%** | EMPTY |
| estimated_rental_value | 100 | Avg $2,956/month |
| estimated_min_value | 100 | Avg $2,278/month (rental range min) |
| estimated_max_value | 100 | Avg $3,936/month (rental range max) |
| ltv | 37.9 | 252,887 rows |
| available_equity | 45.4 | 302,943 rows |
| valuation_date | 100 | Monthly snapshot date |

Rename these fields in any frontend display to `estimated_rental_value` not "estimated value" to avoid confusion.

---

## PROPERTY_GIS_PROFILE TABLE — 40 COLUMNS, 418,647 ROWS

Covers ~44% of all properties, primarily Austin/Travis. Spatial data with utility proximity JSONB.

| Column | Pop% | Notes |
|---|---|---|
| zoning_code | 65 | 270,967 rows — Austin CoA zoning codes (SF-1, MF-3, CS, LI, etc.) |
| zoning_description | 0 | Empty |
| zoning_jurisdiction | sparse | |
| future_land_use | sparse | |
| fema_flood_zone | 99.9 | 418,469 rows |
| in_floodplain | 100 | Boolean |
| in_floodway | 100 | Boolean |
| flood_source | sparse | |
| opportunity_zone | 100 | Boolean — **this is the real OZ column** |
| tif_district | 100 | Boolean — Tax Increment Financing district |
| wetlands_present | 100 | Boolean |
| traffic_aadt | 74.6 | 312,442 rows — daily vehicle count |
| school_district | 99.1 | 415,001 rows |
| water_service_area | ~100 | Boolean |
| water_jurisdiction | sparse | |
| sewer_service_area | ~100 | Boolean |
| sewer_jurisdiction | sparse | |
| nearest_road_name | sparse | |
| nearest_road_ft | sparse | |
| nearest_water_ft | sparse | |
| nearest_sewer_ft | sparse | |
| nearest_storm_ft | sparse | |
| overlay_districts | text[] | Array of overlay district codes |
| utility_proximity | jsonb | Full structured utility proximity data |
| centroid | geometry(Point) | Parcel centroid coordinates |
| parcel_geom | geometry(Polygon) | Full parcel polygon |

**Note:** `properties.in_opportunity_zone` = 0% populated. Use `property_gis_profile.opportunity_zone` for OZ flag.

---

## PROPERTY_DETAILS TABLE — 150+ COLUMNS, 951,728 ROWS

Construction, materials, condition, and amenities. Joined 1:1 with properties.

| Column | Pop% | Notes |
|---|---|---|
| construction_type | 83.1 | 792,816 rows |
| exterior_walls | 87.9 | 838,327 rows |
| interior_walls | sparse | |
| foundation | 69.9 | 667,612 rows |
| roof_type | 53.7 | 512,797 rows |
| roof_material | 44.6 | 425,772 rows |
| floor_type | sparse | |
| quality_grade | 3.5 | 33,310 rows — A/B/C/D grade |
| condition | **0%** | Empty |
| garage_type | 67.4 | 643,647 rows |
| garage_area | sparse | |
| parking_spaces | sparse | |
| parking_space_count | sparse | |
| hvac_cooling | 68.8 | 656,735 rows |
| hvac_heating | 90.0 | 858,762 rows |
| hvac_fuel | sparse | |
| has_pool | 100 | Boolean |
| has_elevator | 100 | Boolean — important for CRE |
| has_fireplace | 100 | Boolean |
| has_fire_sprinklers | sparse | |
| fire_resistance_class | sparse | |
| has_loading_platform | sparse | Industrial signal |
| has_overhead_door | sparse | Industrial/warehouse signal |
| sewage_type | sparse | |
| water_source | sparse | |
| view_description | sparse | |
| topography_code | sparse | |
| legal_description | sparse | Full legal description |

Additional amenity flags (all integer 0/1): has_bonus_room, has_cellar, has_exercise_room, has_game_room, has_great_room, has_laundry, has_office, has_deck, has_balcony, has_handicap_access, has_central_vacuum, has_sound_system, has_arbor_pergola, has_lawn_sprinklers, has_golf_course, has_tennis_court, has_sports_court, has_pool_house, has_stable, has_greenhouse, has_barn, has_shed.

Industrial/commercial flags: has_loading_platform, loading_platform_area, has_overhead_door (no pop% data — verify before using in prompts).

---

## BUILDING_PERMITS TABLE — 24 COLUMNS, 4,136,526 ROWS

| Column | Pop% | Notes |
|---|---|---|
| attom_id | 90.2 | 3,729,852 linked to a property |
| unique properties with permits | 51.4% | 491,103 distinct properties |
| permit_type | 98.5 | 4,076,324 rows |
| effective_date | 100 | |
| status | partial | |
| job_value | 24.1 | 998,702 rows; AVG job value $248,664 |
| description | partial | Free text |
| business_name | sparse | Contractor/business |

### Permit type breakdown (top categories):
- Tap permit - commercial: 300,106
- Electrical permit - remodel: 280,114
- Mechanical permit - remodel: 220,068
- Right of way excavation: 212,886
- Plumbing permit - remodel: 189,358
- Electrical permit - new: 182,907
- Plumbing permit - new: 153,511
- Mechanical permit - new: 151,801
- Building permit - remodel: 133,261
- Building permit - new: 126,181

Signal: recent new construction permits = development activity. Recent remodel permits = renovation/improvement signal. High permit density in an area = market momentum.

---

## GIS_INFRASTRUCTURE TABLE — 3,745,083 ROWS

Spatial polygons and lines for Austin's urban infrastructure. JSONB `attributes` column stores feature-specific data.

### unified_group breakdown:
| Group | Count | Signal |
|---|---|---|
| traffic_aadt_txdot | 1,434,238 | Road-level daily vehicle counts |
| parcels | 626,501 | Parcel boundaries (use parcel_boundaries table instead) |
| fire_hydrants | 308,849 | |
| wetlands | 250,520 | Environmental constraint |
| water_lines | 241,124 | Utility availability |
| stormwater_lines | 153,696 | |
| census_block_groups | 132,000 | |
| electric_transmission | 104,488 | High-voltage transmission lines |
| geology | 100,000 | Soil/rock type |
| future_land_use | 79,836 | Austin FLU designations |
| gas_pipelines | 75,886 | |
| wastewater_lines | 49,586 | Sewer availability |
| electric_distribution | 47,952 | Distribution lines |
| traffic_roadways | 35,990 | |
| osm_poi | 35,549 | OpenStreetMap points of interest |
| zoning_districts | 30,648 | Austin zoning polygons — attributes: ZONING_BASE, ZONING_ZTYPE |
| floodplains | 11,468 | FEMA floodplain polygons |
| tif_districts | 11,121 | Tax Increment Financing districts |
| water_service_areas | 8,254 | Service area boundaries |
| rail_yards | 2,676 | Industrial rail access points |
| etj_released | 1,000 | ETJ release areas |
| city_limits | 1,000 | Municipal boundary polygons |
| wastewater_service_areas | 897 | |
| opportunity_zones | 628 | Opportunity zone polygons |
| traffic_aadt | 361 | Alternate AADT source |
| austin_etj | 351 | Austin ETJ boundary |
| electric_substations | 311 | Electrical substations |
| enterprise_zones | 53 | State enterprise zones |
| lift_stations | 40 | Sewer lift stations |
| electric_service_areas | 18 | AE service territory |

---

## PARCEL_ADJACENCY TABLE — 2,417,010 ROWS

| Column | Notes |
|---|---|
| parcel_a | attom_id of first parcel |
| parcel_b | attom_id of adjacent parcel |
| distance_m | distance in meters between parcel centroids |
| touches | boolean — true if parcels share a boundary |

Represents 1.2 million touching parcel pairs. Used for assemblage analysis: given a target parcel, find all adjacent parcels owned by the same entity (same_owner_parcel_count > 1 on properties table) or under separate ownership (acquisition opportunity).

---

## SELF_STORAGE_FACILITIES TABLE — 122 COLUMNS, 4,719 ROWS

Denormalized self-storage enrichment. Mirrors the ATTOM enriched self-storage dataset. Joined to properties via `attomid`.

| Column | Pop% | Notes |
|---|---|---|
| party_owner1_name_full | 100 | |
| area_building | 98.9 | 4,668 rows |
| units_count | 7.3 | 344 rows — sparse |
| year_built | 97.2 | 4,586 rows |
| current_mortgage_amount | 47.9 | 2,260 rows |
| current_lender_name | 48.2 | 2,275 rows |
| is_reit_owned | 100 | Boolean |
| has_foreclosure_history | 100 | Boolean |
| foreclosure_event_count | 100 | |
| last_foreclosure_date | sparse | |
| tax_billed_amount | 87.0 | 4,107 rows |
| deed_last_sale_price | 0.8 | 38 rows — TX non-disclosure |
| tax_market_value_total | 99.7 | 4,706 rows |
| construction | ~98 | Construction type |
| has_overhead_door / has_loading_platform | ~98 | |
| content_overhead_door_flag / storage_building_flag | ~98 | |

---

## LIHTC_PROJECTS TABLE — 281 ROWS

HUD Low Income Housing Tax Credit projects. Spatial table.

| Column | Notes |
|---|---|
| hud_id | HUD project identifier |
| project_name | Project name |
| address / city / state / zip | Full address |
| units_total / units_low_income | Unit counts |
| year_allocated / year_placed | LIHTC program years |
| latitude / longitude / location | Spatial — geometry(Point,4326) |

Used for: identifying competing affordable housing supply near multifamily acquisitions, or identifying LIHTC properties themselves as acquisition targets (value-add or tax credit play).

---

## WHAT THE CURRENT PIPELINE IS MISSING

### 9 enrichment tables ignored entirely:

1. **foreclosure_records** — Active foreclosure status, auction_date, lender, recording_date. 22,114 active foreclosures never surfaced.

2. **current_loans** — first_loan_amount, ltv, available_equity, first_lender_name_last, first_loan_recording_date. 640K properties with LTV. High LTV + distress = motivated seller.

3. **tax_assessments** — tax_amount_billed, tax_delinquent_year, assessed_value_land, assessed_value_improvements. tax_delinquent_year for 6,047 properties is silently null in all pipeline output.

4. **climate_risk** — heat, storm, wildfire, drought, flood scores. flood_chance_future. heat_future_avg. 911K properties covered.

5. **property_valuations** — estimated_rental_value (avg $2,956/mo). Useful for income approach on SFR/small multifamily.

6. **building_permits** — Recent permit activity as development/renovation signal. 491K properties with permit history.

7. **property_gis_profile** — zoning_code (the REAL zoning column), opportunity_zone, fema_flood_zone, tif_district, traffic_aadt, school_district, utility_proximity.

8. **property_details** — construction_type, exterior_walls, roof_type, foundation, quality_grade, has_elevator, has_loading_platform, has_overhead_door.

9. **sales_transactions (aggregate flags)** — transaction_count (velocity), is_foreclosure_auction flag history, grantee_investor_flag pattern (institutionally traded asset), most recent recording_date.

### Additional dead fields being passed to the AI:

- `prop.zoning` — always empty. Real zoning is `property_gis_profile.zoning_code`.
- `prop.owner_since_year` — not in SELECT list (works only if derived from `ownership.ownership_transfer_date`).
- `prop.foreclosure_status` — not in SELECT list, column doesn't exist on properties.
- `prop.tax_delinquent_year` — not in SELECT list, column doesn't exist on properties.

### Missing data not in this database (gaps):

| Gap | Impact | Backfill Source |
|---|---|---|
| HUD FMR (hud_fmr_1br/2br/3br) | Rental affordability context for multifamily | Free HUD data, columns exist, not loaded |
| Market cap rates by asset class | Income approach underwriting | CoStar / CBRE cap rate reports |
| Lease/tenant data | Retail/office/industrial value driver | CoStar |
| Operating expenses | NOI calculation | Not publicly available |
| Submarket vacancy rates | Income approach context | CoStar |
| Clear height / dock doors | Industrial: key value driver | ATTOM property_details sparse |
| NOI / rent rolls | Multifamily income approach | Not public |
| LIHTC expiration dates | Affordable housing opportunity | HUD LIHTC database |
| Environmental phase 1 data | Site-specific contamination risk | Not public |
| Entitlement history | Development potential validation | City records |

---

## COMPUTABLE DERIVATIVES

All of these can be calculated at query time from existing data with no new data sources.

### Financial
- **Equity estimate:** `assessed_value_total - first_loan_amount` (or use `current_loans.available_equity`)
- **LTV ratio:** `current_loans.ltv` (pre-computed, 640K rows)
- **Tax burden rate:** `tax_amount_billed / assessed_value_total * 100`
- **Improvement-to-land ratio:** `properties.improvement_to_land_ratio` (pre-computed, 433K rows) or `assessed_value_improvements / assessed_value_land`
- **Assessed value per acre:** `tax_assessed_value_total / area_lot_acres`
- **Assessed value per SF:** `tax_assessed_value_total / area_building`
- **Gross rent multiplier (GRM):** `assessed_value_total / (estimated_rental_value * 12)` — rough proxy when no actual rent
- **Rent yield estimate:** `estimated_rental_value * 12 / assessed_value_total`
- **Loan age (years):** `EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM first_loan_recording_date)`
- **Months to maturity:** `EXTRACT(MONTH FROM (mortgage_maturity_approx - now()))` — if mortgage_maturity_approx populated

### Hold Period / Seller Pressure
- **Years owned:** `properties.years_owned` (pre-computed, 375K rows) or `EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM ownership.ownership_transfer_date)`
- **Long-hold flag:** `years_owned >= 15`
- **Very long hold flag:** `years_owned >= 25` (estate/generational ownership)
- **Near maturity flag:** `mortgage_maturity_approx BETWEEN now() AND now() + interval '18 months'`
- **Recent acquisition:** `years_owned <= 2` (recent buyer, likely not motivated to sell)

### Distress Composite
- **Multi-signal distress:** `(distress_score > 50) + (tax_delinquent_year IS NOT NULL) + (fr.status = 'Active') + (ltv > 85) + (years_owned > 20)` — count TRUE conditions, max 5
- **Tax delinquency age:** `EXTRACT(YEAR FROM now()) - tax_delinquent_year`
- **Foreclosure time in process:** `EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM fr.foreclosure_recording_date)`

### Income Approach (proxy)
- **Annual rent estimate:** `estimated_rental_value * 12`
- **Gross income at market rent:** `estimated_rental_value * 12 * units_count`
- **Implied cap rate:** `(estimated_rental_value * 12 * units_count * 0.6) / assessed_value_total` — assumes 60% NOI margin
- **Value gap:** `assessed_value_total - (estimated_rental_value * 12 / target_cap_rate)` — requires assumed cap rate

### Development / Land
- **Land value per SF:** `assessed_value_land / area_lot_sf`
- **Improvement coverage ratio:** `area_building / area_lot_sf`
- **Underimproved flag:** `improvement_to_land_ratio < 0.3` — land worth more than structures
- **Assemblage potential score:** `properties.assemblage_score` (pre-computed)
- **Assemblage group acreage:** `properties.assemblable_acreage` (if group_id populated)
- **Adjacent parcel count with same owner:** `properties.same_owner_parcel_count`

### Climate / Risk
- **Composite climate score:** `(heat_risk_score + storm_risk_score + wildfire_risk_score + drought_risk_score + flood_risk_score) / 5`
- **High flood risk flag:** `flood_risk_score >= 50`
- **Future heat delta:** `heat_future_avg - heat_baseline_avg` (in degrees)

### Transaction Velocity
- **Transaction count:** `COUNT(*) FROM sales_transactions WHERE attom_id = X`
- **Recent activity flag:** `MAX(recording_date) > now() - interval '3 years'`
- **Investor-traded flag:** `COUNT(*) FILTER (WHERE grantee_investor_flag = true) > 0`
- **Foreclosure auction history:** `COUNT(*) FILTER (WHERE is_foreclosure_auction = true) > 0`

### Location Context
- **High traffic corridor:** `nearest_road_aadt > 20000`
- **Opportunity zone:** `property_gis_profile.opportunity_zone = true`
- **TIF district:** `property_gis_profile.tif_district = true`
- **Flood risk flag:** `property_gis_profile.fema_flood_zone LIKE 'A%'`

---

## FRONTEND DATA CONTRACT — 13 UI SECTIONS

`SPARSE` = render conditionally (only show if value exists). `ALWAYS` = always render (will have data for most properties).

### Section 1: Property Identity
| Field | Source | Sparse? |
|---|---|---|
| address_full | properties | ALWAYS |
| address_city, state, zip | properties | ALWAYS |
| county_name | properties | ALWAYS |
| resolved_asset_type | properties | SPARSE (47%) |
| parcel_number_formatted | properties | ALWAYS |
| area_lot_acres | properties | ALWAYS |
| area_building | properties | SPARSE (83%) |
| year_built | properties | SPARSE (84%) |
| units_count | properties | SPARSE (20%) |
| zoning_code | property_gis_profile | SPARSE (28% overall, 65% of GIS-enrolled) |
| latitude, longitude | properties | ALWAYS |

### Section 2: Analyst Brief
| Field | Source | Sparse? |
|---|---|---|
| narrative (AI-generated) | narrativeGenerator | ALWAYS |
| distress_signals (array) | derived | ALWAYS (may be empty) |
| match_score | derived | ALWAYS |
| distress_score | properties | SPARSE (46%) |
| seller_motivation_score | properties | SPARSE (46%) |
| development_potential_score | properties | SPARSE (46%) |
| assemblage_score | properties | SPARSE (46%) |

### Section 3: Ownership
| Field | Source | Sparse? |
|---|---|---|
| owner1_name_full | ownership | ALWAYS |
| ownership_type | ownership | SPARSE (40%) |
| entity_type (LLC/Trust/Individual) | ownership.company_flag, trust_flag | ALWAYS |
| trust_description | ownership | SPARSE (21%) |
| is_absentee_owner | ownership | ALWAYS |
| owner_is_out_of_state | properties | SPARSE (46%) |
| mail_address_full + city + state + zip | ownership | ALWAYS |
| ownership_transfer_date | ownership | SPARSE (77%) |
| years_owned (computed) | ownership | SPARSE (77%) |
| vesting_relation_code | ownership | ALWAYS |
| same_owner_parcel_count | properties | SPARSE (4%) |

### Section 4: Financial Picture
| Field | Source | Sparse? |
|---|---|---|
| tax_assessed_value_total | properties | ALWAYS |
| assessed_value_land | tax_assessments | SPARSE (96%) |
| assessed_value_improvements | tax_assessments | SPARSE (84%) |
| market_value_total | tax_assessments | SPARSE (99%) |
| improvement_to_land_ratio | properties | SPARSE (45%) |
| assessed_value_per_acre (computed) | derived | ALWAYS |
| assessed_value_per_sf (computed) | derived | SPARSE (83%) |
| tax_amount_billed (annual) | tax_assessments | SPARSE (89%) |
| tax_burden_rate (computed) | derived | SPARSE (89%) |
| estimated_rental_value | property_valuations | SPARSE (70%) |
| annual_rent_estimate (computed) | derived | SPARSE (70%) |
| zori_rent_index | properties | SPARSE (45%) |
| zori_yoy_change | properties | SPARSE (45%) |

### Section 5: Loans and Equity
| Field | Source | Sparse? |
|---|---|---|
| first_loan_amount | current_loans | SPARSE (56%) |
| first_lender_name (first + last) | current_loans | SPARSE (56%) |
| first_loan_recording_date | current_loans | SPARSE (56%) |
| loan_age_years (computed) | derived | SPARSE (56%) |
| first_mortgage_type | current_loans | SPARSE (5%) |
| second_loan_amount | current_loans | SPARSE (9%) |
| ltv | current_loans | SPARSE (67%) |
| available_equity | current_loans | SPARSE (62%) |
| lendable_equity | current_loans | SPARSE (62%) |
| equity_estimate (computed) | derived | SPARSE (62%) |
| near_maturity_flag (computed) | derived | SPARSE |

### Section 6: Foreclosure
| Field | Source | Sparse? |
|---|---|---|
| foreclosure_status | foreclosure_records | SPARSE (48% have status) |
| foreclosure_recording_date | foreclosure_records | SPARSE |
| record_type | foreclosure_records | SPARSE |
| original_loan_amount | foreclosure_records | SPARSE (28%) |
| default_amount | foreclosure_records | SPARSE |
| lender_name_standardized | foreclosure_records | SPARSE (46%) |
| borrower_name | foreclosure_records | SPARSE (47%) |
| auction_date | foreclosure_records | SPARSE (42%) |
| auction_opening_bid | foreclosure_records | SPARSE |
| estimated_value | foreclosure_records | SPARSE (32%) |
| foreclosure_time_in_process (computed) | derived | SPARSE |

### Section 7: Tax
| Field | Source | Sparse? |
|---|---|---|
| tax_year | tax_assessments | ALWAYS |
| assessed_value_total | tax_assessments | ALWAYS |
| assessed_value_land | tax_assessments | SPARSE (96%) |
| assessed_value_improvements | tax_assessments | SPARSE (84%) |
| tax_amount_billed | tax_assessments | SPARSE (89%) |
| has_homeowner_exemption | tax_assessments | ALWAYS |
| has_senior_exemption | tax_assessments | ALWAYS |
| has_veteran_exemption | tax_assessments | ALWAYS |
| tax_delinquent_year | tax_assessments | SPARSE (0.6%) |
| tax_delinquency_age (computed) | derived | SPARSE |

### Section 8: Sales History
| Field | Source | Sparse? |
|---|---|---|
| transaction_count (computed) | sales_transactions | ALWAYS |
| most_recent_recording_date | sales_transactions | SPARSE (65%) |
| last_sale_price | properties | SPARSE (1.9% — TX non-disclosure) |
| is_foreclosure_auction (any) | sales_transactions | SPARSE |
| is_distressed (any) | sales_transactions | SPARSE |
| investor_traded_flag (computed) | sales_transactions | SPARSE |
| recent_activity_flag (computed) | derived | SPARSE (65%) |
| grantor1_name_full (last seller) | sales_transactions | SPARSE (63%) |
| grantee_owner_type transitions | sales_transactions | SPARSE |

### Section 9: Climate Risk
| Field | Source | Sparse? |
|---|---|---|
| heat_risk_score (1-10) | climate_risk | SPARSE (95%) |
| storm_risk_score | climate_risk | SPARSE (95%) |
| wildfire_risk_score | climate_risk | SPARSE (95%) |
| drought_risk_score | climate_risk | SPARSE (95%) |
| flood_risk_score | climate_risk | SPARSE (95%) |
| total_risk_score | climate_risk | SPARSE (43%) |
| flood_chance_future | climate_risk | SPARSE (95%) |
| heat_future_avg | climate_risk | SPARSE (95%) |
| heat_baseline_avg | climate_risk | SPARSE (95%) |
| fema_flood_zone | property_gis_profile | SPARSE (44%) |
| in_floodplain | property_gis_profile | SPARSE (44%) |
| in_floodway | property_gis_profile | SPARSE (44%) |

### Section 10: Location Context
| Field | Source | Sparse? |
|---|---|---|
| county_name / jurisdiction_name | properties | ALWAYS |
| cbsa_name | properties | ALWAYS |
| census_tract | properties | ALWAYS |
| school_district | properties | SPARSE (43%) |
| in_opportunity_zone | property_gis_profile | SPARSE (44%) |
| tif_district | property_gis_profile | SPARSE (44%) |
| nearest_road_name | properties | SPARSE (33%) |
| nearest_road_aadt | properties | SPARSE (33%) |
| high_traffic_flag (computed) | derived | SPARSE |
| median_hh_income | properties | SPARSE (43%) |
| pct_renter_occupied | properties | SPARSE (43%) |
| median_gross_rent | properties | SPARSE (43%) |
| zori_rent_index | properties | SPARSE (45%) |

### Section 11: Assemblage
| Field | Source | Sparse? |
|---|---|---|
| assemblage_score | properties | SPARSE (46%) |
| same_owner_parcel_count | properties | SPARSE (4%) |
| assemblage_parcel_count | properties | SPARSE |
| assemblable_acreage | properties | SPARSE |
| assemblage_group_id | properties | SPARSE |
| adjacent_parcel_count (computed) | parcel_adjacency | SPARSE |
| adjacent_same_owner_count (computed) | parcel_adjacency + ownership | SPARSE |
| adjacent_owner_names (computed) | parcel_adjacency + ownership | SPARSE |

### Section 12: Development Signals
| Field | Source | Sparse? |
|---|---|---|
| development_potential_score | properties | SPARSE (46%) |
| future_land_use | properties / property_gis_profile | SPARSE (10%) |
| zoning_code | property_gis_profile | SPARSE (28%) |
| in_opportunity_zone | property_gis_profile | SPARSE (44%) |
| tif_district | property_gis_profile | SPARSE (44%) |
| permit_count_5yr (computed) | building_permits | SPARSE |
| last_permit_date (computed) | building_permits | SPARSE |
| last_permit_type (computed) | building_permits | SPARSE |
| last_permit_value (computed) | building_permits | SPARSE |
| new_construction_permit_flag | building_permits | SPARSE |
| wetlands_present | property_gis_profile | SPARSE (44%) |
| improvement_to_land_ratio | properties | SPARSE (45%) |
| underimproved_flag (computed) | derived | SPARSE |

### Section 13: Physical Description
| Field | Source | Sparse? |
|---|---|---|
| construction_type | property_details | SPARSE (83%) |
| exterior_walls | property_details | SPARSE (88%) |
| roof_type | property_details | SPARSE (54%) |
| roof_material | property_details | SPARSE (45%) |
| foundation | property_details | SPARSE (70%) |
| quality_grade | property_details | SPARSE (3.5%) |
| hvac_cooling | property_details | SPARSE (69%) |
| hvac_heating | property_details | SPARSE (90%) |
| has_pool | property_details | ALWAYS |
| has_elevator | property_details | ALWAYS |
| has_fire_sprinklers | property_details | SPARSE |
| has_loading_platform | property_details | SPARSE |
| has_overhead_door | property_details | SPARSE |
| garage_type | property_details | SPARSE (67%) |
| parking_space_count | property_details | SPARSE |

---

## IMMEDIATE ACTION ITEMS

### Fix now (silent data loss):
1. Add `LEFT JOIN foreclosure_records fr ON fr.attom_id = p.attom_id AND fr.status = 'Active'` to `matchProperties()` SQL
2. Add `LEFT JOIN tax_assessments ta ON ta.attom_id = p.attom_id` to `matchProperties()` SQL
3. Add `fr.status, fr.foreclosure_recording_date, fr.auction_date, fr.lender_name_standardized, fr.default_amount` to SELECT list
4. Add `ta.tax_delinquent_year, ta.tax_amount_billed, ta.assessed_value_land, ta.assessed_value_improvements` to SELECT list
5. Fix `deriveDistressSignals()` to reference `prop.fr_status` and `prop.ta_tax_delinquent_year` (or similar aliased columns)
6. Fix `narrativeGenerator.js` to pass `ta_tax_delinquent_year` not `tax_delinquent_year`

### Upgrade AI output quality:
7. Switch `narrativeGenerator.js` model from `claude-haiku-4-5-20251001` to `claude-sonnet-4-6`
8. Increase `max_tokens` from 200 to 600
9. Add asset-class-specific system prompts (land vs multifamily vs industrial vs retail vs self-storage differ significantly)
10. Pass full enriched field set (post bug fixes) to the prompt

### Expand enrichment (add remaining 7 enrichment joins):
11. `LEFT JOIN current_loans cl ON cl.attom_id = p.attom_id`
12. `LEFT JOIN climate_risk cr ON cr.attom_id = p.attom_id`
13. `LEFT JOIN property_valuations pv ON pv.attom_id = p.attom_id` (latest only: ORDER BY valuation_date DESC LIMIT 1)
14. `LEFT JOIN property_gis_profile pgp ON pgp.attom_id = p.attom_id`
15. `LEFT JOIN property_details pd ON pd.attom_id = p.attom_id`
16. Add building permit aggregate subquery: `(SELECT MAX(effective_date), COUNT(*), MAX(job_value) FROM building_permits WHERE attom_id = p.attom_id AND effective_date > now() - interval '5 years') AS permits`
17. Add sales transaction aggregate subquery: `(SELECT COUNT(*), MAX(recording_date), BOOL_OR(is_foreclosure_auction), BOOL_OR(grantee_investor_flag) FROM sales_transactions WHERE attom_id = p.attom_id) AS txns`

### Quick wins (no code change, just data load):
18. Load HUD FMR data into `hud_fmr_1br / 2br / 3br` columns — free data from HUD website, Austin MSA
19. Denormalize `property_gis_profile.opportunity_zone` → `properties.in_opportunity_zone` via single UPDATE

---

## PRIOR AUDIT DOC ERRORS (CORRECTED)

| Claim in PROPERTY_DATA_AUDIT.md | Reality (live DB) |
|---|---|
| property_valuations.estimated_value = 100% AVM values | estimated_value = 0% (completely NULL). Table contains monthly rental estimates, not AVM. |
| property_valuations.confidence_score populated | confidence_score = 0% (completely NULL) |
| ~170K tax-delinquent properties (18% of assessed) | 6,047 rows with tax_delinquent_year (0.6%) |
| Sales price 94% populated in sales_transactions | 2.0% (52,689 of 2.7M rows) — TX non-disclosure |
| Multi-metro Texas coverage | 99.5% Austin-Round Rock MSA only |
| properties.zoning = 25% populated | 0% (completely empty) — use zoning_local (28.5%) or property_gis_profile.zoning_code |
| Foreclosure statuses: Scheduled/Canceled/Sold/Unsold | Actual: Active (22,114), Completed (19,848), NULL (45,884) |
| climate_risk.total_risk_score = 100% | 43.5% (415,847 rows) |
| tax_delinquent_year on properties table | Column does not exist on properties; it's on tax_assessments only |
