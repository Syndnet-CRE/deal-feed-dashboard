# Weekly Improvement Loop — Report

**Date:** 2026-05-18
**Branch:** main
**Last commit before run:** `6566c95` — feat(buy-boxes): Phase 3 — Location Rules step
**Last HANDOFF:** 2026-05-15 — Story 7 frontend (DealDetail overhaul, owner portfolio D3 graph)

---

## Scan results

### Orphaned scripts
N/A — this repo has no top-level `scripts/` directory. The `hookify.orphaned-scripts.local.md` rule targets the backend (`scoutgpt-api`). Nothing to check here.

### Unregistered routes
N/A — this is a React SPA. Routing lives in `src/App.jsx` via `react-router-dom`; there is no Express-style `routes/` directory. Backend route registration is enforced by `hookify.unregistered-routes.local.md` in `scoutgpt-api`, not here.

### `console.log` / `console.debug` in committed code
**None found** in `src/`. Clean.

### TODO / FIXME in source
**None found** in `src/`. The only `TODO` references in the repo are:
- `notes/bmad/buy-box-command-center/PRD.md` — intentional planning notes for a future "cascading county/city picker" feature.
- `notes/bmad/b-plus-roadmap/requirements.md` — policy statement requiring TODOs for any MOCK_DEALS use.
- `.github/workflows/claude-weekly-improve.yml` — references TODO scanning (the workflow itself).

None of these are stale code TODOs. No action needed.

### Undefined CSS custom properties

Compared `var(--*)` usages against `--*:` definitions across all `src/` files. **4 undefined tokens found**, of which 3 were silent failures and 1 was intentional:

| Token | Used in | Status |
|---|---|---|
| `--bg-input` | `src/views/InviteClaimView.jsx:194` (has fallback), `src/styles/accounts.css:32`, `src/styles/accounts.css:124` | **Fixed** — alias added |
| `--panel-1` | `src/styles/styles.css:2827` (bulk action bar background) | **Fixed** — alias added |
| `--surface-1` | `src/components/ContactLogModal.jsx:60` (modal background) | **Fixed** — alias added |
| `--dc-accent` | `src/styles/styles.css:457` (deal-card border-left) | Intentional — has `transparent` fallback for dynamic per-card override. Left alone. |

---

## Auto-fixes applied

**`src/styles/tokens.css`** — Added three compatibility aliases in `:root`:

```css
--bg-input:   var(--bg-card);
--panel-1:    var(--bg-card);
--surface-1:  var(--bg-card);
```

All three resolve to `--bg-card`, which already adapts correctly via the `[data-theme="dark"]` override. Inputs in `accounts.css`, the bulk action bar, and the contact log modal now have proper backgrounds in both themes instead of rendering transparent.

No build verification was run (GH Action runner has no `node_modules` yet at this step). The change is purely additive token definitions and cannot regress existing styles — every existing `var(--bg-card)` reference already proves these resolve correctly.

---

## /evolve and /harness-audit

**Skipped — neither skill is installed in this runtime.**

The available skills in this GH Action environment are: `update-config`, `keybindings-help`, `simplify`, `fewer-permission-prompts`, `loop`, `claude-api`, `init`, `review`, `security-review`. The `/evolve` and `/harness-audit` skills referenced in `.github/workflows/claude-weekly-improve.yml` are not present, so the steps were no-ops.

Recommend Brady either:
1. Install the missing skills (presumably packaged in `~/.claude/skills/` on his local machine, but not synced to CI), OR
2. Remove steps 3 and 4 from the workflow prompt to silence the gap.

No new instincts were added this run.

Additionally, `~/.claude/session-data/` does not exist in the runner — the "recent session files" lookup found nothing. This is expected in CI (sessions live on the developer's local machine), but the workflow prompt could be updated to make that lookup optional.

---

## Items for Brady to review manually

1. **`/evolve` and `/harness-audit` skills missing in CI runtime.** See section above. Either ship the skills to CI or trim the workflow prompt.
2. **`--dc-accent` (styles.css:457)** has only a `transparent` fallback. If a per-card accent color is meant to be set dynamically (inline style on `.deal-card`), confirm that wiring still exists in `DealPanelCard.jsx` / `FeedDealCard.jsx`. If the feature was dropped, the `border-left: 3px solid var(--dc-accent, transparent)` rule can be deleted to remove the dead reference.
3. **Pre-existing test failures in `wizardHelpers.test.js`** (3 failures around `delivery_max_per_run` assertions) still present per the 2026-05-15 HANDOFF. Not investigated this week — flagging again so they don't rot.
4. **`POST /api/dealfeed/buy-boxes/preview`** noted in CLAUDE.md as possibly not yet existing on the backend; the wizard preview count fails silently. Worth confirming with the latest `scoutgpt-app` deploy before the next buy-box demo.

---

WEEKLY IMPROVEMENT COMPLETE.
