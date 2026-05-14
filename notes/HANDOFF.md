HANDOFF
Date: 2026-05-14
Repo: nightdrop-dashboard
Session objective: Pipeline telemetry live ticks + week-tab notification badges + mini calendar
Status: COMPLETE (Phase 1 frontend) — pushed to main

---

## Commits this session

**433fa16** — feat(pipeline): 15-min SUBMITTED/BOXES ticks, BRIEFS derived from queue
- getSimulatedBoxCount: hourly → 15-min buckets (0–7 per interval, seed-driven)
- getSimulatedBoxTotal: new function, base 45, ~1 new box/hour during dead zone
- BRIEFS: Math.round(queueCount * 0.72) instead of hardcoded 0
- lastBoxHourRef → lastBoxQuarterRef; both counters update together every 15 min
- Exported both functions; 10 new unit tests — all 195 passing

**07de8a8** — feat(week-tabs): red/green notification badges + mini calendar popover
- WeekDayTabs: `useDaySeenState` hook — per-subscriber localStorage (`dealfeed.day-seen.{subId}:{dayKey}`)
- Badge unread (red): day has deals + not yet clicked
- Badge seen (green): day has deals + user clicked that tab
- Date range label (e.g. "May 7 – 13") is a clickable calendar toggle
- MiniCalendar.jsx (new): month grid, prev/next nav, deal count dots per day, click-to-filter, click-outside-closes
- feed-layout.css: `.week-day-tab-count.unread`, `.seen`, full `.mini-cal-*` styles

---

## Current state
- Pipeline: SUBMITTED ticks every 15 min, BOXES starts at 45 and ticks ~1/hour, BRIEFS = 72% of queue
- WeekDayTabs: deal days show red badge until clicked, green after
- Mini calendar: clicking date range label opens month popover; navigate months, click day to filter feed
- All 195 tests passing
- Deployed: https://nightdropai.netlify.app

---

## What was NOT done — Phase 2 (requires backend + frontend work)

**Historical deal fetching** — Mini calendar can navigate to any month but historical
dates (beyond the ~100 most recent deals) will show an empty feed. To fix:

**Backend** (`nightdrop-api/routes/dealfeed/deals.js`):
- Add `from_date` and `to_date` query params to `GET /api/dealfeed/deals`
- When present: add `AND ds.sent_at >= $N AND ds.sent_at < $M` to WHERE clause
- Set effective limit to 1000 when date params are provided (single-day fetches are bounded)

**Frontend**:
- `DealsContext.jsx`: add `fetchByDate(date)` function — calls GET /api/dealfeed/deals?from_date=&to_date=
- `DashboardView.jsx`: when selectedDay is set and no local deals match that day,
  call fetchByDate and show results; clear on deselect

---

## Next session
Implement Phase 2: backend date-range params + frontend fetchByDate.
Start with nightdrop-api, then wire DealsContext and DashboardView.

Start command:
cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions

Dev server: npm run dev

Blockers for Brady:
- None. Describe next task or confirm to proceed with Phase 2.
