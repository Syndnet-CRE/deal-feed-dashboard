# HANDOFF
Date: 2026-05-06
Repo: deal-feed-dashboard + scoutgpt-api
Session objective: Complete subscriber invite flow and Snowflake AVM sync (Stories 1-3)
Status: COMPLETE (Stories 1-3 done; Stories 4-5 blocked on Brady)

---

## What was done

### Subscriber Invite Flow (all 4 stories)

**Backend (scoutgpt-api) -- commit 7b73370**
- `migrations/037_invite_tokens.sql` -- creates `df_invite_tokens` table (UUID PK, email, status, expires_at, claimed_by FK). Applied to Neon.
- `routes/dealfeed/auth.js` -- added two new routes:
  - `GET /api/dealfeed/auth/invite/:token` -- validates token (pending + not expired), returns `{ email }`
  - `POST /api/dealfeed/auth/invite/:token/claim` -- full DB transaction: SELECT FOR UPDATE, INSERT subscriber, UPDATE token status to 'claimed', fire sendWelcomeEmail, return JWT
- `routes/dealfeed/invites.js` -- `POST /send` now generates UUID tokens per invitee, builds `/invite/:token` URL, passes to sendInviteEmail
- `lib/inviteEmailer.js` -- CTA button now links to the token-specific claim URL (was hardcoded to dealrunner.netlify.app)

**Frontend (deal-feed-dashboard) -- commit 9166aaa**
- `src/views/InviteClaimView.jsx` -- new view: token validation on mount, state machine (loading/invalid/ready), form (full_name/password/confirm), claim submission, login-on-success
- `src/App.jsx` -- added `/invite/:token` route

### Snowflake AVM Sync (Stories 1-3)

**Story 1 -- Schema check (scoutgpt-api)**
- Verified `property_valuations` has all required columns: `estimated_value`, `estimated_min_value`, `estimated_max_value`, `confidence_score`
- PK is `(attom_id, valuation_date)` composite -- no migration needed

**Stories 2-3 -- Scripts + tests (scoutgpt-api) -- commit 9b11faa**
- `scripts/snowflake-sync/lib/snowflake.js` -- Promise-based wrapper around snowflake-sdk; validates 6 env vars at module load; connect -> execute -> destroy per invocation; uses PROGRAMMATIC_ACCESS_TOKEN auth
- `scripts/snowflake-sync/avm-sync.js` -- main entry point; validates 8 env vars; `--dry-run` flag; queries Snowflake via `SNOWFLAKE_AVM_TABLE` env var; upserts to Neon in batches of 1000 using `ON CONFLICT (attom_id, valuation_date)` with CURRENT_DATE
- `scripts/snowflake-sync/__tests__/snowflake.test.js` -- 12 tests (mocked snowflake-sdk)
- `scripts/snowflake-sync/__tests__/avm-sync.test.js` -- 15 tests (mocked sfQuery + poolWrite)
- `.env.example` -- added 7 Snowflake vars including SNOWFLAKE_AVM_TABLE

---

## What was NOT done

- **Snowflake Story 4** (Render Cron Job) -- blocked: Brady must identify SNOWFLAKE_AVM_TABLE and configure the cron job
- **Snowflake Story 5** (verify AVM values in UI) -- blocked: depends on Story 4 live run
- **buy-box-wizard** -- shipped as-is (ConfigurationOverlay is functionally complete)

---

## Next session

Configure Render Cron Job for AVM sync and verify values flow to the UI.

```bash
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```

---

## Blockers for Brady

1. **SNOWFLAKE_AVM_TABLE**: Find the table name by running this in Snowflake: `SHOW TABLES IN SCHEMA ATTOM_SYNDNET_SHARE.DELIVERY;` Look for a table with AVM or valuation in the name. Add as `SNOWFLAKE_AVM_TABLE` env var to Render (scoutgpt-api service).

2. **Render Cron Job**: After env var is set, create a Cron Job in Render:
   - Command: `node scripts/snowflake-sync/avm-sync.js`
   - Schedule: `0 3 * * *`
   - Env: same group as scoutgpt-api service
   - Test first with `--dry-run` flag

3. **Test invite flow**: Log into Dispatch as brady@parcyl.ai, go to Invites, add a test email, hit Send. The invite email should arrive with a `/invite/:token` link. Click it to verify the claim form loads.
