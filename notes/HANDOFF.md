# HANDOFF
Date: 2026-05-09
Repo: deal-feed-dashboard + scoutgpt-api
Session objective: Full Nightdrop dashboard redesign sprint — feed layout, agent chat, kanban buy boxes
Status: COMPLETE

## What was done

### Frontend (deal-feed-dashboard) — commit 1a32175

New components:
- src/components/TopHeader.jsx — fixed header with Nightdrop wordmark, search, 2am countdown timer
- src/components/LeftPanel.jsx — collapsible sidebar (240px/60px), nav, stats, buy boxes, run history chart
- src/components/ScoreBadge.jsx — pill badge, green/amber/red by score (8+/5-7/<5)
- src/components/OverflowMenu.jsx — card overflow menu (save, share, hide, report)
- src/components/RightRail.jsx — mini DealMap + buy box health cards
- src/components/feed/FeedDealCard.jsx — social-feed deal card with aerial, narrative, facts, reactions, accordion
- src/components/feed/AgentMessageCard.jsx — agent message display (RUN/SIGNAL/MARKET/AGENT types)
- src/components/feed/TonightsRunCard.jsx — pinned tonight's run summary card
- src/components/feed/MessageInputBar.jsx — chat input, calls POST /api/dealfeed/agent/message
- src/styles/feed-layout.css — all new component styles (~500 lines)

Modified:
- src/App.jsx — replaced NightdropBar with TopHeader + LeftPanel, `has-sidebar` layout, KPI fetch
- src/views/DashboardView.jsx — rewritten for social feed layout with PipelineTimeline, RightRail
- src/views/BuyBoxesView.jsx — rewritten as 5-column Kanban with drag-and-drop + day schedule toggles
- src/lib/format.js — fixed scoreClass thresholds (8+/5-7/<5 on 0-10 scale, was 80/60 on 0-100)
- src/styles/tokens.css — layout CSS vars + dark mode overrides
- src/index.css — imported feed-layout.css and admin.css

### Backend (scoutgpt-api) — commit 34511db

New:
- migrations/043_agent_messages.sql — df_agent_messages table (chat persistence)
- migrations/044_deal_saved.sql — saved_at column on df_deals_sent
- routes/dealfeed/agent.js — GET /messages + POST /message (Claude Sonnet claude-sonnet-4-6)

Modified:
- routes/dealfeed/deals.js — PATCH /:id/save, saved field in normalizeDeal, unread_count in KPIs
- routes/dealfeed/index.js — registered /agent route

Both repos pushed to main. Netlify + Render deploying.

## Post-launch fixes applied (2026-05-09 evening)

After the redesign deploy, login worked but the feed center column showed only horizontal lines instead of cards. Root cause + fixes:

- **Layout bug (commit 3f255cf):** `.feed-center` is a flex-column with `overflow-y:auto`. Default `flex-shrink:1` was crushing 170+ deal cards down to ~20px slivers showing only borders. Fix: `flex-shrink:0` on `.feed-center > *` and `.feed-deal-card`, plus `min-height: 220px` on `.feed-deal-image-wrap`. Single CSS file change.
- **Asset class lookup (same commit):** `'Self Storage / Mini-Warehouse'` did not match `QUICK_FACTS_CONFIG['self_storage']` because of the `/` and trailing words. Added `normalizeAssetClass()` in FeedDealCard that recognizes substrings like 'self storage', 'multifamily', 'industrial', 'land', 'retail'.
- **GMaps key (same commit):** Image src had empty `key=`, causing 403s on every card. Now reads `VITE_GOOGLE_MAPS_KEY`; if absent, the `<img>` is omitted and a styled green-tinted placeholder fills the 220px slot.
- **Silent API errors (same commit):** Added `console.error()` in DealsContext fetchAll catch so future regressions are visible.
- **Empty narratives in pipeline (commit be21724 in scoutgpt-api):** The deal-feed pipeline was writing `narrative: ''` for every deal — there is no AI brief generation step yet (the spec called for Claude Sonnet but it was never wired). Added `composeFallbackNarrative(prop)` to `run_deal_feed.js` that builds a deterministic 2-3 sentence narrative from parcel data. Marked `TODO(brief-ai)` so a future sprint can swap it for the real Sonnet pipeline. Also added `deriveDistressSignals(prop)` so cards show distress pills.
- **Backfill (commit be21724):** Ran `scripts/backfill_brief_narratives.js --force` against prod — 358 already-sent deals rewritten with composed narratives so the user sees content immediately, not just on tomorrow's run.

## Login 500 — schema/code drift fix (2026-05-09 evening, second pass)

Login was returning 500 because `routes/dealfeed/auth.js` SELECTed `failed_login_attempts` and `locked_until` from `df_subscribers`, but no migration ever created those columns. Same bug existed in forgot/reset-password handlers for `reset_token_hash` / `reset_token_expires_at`.

Fixed in scoutgpt-api commits:
- `61a2d15` — login handler now lazy-detects whether lockout columns exist (one-time information_schema check, cached in module scope) and builds the SELECT/UPDATE dynamically. Migration 045 added but not yet applied (Neon control-plane was rate-limiting from local IP). Login works regardless.
- `10cd774` — forgot/reset-password handlers got the same defensive treatment. New hookify rule `.claude/hookify.column-existence-check.local.md` codifies the two-layer pattern (migration + lazy-detect) so this class of bug can't recur.

To apply migration 045 (unblocks brute-force lockout + password reset features) once Neon recovers:
```
# On Render shell for scoutgpt-app:
psql $DATABASE_WRITE_URL -f migrations/045_subscriber_login_security.sql
```
Or locally:
```
cd ~/parcyl/scoutgpt-api && node -e "require('dotenv').config(); const {Client}=require('pg'); const fs=require('fs'); const c=new Client({connectionString:process.env.DATABASE_WRITE_URL,ssl:{rejectUnauthorized:false}}); c.connect().then(()=>c.query(fs.readFileSync('migrations/045_subscriber_login_security.sql','utf8'))).then(()=>{console.log('applied');c.end();})"
```

## Blockers for Brady

1. Run migrations on Render Postgres manually:
   ```
   psql $DATABASE_URL -f migrations/043_agent_messages.sql
   psql $DATABASE_URL -f migrations/044_deal_saved.sql
   ```
   Or trigger via the Render shell if direct psql access is not available.

2. Verify ANTHROPIC_API_KEY is set in Render env vars — agent/message endpoint requires it.

3. Test the Kanban drag-and-drop on nightdropai.netlify.app (buy boxes view) — patchBuyBox PATCH call needs backend to accept status string from KanbanCard.

4. Calendar view currently falls through to DashboardView — wire date-filtering logic next session if needed.

5. Admin / invites views: old NightdropBar avatar dropdown accessed these. Now they need to be wired from the LeftPanel bottom Account button — deferred.

6. Existing blockers from prior session:
   - Ask Adam: apply ETL enrichment on Render Neon branch (resolved_asset_type null in prod)
   - Test Admin "Run Now" button on deployed Netlify

## Next session

Wire calendar date filtering in DashboardView, add admin/invites routing from LeftPanel account button, run migrations on Render.

  cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
