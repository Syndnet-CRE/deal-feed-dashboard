# Architecture — Snowflake AVM Sync
Date: 2026-05-03
Author: Architect phase
Requires: PRD.md (complete)

---

## System Overview

A standalone Node.js script runs as a Render Cron Job. It connects to
Snowflake, pulls ATTOM AVM values, and upserts them into Neon Postgres using
the existing `poolWrite` connection. No changes to the API request path.

```
Render Cron (03:00 UTC)
  → scripts/snowflake-sync/avm-sync.js
      → lib/snowflake.js (Snowflake query)
      → poolWrite (Neon upsert)
      → stdout log (captured by Render)
```

---

## Directory Structure

```
scoutgpt-api/
  scripts/
    snowflake-sync/
      avm-sync.js          — entry point; orchestrates fetch + upsert
      lib/
        snowflake.js       — Snowflake connection and query wrapper
```

---

## snowflake.js — Connection Wrapper

Wraps `snowflake-sdk` to expose a promise-based query interface.

Pseudocode (not final code):
```
createConnection() using 6 env vars
query(sql, binds) → connect → execute → return rows → destroy
```

Connection is created fresh per script run (cron job, not a long-lived server).
No connection pooling needed.

---

## avm-sync.js — Main Entry Point

Supports `--dry-run` flag: skips the Neon upsert, logs what would be written.

Flow:
1. Validate all required env vars — exit 1 with clear message if any missing
2. Log start time and mode (live vs. dry-run)
3. `snowflake.query(AVM_QUERY)` — pull attom_id + 4 AVM fields
4. If 0 rows from Snowflake: log WARNING, exit 0 (suspicious but not fatal)
5. If `--dry-run`: log count and exit 0
6. Batch upsert into `property_valuations` via poolWrite (batches of 1000)
7. Log rows upserted and total runtime; exit 0

On any unhandled error: log to stderr, exit 1.

---

## Snowflake Query Template

Exact table/column names depend on Brady's confirmation:

```sql
SELECT
  attom_id,
  estimated_value,
  estimated_min_value,
  estimated_max_value,
  confidence_score
FROM [SNOWFLAKE_TABLE]
WHERE attom_id IS NOT NULL
  AND estimated_value IS NOT NULL
```

Brady must provide: table name, column names, join key confirmation.

---

## Neon Upsert Pattern

```sql
INSERT INTO property_valuations
  (attom_id, estimated_value, estimated_min_value, estimated_max_value,
   confidence_score, updated_at)
VALUES ($1, $2, $3, $4, $5, now())
ON CONFLICT (attom_id)
DO UPDATE SET
  estimated_value     = EXCLUDED.estimated_value,
  estimated_min_value = EXCLUDED.estimated_min_value,
  estimated_max_value = EXCLUDED.estimated_max_value,
  confidence_score    = EXCLUDED.confidence_score,
  updated_at          = now()
```

Prerequisite: `property_valuations` must have a UNIQUE constraint on `attom_id`.
Verify before story 1:
```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'property_valuations'::regclass AND contype = 'u';
```
If missing, add migration `031_property_valuations_unique_attom.sql`.

---

## Env Var Validation

Script validates at startup before any connection attempt:

```
SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD,
SNOWFLAKE_WAREHOUSE, SNOWFLAKE_DATABASE, SNOWFLAKE_SCHEMA,
DATABASE_URL
```

Missing any → stderr message + exit 1.

---

## Render Cron Job

- Command: `node scripts/snowflake-sync/avm-sync.js`
- Schedule: `0 3 * * *` (03:00 UTC — after deal feed at 02:00 UTC)
- Env: same vars as main scoutgpt-api service
- Non-zero exit → Render marks job failed, visible in dashboard

---

## Frontend Impact

None from the sync script. Once Neon has data, the existing deal API returns
`estimated_value` in `brief_json`. `format.js` `fmtMoney()` already handles
null → `—`. Verify the field flows through `routes/dealfeed/deals.js` SELECT.
If missing from that query, add it — no view changes needed.

---

## File Change Summary

### scoutgpt-api
- `scripts/snowflake-sync/avm-sync.js` — new (~80 lines)
- `scripts/snowflake-sync/lib/snowflake.js` — new (~50 lines)
- `package.json` — add `snowflake-sdk`
- `migrations/031_...sql` — only if unique constraint missing
- `.env.example` — add 6 Snowflake vars

### Render
- New Cron Job (manual config in dashboard)

### nightdrop-dashboard
- No changes required

---

## Build Order

1. Verify `property_valuations` schema; write migration if needed
2. `npm install snowflake-sdk`
3. `lib/snowflake.js`
4. `avm-sync.js` with dry-run support
5. Brady provides Snowflake creds; dry-run test locally
6. Deploy to Render; configure Cron Job
7. Verify fill rate after first live run
