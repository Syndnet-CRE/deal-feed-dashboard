HANDOFF
Date: 2026-05-13
Repo: nightdrop-dashboard
Session objective: Logo swap + ECC context/compaction fixes
Status: COMPLETE

---

What was done:

1. **ECC fixes (global ~/.claude/settings.json + CLAUDE.md)**
   - Set `autoCompactEnabled: false` — was silently compacting mid-session
   - Raised ctx-watch.sh ALERT threshold: 60% → 85%
   - Raised ctx-watch.sh CRITICAL threshold: 75% → 92%
   - Changed CLAUDE.md rule: "auto-generate at 60%" → "offer at 85%, never interrupt mid-task"
   - Root cause: session starts at 63% context already (heavy ECC rules), 60% threshold fired on turn 1 every session

2. **Logo swap (src/components/TopHeader.jsx)**
   - Replaced CSS text wordmark (`.top-header-wordmark` + `.top-header-logo-dot`) with `<img>` element
   - Source: `/Users/birwin/Screenshots/Screenshot 2026-05-13 at 4.22.07 PM.png`
   - Processed with Pillow: removed dark bg rgb(10,11,12), then cropped transparent padding (38px left, 30px right, 28px top) — final asset: `src/assets/nightdrop-logo.png` at 181×43px

3. **Logo CSS (src/styles/feed-layout.css)**
   - Removed `.top-header-wordmark` and `.top-header-logo-dot` blocks
   - Added `.top-header-logo { height: 42px; width: auto; object-fit: contain; display: block; }`
   - `.top-header-left`: removed fixed width/min-width (was 280px), removed border-right divider, removed padding-left, kept padding-right: 12px, align-items: flex-start
   - Logo left edge now at 20px from viewport — aligned with Dashboard nav icon below

4. **Header height (src/styles/tokens.css)**
   - `--top-header-h`: 72px → 88px to give logo breathing room

---

What was NOT done:
- Backend preview counter fix still deferred (asset_classes not filtering COUNT in POST /api/dealfeed/buy-boxes/preview on scoutgpt-app)
- Timeline animation work — next session

---

Next session:
Work on the PipelineTimeline animation in the top header. Brady will describe specific changes at session start.

Start command:
cd ~/nightdrop-dashboard && claude --dangerously-skip-permissions

Dev server: was running on localhost:5183 (ports 5173-5182 occupied by stale Vite instances — kill them or just use whatever port Vite picks)

Blockers for Brady:
- None.
