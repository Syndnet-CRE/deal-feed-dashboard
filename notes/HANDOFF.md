# HANDOFF
Date: 2026-05-06
Repo: scoutgpt-api
Session objective: Diagnose and fix deal feed delivering zero deals to all subscribers
Status: COMPLETE

---

## What was done

### Root cause fix — deal feed silent zero delivery

Root cause: `run_deal_feed.js` arg parsing bug. `args[args.indexOf('--email') + 1]` returns `args[0]` when `--email` is absent (indexOf = -1). When admin "Run Now" fires with `['--all', '--limit', '20']`, emailArg was set to `'--all'`. `getSubscribers('--all')` ran `WHERE email = '--all'`, found 0 subscribers, exited cleanly. Every run delivered zero deals.

Fixes committed as `dba7e7a` on scoutgpt-api main:

- `scripts/run_deal_feed.js` — safe emailArg/limitArg parsing with idx !== -1 guard; also added geo_cities, geo_zips, geo_radius_* to matchProperties (prior uncommitted work); value_min/max, absentee_only, distress_only filters; switched inline `new Pool()` to `poolWrite` from db/pool module
- `routes/dealfeed/admin.js` — removed spurious `--all` flag from trigger spawn args
- `workers/dealFeedScheduler.js` — NEW: daily 9am UTC auto-scheduler, zero dependencies, spawns script as child process (same pattern as admin trigger)
- `server.js` — wires `dealFeedScheduler.start()` in startup async block

### Hook rules created (deal-feed-dashboard local)

3 project-local hookify rules to prevent regression:
- `.claude/hookify.wizard-matcher-drift.local.md` — warns when wizard/matcher geo contract drifts
- `.claude/hookify.silent-zero-results.local.md` — warns when run_deal_feed.js is edited without zero-result observability
- `.claude/hookify.unregistered-routes.local.md` — warns when new route files are created

### Weekly autonomous improvement loop

- `.github/workflows/claude-weekly-improve.yml` — Mondays 9:03 UTC, runs `/evolve` + `/harness-audit` + codebase scan, commits report to `notes/WEEKLY_IMPROVEMENT.md`

---

## What was NOT done

- Snowflake Render Cron Job (from prior session) — still blocked on Brady configuring env vars
- Live end-to-end test of deal delivery — Brady must trigger Run Now and verify in Render logs

---

## Next session

Verify deal delivery works end-to-end, then continue site-analysis-report Story B1 (migrations 037+038) or Snowflake cron job if Brady unblocks it.

```bash
cd ~/parcyl/scoutgpt-api && claude --dangerously-skip-permissions
```

---

## Blockers for Brady

1. **Run Now test**: Go to Admin view in the deal feed app → click "Run Now". Check Render logs for `[deal-feed-cron]` output. Should see `N new deals delivered` not "No subscribers found."

2. **GitHub secret for weekly loop**: Repo Settings → Secrets and Variables → Actions → New repository secret → Name: `ANTHROPIC_API_KEY`. Without this, the Monday workflow will fail.

3. **Snowflake (from prior session)**: Find AVM table name in Snowflake: `SHOW TABLES IN SCHEMA ATTOM_SYNDNET_SHARE.DELIVERY;` — add as `SNOWFLAKE_AVM_TABLE` env var to Render scoutgpt-api service.
