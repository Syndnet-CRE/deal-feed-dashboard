# Stories — Snowflake AVM Sync
Date: 2026-05-03
Author: SM phase
Requires: architecture.md (complete)

Max 2 hours per story. Implement in order. Each story requires passing tests
before marked complete.

BLOCKER: Brady must provide Snowflake credentials and confirm the AVM table
name before Story 3 can complete end-to-end. Stories 1 and 2 can proceed
without credentials.

---

## Story 1 — Schema verification and migration if needed
Estimate: 45 min
Repo: scoutgpt-api

Tasks:
- Run against Neon to verify property_valuations schema:
  - Check columns: estimated_value, estimated_min_value, estimated_max_value,
    confidence_score
  - Check UNIQUE constraint on attom_id
- If columns missing: write migration to add them
- If unique constraint missing: write migration to add it
- If all present: document finding, no migration needed

Test: schema query confirms expected columns and unique constraint exist.
No application code unless migration is required.

---

## Story 2 — Snowflake connection wrapper
Estimate: 1 hour
Repo: scoutgpt-api

Tasks:
- `npm install snowflake-sdk`
- Create `scripts/snowflake-sync/lib/snowflake.js`:
  - Promise-based `query(sql, binds)` function
  - Validates all 6 SNOWFLAKE_* env vars at module load; throws if any missing
  - connect → execute → return rows → destroy connection per invocation
- Add 6 Snowflake vars to `.env.example`

Test file: `scripts/snowflake-sync/lib/snowflake.test.js` (mocked snowflake-sdk)
- Throws when any required env var is missing
- Calls snowflake-sdk createConnection with correct params
- Returns rows from successful query
- Rejects on connection error

Agents: tdd-guide before coding; code-reviewer after
Note: all tests use mocked snowflake-sdk — no live credentials needed.

---

## Story 3 — AVM sync main script with dry-run support
Estimate: 1.5 hours
Repo: scoutgpt-api
Requires: Brady's Snowflake credentials and table name confirmation

Tasks:
- Create `scripts/snowflake-sync/avm-sync.js`:
  - Validate required env vars at startup (SNOWFLAKE_* + DATABASE_URL); exit 1 if missing
  - Parse `--dry-run` flag from process.argv
  - Query Snowflake for attom_id + 4 AVM fields
  - Log row count from Snowflake; if 0, log WARNING and exit 0
  - Dry-run: log "would upsert N rows" and exit 0
  - Live: upsert to property_valuations in batches of 1000 using poolWrite
  - Log rows upserted and total runtime; exit 0
  - On any unhandled error: log to stderr, exit 1

Test file: `scripts/snowflake-sync/avm-sync.test.js` (mocked dependencies)
- Exits 1 when required env var missing
- Dry-run: queries Snowflake, does NOT call poolWrite
- Live mode: calls poolWrite upsert with correct SQL
- Batches correctly for large row counts
- Warns and exits 0 when Snowflake returns 0 rows
- Exits 1 on Snowflake connection error

Agents: tdd-guide before coding; code-reviewer + security-reviewer after

---

## Story 4 — Render Cron Job configuration and first live run
Estimate: 30 min
Repo: Render dashboard (no code changes)

Tasks:
- Brady adds Snowflake env vars to Render environment
- Create Render Cron Job:
  - Command: `node scripts/snowflake-sync/avm-sync.js`
  - Schedule: `0 3 * * *` (03:00 UTC)
  - Environment: same env group as scoutgpt-api service
- Trigger manual run; verify exit 0 in Render logs
- Confirm logs show non-zero row counts

Test: Render shows successful run with rows upserted > 0.

Blocker for Brady: must add Snowflake env vars in Render dashboard before
this story can be tested.

---

## Story 5 — Verify AVM values appear in deal feed UI
Estimate: 30 min
Repo: scoutgpt-api + deal-feed-dashboard

Tasks:
- Query Neon: confirm estimated_value is non-null for at least some properties
- Open PropertyDetail for one of those properties in the browser
- Verify estimated_value renders as a dollar amount (not as a dash)
- If still showing dash: check routes/dealfeed/deals.js SELECT includes the
  field; add if missing and push

Test: at least one deal in the live UI shows a non-null estimated value.
No new code expected unless the field is absent from the deals query.

---

## Per-Story Checklist

Before each story:
- [ ] tdd-guide agent (Stories 2-3)
- [ ] Write tests first (RED), then implement (GREEN)

After each story:
- [ ] code-reviewer agent
- [ ] security-reviewer on Story 3 (credentials handling)
- [ ] /quality-gate before commit
- [ ] Push to main

---

## Blockers for Brady

Before Story 3 end-to-end test:
1. SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD,
   SNOWFLAKE_WAREHOUSE, SNOWFLAKE_DATABASE, SNOWFLAKE_SCHEMA values
2. Exact Snowflake table name for ATTOM AVM data
3. Confirmation that attom_id is the correct join key

Before Story 4:
4. Add those env vars to Render dashboard for scoutgpt-api service
