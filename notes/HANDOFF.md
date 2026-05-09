# HANDOFF
Date: 2026-05-08
Repo: deal-feed-dashboard + global ~/.claude config
Session objective: Post-mortem — enforce BMAD gate globally + add E2E critical flow coverage
Status: COMPLETE

## What was done

### Global (~/.claude config)

- Built `~/.claude/hooks/bmad-gate.sh` — BMAD enforcement hook. Fires on every Write/Edit tool call in every repo. Warns at 3 source files edited with no BMAD docs, hard blocks (exit 2) at 5+. Skips markdown, config, test files, and BMAD docs themselves from the count.
- Registered hook in `~/.claude/settings.json` under `PreToolUse` matcher `Write|Edit` with 10s timeout. Global — applies to all sessions everywhere.
- Verified working: tested from clean temp dir, warning fires at 3 files, hard block at 5. Existing projects with BMAD docs (like deal-feed-dashboard with 17 docs) pass cleanly.

### deal-feed-dashboard (commit 305fde2, pushed to main)

- Created `tests/critical-flows.spec.js` — 13 Playwright E2E tests, 13 passing.
  - Login Flow (5 tests): unauthenticated redirect, valid login, invalid login, submit disabled during request, session restore on reload.
  - Invite Claim Flow (4 tests): valid token shows form, invalid token shows error, all fields required, successful claim redirects.
  - Buy Box Wizard (4 tests): wizard opens, step 1 blocks without name, step 1 to 2 navigation, cancel without submit.
  - All API calls mocked via page.route() — dev server only, no backend needed.

### Key discoveries this session

- BuyBoxWizard button text is "Continue" (not "Next"). Primary CTA is `.bbwiz-btn-primary`. Steps 1-8 are never `disabled` — validation fires inside `handleNext()`.
- InviteClaimView name input has no `name` attribute — correct selector is `input[placeholder="Jane Smith"]`.
- CLAUDE.md listed ConfigurationOverlay.jsx as active but it was removed in commit 85a225d. CLAUDE.md updated to reflect BuyBoxWizard.jsx as the active component.

## What was NOT done

- Harness audit score still 18/29 — Memory Persistence (0/10) and Security Guardrails (3/10) not addressed.
- Agent 2 schedule enforcement (scoutgpt-api): run_schedule.days check still missing.
- Landing page architecture decision deferred — two repos still both have landing page code.
- useCaseLibrary Bug A + Bug B (scoutgpt-api) still open.
- ANTHROPIC_API_KEY for parcyl-mcp stress test still unfunded.

## Next session

Agent 2 schedule enforcement:
  cd ~/parcyl/scoutgpt-api && claude --dangerously-skip-permissions
  Read scripts/run_deal_feed.js, add run_schedule.days check to skip buy boxes
  where today (day of week) is not in the schedule array. Single-file change, no BMAD.

## Blockers for Brady

1. ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env needs valid key with credits (blocks stress test).

2. Provide image assets for deal-feed-landing: dashboard-preview.png + 6 MCP SVG icons for the /public/images/ directory.

3. Test invite claim flow end-to-end in production — accept real invite email, click link, set password, verify login works.

4. Decide: landing page in deal-feed-dashboard (React route at /) or in deal-feed-landing (standalone Next.js)? Currently both. Needs a call before the next frontend session.
