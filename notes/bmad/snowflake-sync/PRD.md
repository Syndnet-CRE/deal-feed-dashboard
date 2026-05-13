# PRD — Snowflake AVM Sync
Date: 2026-05-03
Author: PM phase
Requires: requirements.md (complete)

---

## Problem

Every deal in the feed has a null estimated_value field. Underwriting queries
return nothing useful. The gap analysis confirms 0% of 956K properties have
AVM data in Neon, while the rental value field (same table, same pipeline) is
100% populated — meaning the plumbing works, just the AVM source was never
connected.

Snowflake likely has ATTOM AVM values in our subscription. This PRD scopes
the work to verify that and build a nightly sync if confirmed.

---

## Goal

`estimated_value` is populated for the majority of Travis County properties
and visible in the deal feed, on a repeatable nightly schedule.

---

## Success Metrics

- `estimated_value` fill rate above 70% for Travis County properties after first sync
- Sync runs nightly without manual intervention
- A failed sync exits with code 1, visible in Render logs
- Brady can trigger a manual sync with one command

---

## Non-Goals

- Live Snowflake queries at API request time
- Syncing any field other than the AVM value family in v1
- Admin UI showing sync history
- Automated retry logic beyond what Render provides

---

## Blocker

Brady must confirm before end-to-end testing:
1. Snowflake credentials (account, user, password, warehouse, database, schema)
2. Exact Snowflake table name for ATTOM AVM data
3. That `attom_id` is the join key (or the correct key if different)

Implementation proceeds to dry-run mode without credentials.

---

## User Stories

### US-1 — Nightly sync populates AVM values

As a system operator, the sync runs nightly and upserts estimated_value,
estimated_min_value, estimated_max_value, and confidence_score from Snowflake
into Neon for all matched properties.

Acceptance criteria:
- Script exits 0 on success, 1 on error
- Logs show: rows pulled from Snowflake, rows upserted to Neon, runtime
- After a successful run, any Travis property with a valid attom_id returns a
  non-null estimated_value from the API

### US-2 — Manual trigger and dry-run

As Brady, I can run `node scripts/snowflake-sync/avm-sync.js` to trigger a
sync, or add `--dry-run` to see what would be written without touching Neon.

Acceptance criteria:
- `--dry-run` logs row count from Snowflake and exits 0 without writing to Neon
- Normal run completes and logs upserted row count

### US-3 — Deal feed reflects AVM values

As a subscriber, estimated_value appears in the deal detail where it previously
showed `—`.

Acceptance criteria:
- PropertyDetail.jsx renders a dollar value where AVM data now exists
- No frontend code changes required if the API already returns the field

---

## Scope

### Backend (scoutgpt-api)

New directory: `scripts/snowflake-sync/`
New files:
- `scripts/snowflake-sync/avm-sync.js` — main entry point
- `scripts/snowflake-sync/lib/snowflake.js` — connection/query wrapper

New npm dependency: `snowflake-sdk`

Render Cron Job: `node scripts/snowflake-sync/avm-sync.js` at `0 3 * * *`

New env vars: `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PASSWORD`,
`SNOWFLAKE_WAREHOUSE`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`

No DB migration needed if `estimated_value` columns already exist in
`property_valuations`. Migration required only if columns are missing.

### Frontend (nightdrop-dashboard)

No new routes or views. Verify PropertyDetail.jsx renders `estimated_value`
from the existing `brief_json` structure. If so, no frontend work needed.

---

## Open Questions (Resolved)

1. Live query vs. ETL?
   Resolution: ETL (scheduled pull). Brady confirmed "script" approach.

2. What connector?
   Resolution: `snowflake-sdk` (Node.js). Backend is Node.js.

3. What schedule?
   Resolution: 03:00 UTC daily via Render Cron Job (after deal feed at 02:00 UTC).
