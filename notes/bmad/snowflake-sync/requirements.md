# Requirements — Snowflake AVM Sync
Date: 2026-05-03
Author: Analyst phase

## Source of Truth
Brady's spec (verbal, 2026-05-03) + gap analysis at:
- ~/parcyl/notes/gap-analysis-20260503.md (full gap audit)
- ~/parcyl/scoutgpt-api/migrations/018_dealfeed.sql (property_valuations schema)
- Gap analysis Priority 5: AVM Values

---

## Current State (from gap analysis)

`property_valuations.estimated_value` = 0% filled across all 956K properties.
`property_valuations.estimated_rental_value` = 100% filled (667,820 rows).

The rental value is populated, which confirms the ETL pipeline architecture
works. The AVM model (estimated_value) was never triggered.

Every underwriting query that asks "what is this property worth?" returns null.
This is the highest-impact missing data field for the deal feed product.

Gap analysis says: "Check Snowflake for ATTOM AVM data in our current
subscription. If available: ETL to populate estimated_value,
estimated_min_value, estimated_max_value, confidence_score."

Brady said: build a script (ETL approach, not live query adapter).

---

## R1 — ETL Approach (Scheduled Pull)

A Node.js script runs on a schedule, queries Snowflake for AVM values,
and writes them to Neon Postgres via the existing `poolWrite` pattern.

Do NOT query Snowflake at request time. Latency and connection overhead make
live queries unsuitable for an API that answers in <500ms.

---

## R2 — Snowflake Scope (First Pass)

First pass targets one data category: ATTOM AVM values.

Target fields to populate in `property_valuations`:
- `estimated_value`
- `estimated_min_value`
- `estimated_max_value`
- `confidence_score`

Join key: `attom_id` (present on Neon properties table; must be confirmed as
the matching key on the Snowflake ATTOM table before implementation begins).

Snowflake source table: exact name requires credential verification by Brady.
Placeholder assumption: `ATTOM_DB.ATTOM_SCHEMA.property_valuations` or
`ATTOM_DB.ATTOM_SCHEMA.avm`.

---

## R3 — Script Location and Scheduling

Script lives in `scripts/snowflake-sync/` inside `~/parcyl/scoutgpt-api`.

Scheduler: Render Cron Job (already available — no new infra needed).
Schedule: nightly at 03:00 UTC (after deal feed runs at 02:00 UTC).

The script must be invokable manually:
  `node scripts/snowflake-sync/avm-sync.js`
without side effects beyond writing to Neon.

---

## R4 — Incremental vs. Full Refresh

First pass: full refresh (upsert all matched attom_ids on every run).
Upsert pattern: `INSERT ... ON CONFLICT (attom_id) DO UPDATE SET ...`
so partial or repeated runs are safe.

property_valuations rows may not exist for all attom_ids. Script must handle
INSERT for new rows and UPDATE for existing rows via upsert.

---

## R5 — Failure Visibility

The script must:
- Log start time, row count pulled from Snowflake, row count upserted to Neon
- Log any Snowflake or Postgres errors to stderr with full error details
- Exit with code 1 on failure (so Render marks the cron job as failed)
- Log a WARNING (not an error) if Snowflake returns 0 rows — likely a config
  problem, not a valid empty result

Console output captured by Render logs is sufficient for v1. No run_log table
in Neon is required.

---

## R6 — Credentials

All via env vars. Never hardcoded.

Required env vars:
- `SNOWFLAKE_ACCOUNT` — account identifier (e.g., `xy12345.us-east-1`)
- `SNOWFLAKE_USER`
- `SNOWFLAKE_PASSWORD`
- `SNOWFLAKE_WAREHOUSE`
- `SNOWFLAKE_DATABASE`
- `SNOWFLAKE_SCHEMA`

Brady must provide these before the script can be tested end-to-end.
Implementation uses a `--dry-run` flag that connects to Snowflake and logs
the row count it would write, but skips the Neon upsert.

---

## R7 — Connector Choice

Use `snowflake-sdk` (official Snowflake Node.js connector, npm package).
Do not use Python — the backend is Node.js and a single-language codebase is
easier to maintain.

---

## R8 — What Is Out of Scope for v1

- Sync for any fields other than the AVM value family
- Jurisdiction/ETJ data sync from Snowflake
- Lender name enrichment
- Real-time fallback query to Snowflake when Neon has null
- Admin dashboard showing sync history or status
- Automated retry logic (Render re-triggers failed cron jobs on next schedule)
