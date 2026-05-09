# HANDOFF
Date: 2026-05-08
Repo: deal-feed-dashboard + deal-feed-landing
Session objective: Post-mortem on login page failures; apply all fixes, dead code cleanup, test coverage
Status: COMPLETE

## What was done

### deal-feed-dashboard

- Fixed `src/hooks/useAuth.jsx` — added `loginWithToken(token, subscriber)` function that sets token and subscriber directly without re-posting to /auth/login. Exposed in context value. (commit d1ecd62)
- Fixed `src/views/InviteClaimView.jsx` — was calling `login(res.token, res.subscriber)` which passed the JWT as an email param to /auth/login. Now calls `loginWithToken(res.token, res.subscriber)`. (commit d1ecd62)
- Removed 10 dead files (commit 85a225d): ConfigurationOverlay.jsx, NewBoxWizard.jsx, PropertyDetail.jsx, MapBackground.jsx, StatusSelector.jsx, src/components/tabs/ (4 files), src/lib/assetColors.js
- Removed 2 backward-compat aliases: `canProceed` (alias for `canProceedStep`) and `freshnessColor` (alias for `agingColor`)
- Installed @vitest/coverage-v8, reached 100% coverage on format.js and wizardHelpers.js (commit 5504935)
- All three commits pushed to main

### deal-feed-landing

- Removed `@vercel/analytics` from `package.json` — dead Vercel-only dep, not compatible with Netlify (commit 3868c2f)
- Set Netlify env var `NEXT_PUBLIC_APP_URL=https://dealrunner.netlify.app` — fixes Sign In / Sign Up CTAs that were 404ing
- Landing page live at https://deal-feed.netlify.app

## What was NOT done

- Missing image assets: `/public/images/dashboard-preview.png` and 6 MCP SVG icons — Brady must supply
- Agent 2 (nightly pipeline) not yet updated to read run_schedule.days and skip boxes where today is not in schedule
- ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env still needs valid key with credits (blocks stress test)
- No E2E test for InviteClaimView invite claim flow — identified as a coverage gap in post-mortem

## Lessons learned (post-mortem)

Root cause of all three login-page bugs: changes were not verified in the target environment before shipping.
1. InviteClaimView auth — auth context had no bypass for post-token flows; `login()` was called incorrectly
2. NEXT_PUBLIC_APP_URL — env var baked at build time, must be set on Netlify before deploy; was missing
3. @vercel/analytics — Vercel-only dependency used on Netlify; removed from layout but dep left in package.json

## Next session

1. Agent 2 schedule enforcement:
   cd ~/parcyl/scoutgpt-api && claude --dangerously-skip-permissions
   — read scripts/run_deal_feed.js, add run_schedule.days check to skip buy boxes where today is not in schedule

## Blockers for Brady

1. Provide image assets for deal-feed-landing: dashboard-preview.png + 6 MCP SVG icons for the /public/images/ directory.

2. ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env needs valid key with credits (blocks stress test).

3. Test the invite claim flow end-to-end — accept an invite email, click link, set password, verify login works.
