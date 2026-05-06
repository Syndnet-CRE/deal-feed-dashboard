# HANDOFF
Date: 2026-05-06
Repo: deal-feed-dashboard + scoutgpt-api
Session objective: Fix invite view 500 error and redesign InviteView
Status: COMPLETE

---

## What was done

### Bug fix — GET /api/dealfeed/invites returning 500

Root cause: `routes/dealfeed/invites.js` SELECT query referenced `invited_at` and `invite_sent_count` columns on `df_subscribers`, but neither column was ever added via migration. The live Neon DB was missing both columns.

Fix:
- `migrations/038_subscriber_invite_columns.sql` — adds both columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `scripts/run_migration_038.py` — ran migration against Neon; both columns confirmed
- No backend code change needed — the existing routes were already correct

Also registered `routes/dealfeed/admin.js` which was written but unregistered in `index.js`.

**scoutgpt-api commit: 30daa3e**

### InviteView design overhaul

Brady's complaint: design was flat and broken (undefined CSS variables made cards transparent with no border).

Fixes to `src/styles/styles.css` (iv-* block):
- Replaced `--surface` → `--panel`, `--border` → `--hairline`, `--bg` → `--panel-2`
- Added green gradient card border via `::before` pseudo-element (matches stat-card pattern)
- Hover: border tint + green glow box-shadow + `translateY(-1px)` lift
- `iv-card-title` replaces flat `iv-label` — green 3px accent bar + eyebrow type
- Textarea now monospaced with focus ring
- Badges upgraded to pill shape with matching border
- All tokens now resolve in both light and dark mode

Updates to `src/views/InviteView.jsx`:
- Header now shows stat chips (In queue / Unsent) on the right when loaded
- Section headings use `iv-card-title` class

**deal-feed-dashboard commit: 259ee03**

---

## What was NOT done

- Snowflake Story 4 (Render Cron Job) — blocked: Brady must identify SNOWFLAKE_AVM_TABLE and configure the cron job
- Snowflake Story 5 (verify AVM values in UI) — blocked: depends on Story 4 live run

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

3. **Test invite view**: Log into Dispatch as brady@parcyl.ai and confirm the Invite Queue page loads without error. The 500 is fixed — the DB migration was applied.
