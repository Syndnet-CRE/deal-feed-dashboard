# HANDOFF
Date: 2026-05-08
Repo: deal-feed-dashboard + deal-feed-landing
Session objective: Post-mortem on login page failures; apply all identified fixes
Status: COMPLETE

## What was done

### deal-feed-dashboard (pushed to main, commit d1ecd62)

- Fixed `src/hooks/useAuth.jsx` — added `loginWithToken(token, subscriber)` function that sets token and subscriber directly without re-posting to /auth/login. Exposed in context value.
- Fixed `src/views/InviteClaimView.jsx` — was calling `login(res.token, res.subscriber)` which passed the JWT as an email param to /auth/login (a network call that would fail). Now calls `loginWithToken(res.token, res.subscriber)`.
- Build verified passing.

### deal-feed-landing (pushed to main, commit 3868c2f, redeployed to https://deal-feed.netlify.app)

- Removed `@vercel/analytics` from `package.json` and `package-lock.json` — was already removed from `layout.tsx` last session but the dead dep remained.
- Set Netlify env var `NEXT_PUBLIC_APP_URL=https://dealrunner.netlify.app` on the deal-feed.netlify.app site — this fixes all Sign In / Sign Up CTAs which were resolving as relative paths and 404ing on the landing page domain.
- Landing page rebuilds cleanly and is live at https://deal-feed.netlify.app.

### Still blocked / not fixed

- Missing image assets: `/public/images/dashboard-preview.png` and 6 MCP SVG icons — these don't exist in the repo. The landing page renders without them (Next.js gracefully handles missing images), but the dashboard preview section will show broken images. Brady must supply actual image files.

## What was NOT done (from prior sessions, still open)

- Dead code cleanup: ConfigurationOverlay.jsx, NewBoxWizard.jsx, PropertyDetail.jsx, src/components/tabs/ still present as dead code
- Agent 2 (nightly pipeline) not yet updated to read run_schedule.days and skip boxes where today is not in schedule
- ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env still needs valid key with credits (blocks stress test)

## Next session

1. Dead code cleanup:
   cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
   — delete src/components/ConfigurationOverlay.jsx, NewBoxWizard.jsx, PropertyDetail.jsx, src/components/tabs/

2. Agent 2 schedule enforcement:
   cd ~/parcyl/scoutgpt-api && claude --dangerously-skip-permissions
   — read scripts/run_deal_feed.js, add run_schedule.days check to skip buy boxes where today is not in schedule

## Blockers for Brady

1. Provide image assets for deal-feed-landing: dashboard-preview.png + 6 MCP SVG icons for the /public/images/ directory.

2. Test the buy box wizard end-to-end in the live app — create a new buy box, verify it saves correctly.

3. ANTHROPIC_API_KEY in ~/parcyl/parcyl-mcp-server/.env needs valid key with credits (blocks stress test).
