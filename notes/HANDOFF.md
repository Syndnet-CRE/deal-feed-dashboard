HANDOFF
Date: 2026-05-13
Repo: nightdrop-dashboard
Session objective: Pipeline timeline 24h layout + submitted counter + visual balance
Status: COMPLETE — local only, NOT committed

---

What was done (all local, dev server at localhost:5184):

**`src/components/PipelineTimeline.jsx`:**
- `getMarkerPct()`: replaced with 50/50 visual split formula. Dead zone (6am→midnight, 18h) = 0→50%. Active run (midnight→6am, 6h) = 50→100%. Clock timing preserved exactly.
- `PIPELINE_NODES`: Boxes@0.50, Queue@0.667, Briefs@0.833, Delivered@1.0
- `getStage()`: updated nodeIdx — dead zone=0 (Boxes glows), midnight-2am=1, 2am-4am=2, 4am-6am=3
- `getSimulatedBoxCount()`: seeded LCG by CT date, 1-29 new boxes/hour cumulative during dead zone
- Added `submittedCount` state + `lastBoxHourRef` — updates once per hour in tick()
- ETA array changed to `['06:00 CT', ...]` (was '02:00 CT')
- Passes `nodes={PIPELINE_NODES}` and `submittedCount` to PipelineTrack

**`src/components/PipelineTrack.jsx`:**
- `DEFAULT_NODES`: updated to match new visual positions
- Stat strip: dynamic — derives positions from nodes array (was hardcoded 0/33/67/100%)
- Added `submittedCount` prop — renders "221 SUBMITTED" as single horizontal line at dead zone midpoint (25% x)
- `whiteSpace: 'nowrap'` on StatBlock value div — fixes "06:00 CT" wrapping to two lines
- EQTicker fill fix from earlier session also live

**`src/styles/feed-layout.css`:**
- Added `@keyframes pt-count-pulse` — fires on submittedCount update

---

Current visual state (verified in browser at ~11pm CT):
- Rocket at ~47%, approaching BOXES gate at 50% (dead center)
- BOXES glowing as next-up, QUEUE/BRIEFS/DELIVERED evenly spaced in right half
- "221 SUBMITTED" single line in left half
- ETA shows "ETA" / "06:00 CT" — two lines, no wrap
- EQ bar reaches full width to DELIVERED

---

What was NOT done:
- Nothing committed to main — all local only
- BRIEFS stat still hardcoded to 0 (needs backend field)
- Countdown footer "2:00 AM CT" still hardcoded (functional)
- No automated tests written for timeline logic

---

Next session:
Commit all pipeline work, then Brady describes next task.

Start command:
cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions

Dev server: npm run dev (currently on port 5184)

Blockers for Brady:
- None — pipeline timeline is visually complete and working locally
- Decide: commit to main (auto-deploys to Netlify) or stay on branch?
