# HANDOFF
Date: 2026-05-10
Repo: deal-feed-dashboard
Session objective: Buy Box Command Center — full PRD spec written, taxonomy updated with SFR + Hospitality, ready for autonomous BMAD build
Status: COMPLETE — PRD at notes/bmad/buy-box-command-center/PRD.md. No code written this session.

---

## Next session (Buy Box Command Center build)

```
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```

First message (paste verbatim):
```
Read notes/bmad/buy-box-command-center/PRD.md. Implement stories BB-1 through BB-15 in order. One story at a time. Run tests after each story. Do not skip stories. Do not ask for confirmation between stories. Report blockers only.
```

Blockers before building:
1. Backend migration — match_threshold needs a new column on df_buy_boxes. Frontend sends it; silent no-op until migration runs. Coordinate with Adam or run it yourself on scoutgpt-app Render shell before story BB-14.
2. ATTOM code verification — Hospitality (260/265/270/275/293) and SFR (100/102/104) codes added this session. Verify against ATTOM before matcher runs on those asset classes or they return zero deals silently.
3. Dev server for E2E — BB-15 (Playwright) requires npm run dev in a separate terminal. Manual step.

---

## What changed this session

TAXONOMY — src/lib/buyBoxTaxonomy.js
- Added Single Family asset class: SFR (100), Condo (102), Co-op (104), Manufactured Home (373)
- Added Hospitality asset class: Hotel (260), Motel (265), Extended Stay (270), Resort (275), B&B (293)

PRD — notes/bmad/buy-box-command-center/PRD.md
- Full spec for BuyBoxesView.jsx redesign (background surface, empty state, card expansion, UUID fix, toasts)
- Full spec for BuyBoxWizard.jsx redesign (10-step reorder, cascading geo, asset-specific criteria, match threshold)
- 15 stories with file targets, estimated time, and test criteria
- Definition of done
- All toast copy, tooltip copy, hover states, CSS class names included

Context audit and rules cleanup (earlier in session):
- Deleted 11 unused language rule directories from ~/.claude/rules/ — reduced session open context from 183% to 30%
- Remaining: common/, web/, typescript/, python/ only

---

## Previous session context (v6 dashboard — still relevant)

- Dashboard v6 shipped (commit 9fb755c), pushed to main, live on nightdropai.netlify.app
- Header 72px with compact pipeline track
- NEXT RUN countdown in left rail top card
- Search bar deleted
- Deal cards use Mapbox Static Images for aerial thumbnails (zoom 16)
- All chrome #0D0D0D, all gaps 12px, hidden scrollbars throughout

Known debt:
- !important CSS in feed-layout.css at 1181-1400 media query (PipelineTimeline inline styles)
- tests/.tmp/ has leftover screenshot files — Brady can rm -rf tests/.tmp
- <1180px narrow NEXT RUN fallback never visually verified

Carried blockers:
- ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env
- Migration 045 not applied

---

## Prior session HANDOFF content (v6 sprint detail)

---

## Where we are

- **Frontend:** `~/deal-feed-dashboard` on `main`. Last commit `9fb755c feat(dashboard): v6 — pipeline in header, NEXT RUN in left rail, Mapbox aerials`.
- **Backend:** unchanged this session.
- **Localhost:** dev server still running on port 5173. Auto-loads /dashboard.

---

## What changed this session

### Round 1: Pipeline-into-header + NEXT RUN-into-rail (no more 117px band)

1. **Header (was 56px → now 72px)** now contains the wordmark + a compact pipeline track + phase pill ("Agents Running Now"). Eyebrow label and per-stage labels (SUBMIT/AGENTS/BRIEFS/DELIVERED) dropped per Option A. Search input removed entirely.
2. **NEXT RUN countdown** is now the top card of the left rail (above Filter / Tonight's Run / Market Pulse). 28px digits at full rail width, shrinks to 22px digits / 16px separators at the 1181–1400px tier so seconds digit doesn't clip.
3. **Top band gone.** `feed-band-wrap` removed from DashboardView. `--pipeline-h` token zeroed out. All sticky-offset CSS rules at lines 996, 1254, 1835 still resolve correctly via `calc(var(--top-header-h) + var(--pipeline-h) + 12px)` → 84px (72 header + 12 gap).
4. **Net reclaim:** ~96px of vertical chrome. Feed column, left rail, right rail tops all butt against header bottom with 12px gap.
5. **Narrow fallback (<1180px):** NEXT RUN card surfaces inside the fixed LeftPanel above the Filter section. Floating rails still hide.

### Round 2: Mapbox aerial imagery in deal cards

6. `FeedDealCard.jsx` was previously gated on `VITE_GOOGLE_MAPS_KEY` (carry-over blocker, key never set) so deal cards always showed the asset-class text placeholder. Swapped to Mapbox Static Images using the existing-and-working `VITE_MAPBOX_TOKEN`. URL: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},16/1024x280@2x?...&logo=false&attribution=false`. Zoom 16 (Brady's call). Fallback placeholder div preserved for coord-less deals.

---

## Files touched

- `src/components/PipelineTimeline.jsx` — added `mode` (`full`/`track`/`countdown`) and `compact` props; new `pipeline-cd-num`/`pipeline-cd-sep` classNames so CSS can target the digits responsively
- `src/components/TopHeader.jsx` — search dropped; renders `<PipelineTimeline mode="track" compact />` inside `.top-header-pipeline`
- `src/components/LeftRail.jsx` — new `left-rail-nextrun-card` as first child
- `src/components/LeftPanel.jsx` — narrow-fallback gained NEXT RUN above Filter
- `src/views/DashboardView.jsx` — `feed-band-wrap` removed
- `src/App.jsx` — `searchQuery` state and prop drilling removed
- `src/styles/tokens.css` — `--top-header-h: 56→72`, `--pipeline-h: 117→0`
- `src/styles/feed-layout.css` — `.top-header-search*` rules → `.top-header-pipeline` flex container; `.left-rail-nextrun-card` and `.left-panel-nextrun` styles; 1181–1400px responsive `!important` shrink for digits
- `src/components/feed/FeedDealCard.jsx` — `GOOGLE_MAPS_KEY`→`MAPBOX_TOKEN`; Google URL→Mapbox URL; `loading="lazy"`

---

## Build + verification

- `npm run build` — passes clean. Pre-existing Mapbox chunk-size warning unchanged.
- Playwright screenshots verified at 1680px and 1280px viewports. Mapbox imagery loads in deal cards at both widths.
- Deal cards show real satellite tiles for visible deals (400 PACE BEND RD N, 405 E BEN WHITE BLVD).

---

## Visual outcome

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ● Nightdrop.ai   [────●────●────●────●]   [● Agents Running Now]       │  ← header 72px
├────────────┬────────────┬──────────────────────────┬───────────────────┤
│ LEFT PANEL │ LEFT RAIL  │     DEAL FEED COLUMN     │   RIGHT RAIL      │
│            │            │                          │                   │
│ Dashboard  │ NEXT RUN   │   ┌─ aerial image ──┐   │ ┌─ MiniMap ─┐    │
│ Map        │ 00:25:30   │   │ (Mapbox sat 16)  │   │ └──────────┘    │
│ Buy Boxes  │            │   │                  │   │ ┌──────────┐    │
│ ...        │ Filter     │   └──────────────────┘   │ │ BBH +    │    │
│            │ All Unr    │   400 PACE BEND RD N     │ │ Recent   │    │
│ BBs:       │ Sav Hot    │   SPICEWOOD, TX, 78669   │ │ Activity │    │
│ - self stg │            │                          │ │          │    │
│            │ Tonight's  │   ┌─ aerial image ──┐   │ └──────────┘    │
│            │ Run text   │   │ (Mapbox sat 16)  │   │                   │
│            │            │   └──────────────────┘   │       CHAT FAB ●│
│            │ Market     │   405 E BEN WHITE BLVD   │                   │
│            │ Pulse ▼    │                          │                   │
└────────────┴────────────┴──────────────────────────┴───────────────────┘
   12px gap     12px gap          12px gap                12px gap
```

---

## Known UX observations

1. **Header at >1900px** — pipeline track has fixed 28px margins in compact mode. Visually balanced at 1680/1280 but worth a glance at 1920+ widths. Easy fix: relax to `flex: 1` or scale margins with viewport.
2. **<1180px narrow fallback** — NEXT RUN card was added to LeftPanel narrow-only block but never visually verified at narrow viewport. Should test before declaring full responsive coverage.
3. **`!important` debt** — two CSS rules at the 1181–1400 media query use `!important` to override inline-styled font sizes in PipelineTimeline. Functional but ugly. Fix path: refactor PipelineTimeline styles from inline JS objects to CSS classes throughout. Roughly 15 min of work.
4. **Mapbox cost** — free tier is 50k Static Images requests/month. Each card = 1 request. Browser caches per-URL within session. Worth monitoring usage if subscriber count grows.
5. **Carry-over from prior sessions:** ANTHROPIC_API_KEY in `~/parcyl/parcyl-mcp-server/.env`; Migration 045 not applied; `VITE_GOOGLE_MAPS_KEY` blocker is now obviated by the Mapbox swap.
6. **`tests/.tmp/`** — two `.spec.cjs` screenshot files left on disk (cleanup blocked by destructive-command hook). Untracked, not in commit. Brady can `rm -rf tests/.tmp` manually when convenient, or add to `.gitignore`.

---

## Topology reminder (do NOT confuse)

- Frontend prod: `https://nightdropai.netlify.app` (auto-deploys from main on push — `9fb755c` deploying now)
- Backend prod: `https://scoutgpt-app.onrender.com` (untouched this session)
- df_* tables → `DATABASE_WRITE_URL`. UUID PKs.

---

## Next session

Brady has more UI/UX changes queued. Resume from a fresh chat with a clean context window.

```
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```

### Resume prompt (paste verbatim into the fresh session)

```
Read ~/deal-feed-dashboard/notes/HANDOFF.md FIRST. One-line acknowledgment, then wait for Brady to dictate the next round of UI/UX changes.

Quick state pointer so you have shape immediately:
- Dashboard v6 shipped (commit 9fb755c) and pushed to main. Netlify auto-deploying to nightdropai.netlify.app.
- Header is 72px and contains: Nightdrop.ai wordmark | compact animated pipeline track | "Agents Running Now" phase pill on the right
- NEXT RUN countdown is now the TOP card of the left rail (above Filter / Tonight's Run / Market Pulse)
- Search bar deleted entirely (Brady's call — to be revisited later)
- Top band (the old 117px pipeline+countdown row) is GONE
- Deal-card aerial images now load via Mapbox Static Images (satellite-streets-v12, zoom 16, 1024x280@2x) using VITE_MAPBOX_TOKEN. Asset-class text placeholder still fallback for coord-less deals.
- All chrome unified at #0D0D0D, all gaps 12px, all scrollbars hidden — memory entry `project_hidden_scrollbars.md` flags this if users report frozen/missing content
- Filter state lifted to AppShell; narrow fallback (<1180px) surfaces NEXT RUN + Filter chips + Tonight's Run inside the fixed LeftPanel
- Responsive tiers: ≥1700 (270/360 rails), 1401-1700 (240/320), 1181-1400 (200/260, chips vertical, NEXT RUN digits 22px), <1180 (rails hide)

Working rules for this session — DO NOT skip:
1. ALWAYS show a plan before any layout change. Walk the box model in plain numbers BEFORE editing — math beats screenshot-then-fix.
2. When Brady names a value (e.g. "12px gap"), explicitly clarify "visible vs reserved" if there's a max-width or auto-margin in play.
3. Use Playwright (project-local Playwright via `tests/.tmp/<file>.spec.cjs` since the Playwright MCP extension is not installed) to screenshot your own changes before declaring done.
4. Push back on giant outerHTML pastes — class name + screenshot is enough.
5. If context opens >150%, FLAG IT IMMEDIATELY and offer to /compact before working further. (Last session opened at 165% and never flagged it — don't repeat that.)
6. Ask single-question clarifications during planning when there's known ambiguity. Cheap to ask, expensive to redo.

Known debt to be aware of (not necessarily to fix unless asked):
- `!important` CSS in feed-layout.css at the 1181-1400 media query overrides inline-styled font sizes in PipelineTimeline. Cleaner fix is to migrate PipelineTimeline from inline JS-object styles to CSS classes throughout (~15 min).
- `tests/.tmp/` has 2 leftover .spec.cjs screenshot files. Cleanup blocked by destructive hook last session. Brady can `rm -rf tests/.tmp` manually or add to .gitignore.
- <1180px narrow fallback for NEXT RUN was implemented but never visually verified.

Optional: run `/code-review` if you want a formal pass on commit 9fb755c before starting fresh changes.

DO NOT proactively do anything. Brady will tell you what to refine.
```

---

## Blockers for Brady (carried)

1. ANTHROPIC_API_KEY in `~/parcyl/parcyl-mcp-server/.env` (carry-over)
2. Migration 045 not applied (carry-over)
3. ~~VITE_GOOGLE_MAPS_KEY~~ — RESOLVED this session by swapping to Mapbox
