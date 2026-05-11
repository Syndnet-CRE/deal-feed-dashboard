HANDOFF
Date: 2026-05-11
Repo: deal-feed-dashboard
Session objective: Post-mortem remediation — CI, dead code cleanup, CLAUDE.md reconciliation
Status: COMPLETE

---

## What was done this session

### Login fix (from previous session, confirmed working)

Rate limit fixed on backend (scoutgpt-api commit d708501). Login working for brady@parcyl.ai.

### Full codebase audit

4 parallel Explore agents audited every file. Findings: 2 files in CLAUDE.md that don't exist on disk, 5+ files on disk not documented, 2 dead components, theme key bug, wizard validation inconsistency, no CI.

### Post-mortem remediation (commit 436fee0)

All 5 recommendations executed:

1. **CI added** — `.github/workflows/ci.yml` runs lint + build + knip on every push to main. `.github/workflows/claude.yml` enables @claude PR comment integration.

2. **CLAUDE.md reconciled** — removed `assetColors.js` and `StatusSelector.jsx` (never existed on disk); removed `NightdropBar.jsx` and `CalendarModal.jsx` entries (deleted); fixed `df_token` → `nd_token`; fixed `parcyl-theme` → `nightdrop-theme`; added large CSS files to KEY FILES; added `npm run knip`; documented `.env.development` approach and Playwright/rate-limit landmines.

3. **Dev/prod env split documented** — `.env.development` sets `VITE_API_BASE_URL=` so dev traffic uses the Vite proxy. Brady must create this file manually (blocked by permission hook). The command: `echo "VITE_API_BASE_URL=" > .env.development`

4. **knip installed** — `npm run knip` reports unused exports. Now runs in CI. Current known unused exports: several from `DealComponents.jsx` and `buyBoxTaxonomy.js` — these are intentional public APIs, not dead code to delete.

5. **RATE_LIMIT_BYPASS_EMAILS** — still Brady's action item (Render dashboard). NOT done.

### Lint fixed (8 pre-existing errors)

- `BuyBoxPage1.jsx`: `Math.random()` in render replaced with deterministic formula
- `BuyBoxPage23.jsx`: `Field` component defined inside render moved outside as `OwnerField`
- `BuyBoxPage4.jsx`: unused `format` param removed from `Slider`
- `BuyBoxRightRail.jsx`: `prevCount` state converted to `useRef` (eliminates cascading setState)
- `BuyBoxWizard.jsx`: `catch (_) {}` fixed to optional catch binding with comment

### Dead code deleted

- `src/components/NightdropBar.jsx` — 120 lines, 0 imports
- `src/components/CalendarModal.jsx` — ~180 lines, 0 imports

---

## What was NOT done

- `.env.development` file — permission hook blocked write to .env* files. Brady creates it with: `echo "VITE_API_BASE_URL=" > ~/deal-feed-dashboard/.env.development`
- Wizard validation inconsistency (BuyBoxWizard.canGoNext() vs wizardHelpers.canProceedStep()) — deferred, needs Brady to decide if this is a bug to fix or acceptable divergence
- CI GitHub secret `VITE_MAPBOX_TOKEN` — needs to be set in GitHub repo settings before the CI build step can produce a fully working artifact (lint + knip still pass without it; build succeeds but Mapbox won't initialize at runtime)

---

## Next session

Brady assigns the next feature. Codebase is clean: 0 lint errors, CI on main, CLAUDE.md accurate.

```
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```

---

## Blockers for Brady

1. **RENDER ENV VAR** (critical) — Add `RATE_LIMIT_BYPASS_EMAILS=brady@parcyl.ai` to Render environment on `scoutgpt-app`. Render dashboard → scoutgpt-app → Environment. Prevents future admin lockouts.

2. **GitHub secret** — Add `VITE_MAPBOX_TOKEN` to repo secrets so CI build has the token. GitHub → deal-feed-dashboard repo → Settings → Secrets and variables → Actions → New secret.

3. **.env.development** — Create the file locally:
   ```
   echo "VITE_API_BASE_URL=" > ~/deal-feed-dashboard/.env.development
   ```
   This makes dev traffic use the Vite proxy instead of hitting the production API URL directly from the browser.

4. **Assign next feature.**
