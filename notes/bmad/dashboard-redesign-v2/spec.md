# Dashboard Redesign v2 — Option B

**Date:** 2026-05-09
**Scope:** Slim the pipeline timeline + Facebook-style left-panel metric tiles + per-deal inline chat + post-mortem polish.

## Problem

The "Buy Box Submission Closes In" container is ~280px tall, full-width, and eats the dashboard viewport. Below it the user can only see ~1.5 deal cards before the chat input. Stats column is wasted as four thin text rows. There's only one global "Ask Nightdrop" composer; users can't have a conversation about a specific deal in context.

## Solution (Option B)

### Layout changes
- **Pipeline timeline** collapses to a thin horizontal band (~110px total). No big container chrome. Countdown row removed from the timeline entirely. Track + nodes + phase pill stay (still animated).
- **Top header countdown** removed (was redundant with the timeline countdown).
- **Left panel** gets a prominent "Next Run In" countdown tile at top of the stats area.
- **Left panel stats** convert from four thin rows to a 2x2 metric tile grid with icons: New This Week, Hot Deals, Response Rate, Awaiting.
- **Center feed** gains all the recovered vertical space.

### Per-deal chat
- Each `FeedDealCard` gets a "Discuss" toggle. When opened, shows an inline chat thread scoped to that deal.
- POSTs to existing `/api/dealfeed/agent/message` with `deal_id` (backend already supports this; agent picks up deal context server-side via brief_json).
- History fetched on first open via `GET /api/dealfeed/agent/messages` then filtered client-side by `deal_id`.

### Feed filter chips
- Above TonightsRunCard: chips for `All / Unread / Saved / Hot`.
- Wires to existing read state, `saved` field, and `feedback === 'hot'`.

### Post-mortem additions
- `MarketNewsfeed` placed in right rail below Buy Box Health (it existed but was unmounted).
- Empty-state polish for new subscribers (no deals yet).
- Read/unread visual already implemented on `FeedDealCard` — verified.

## Files touched

Frontend:
- `src/components/PipelineTimeline.jsx` — strip top countdown row, slim track region
- `src/styles/styles.css` — `.pipeline-timeline` padding/margin tightening
- `src/components/TopHeader.jsx` — remove countdown block
- `src/components/LeftPanel.jsx` — add countdown tile + metric tile grid
- `src/styles/feed-layout.css` — countdown tile, metric grid, filter chips, per-deal chat styles
- `src/views/DashboardView.jsx` — filter chips above feed, filter logic
- `src/components/feed/FeedDealCard.jsx` — per-deal chat panel
- `src/components/feed/DealChatThread.jsx` — new component
- `src/components/RightRail.jsx` — mount MarketNewsfeed

No backend changes required.

## Out of scope (deferred to next sprint)

- Saved deals dedicated view (use Saved filter chip for now)
- Buy box health → fix-action linking
- Comp deals shown inline on cards
- Peer activity / social signals
- Quick-action buttons (call owner, schedule tour) on cards
- Filter by buy box on dashboard feed (Map view has it)

## Definition of done

1. Pipeline timeline is ≤ ~110px tall, no big container, animations preserved.
2. Countdown lives in left panel as a tile. No countdown in TopHeader.
3. Stats display as 2x2 metric tile grid in left panel.
4. Filter chips visible above feed; All/Unread/Saved/Hot all work.
5. "Discuss" toggle on each deal card opens an inline chat thread that posts with deal_id.
6. MarketNewsfeed visible in right rail.
7. localhost screenshot confirms feed cards visible and scroll works.
8. `npm run build` passes clean.
9. Committed + pushed; Netlify auto-deploys.
