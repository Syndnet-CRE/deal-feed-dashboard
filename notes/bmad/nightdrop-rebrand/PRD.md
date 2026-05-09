# Nightdrop Rebrand — Product Requirements Document
Date: 2026-05-08
Author: BMAD PM
Status: DRAFT

## Executive Summary

Deal Feed Dashboard and deal-feed-landing are rebranding to **Nightdrop**. This PRD scopes all frontend and styling changes across both repos. Backend routes (`/api/dealfeed/*`) remain unchanged. The primary risks are (a) the localStorage token migration that must not log out existing users, and (b) the CSS variable rename cascade. Everything else is low-risk string replacement.

## Problem Statement

The product identity has shifted to Nightdrop. User-facing text, component names, CSS variables, localStorage keys, and page titles still reference Parcyl / Deal Feed / Deal Runner. This creates brand confusion and blocks public launch. A phased story-based rollout with explicit per-story validation gates each change category independently.

## Goals and Success Metrics

| Goal | Metric |
|------|--------|
| Unified brand | Zero "Parcyl", "Deal Feed", "Deal Runner" in user-visible UI |
| Zero session loss | Existing users retain login after deployment |
| Clean codebase | All CSS classes, component names, localStorage keys use Nightdrop naming |
| Build stable | Both repos build cleanly; all tests pass; zero console errors on fresh load |

## User Stories

- As a logged-in user, I want to see "Nightdrop" in the app bar so I know the product identity.
- As a logged-in user, I want to remain authenticated after the rebrand so I don't have to re-login.
- As a visitor, I want the landing page to show "Nightdrop" branding so the product identity is clear.
- As a developer, I want CSS variables named `--nightdrop-*` so token naming is consistent.
- As a developer, I want localStorage keys prefixed `nightdrop-` so local state is clearly scoped.
- As an admin, I want the admin gate to remain on `brady@parcyl.ai` so existing permissions don't break.

## Feature Breakdown (by phase)

### Phase 1 — CSS Design Tokens (CRITICAL)
Rename `--parcyl-*` → `--nightdrop-*` in tokens.css, styles.css, deal-detail.css.

### Phase 2 — CSS Classes
Rename `.parcyl-bar` → `.nightdrop-bar` in styles.css and NightdropBar (formerly ParcylBar).

### Phase 3 — Component Rename and Brand Text
Rename `ParcylBar.jsx` → `NightdropBar.jsx`, update imports, update nav bar text "Deal Feed" → "Nightdrop", update LoginView contact email, update DealDetail attributions.

### Phase 4 — localStorage Token Migration (CRITICAL)
Add migration in main.jsx before ReactDOM.createRoot: copy `df_token` → `nd_token`, delete `df_token`. Update useAuth.jsx and api.js to use `nd_token`.

### Phase 5 — Non-Critical localStorage Keys
Rename `parcyl-theme` → `nightdrop-theme` in App.jsx, and map/panel keys in MapView.jsx.

### Phase 6 — HTML and Package Metadata
Update index.html title; update package.json name field.

### Phase 7 — Landing Page Fixes
Fix netlify.toml build command (add `rm -rf .next`), add env var validation in lib/config.ts, add security headers in next.config.ts, create .env.local for local dev.

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Token migration logs out existing users | Low | Critical | Idempotent copy-then-delete before ReactDOM mount; test with real token |
| CSS variable rename breaks UI | Low | Medium | Grep confirms zero orphaned parcyl-* refs before merge |
| Missing assets break landing page | High | Medium | Left as stubs; Brady must supply before public launch |
| Admin gate email accidentally changed | Low | Critical | Constraint: `brady@parcyl.ai` is never touched |

## Dependencies and Blockers

**Blockers for Brady:**
1. Confirm `hello@nightdrop.io` as replacement contact email (LoginView)
2. Provide real social media URLs for landing page footer (currently `href="#"`)
3. Provide dashboard-preview.png and 6 MCP SVG icons for landing page `/public/images/`
4. Confirm `brady@parcyl.ai` admin gate stays unchanged

**Phase ordering constraint:** Phase 1 (token definition) must commit before Phase 2 (token usage references) to prevent orphaned var() calls during development.

## Out of Scope

- Backend API routes `/api/dealfeed/*` — NOT renamed
- Dynamic localStorage keys `dealfeed.read.*` and `dealfeed.dealstate.*` — deferred
- Netlify site renames (dealrunner.netlify.app) — after MVP verified
- GitHub repo renames — after MVP verified
- Custom domain — separate session

## Acceptance Criteria

1. `grep -r "parcyl-ink\|parcyl-green\|parcyl-bar\|ParcylBar\|Deal Feed" src/` returns zero applicable hits
2. Existing user with `df_token` in localStorage remains authenticated after deployment
3. `npm run build` exits 0 in both repos
4. `npm test` exits 0 in deal-feed-dashboard
5. Fresh page load shows zero console errors
6. Browser tab title reads "Nightdrop"
7. App bar shows "Nightdrop"
8. Login page shows "Nightdrop" and `hello@nightdrop.io`

## Timeline Estimate

18 stories across 7 phases. Estimated ~8-10 hours total implementation time. Can be done in one focused session with parallel agents on independent phases (Phase 1-2, Phase 6-7 are parallelizable; Phase 4 is single-threaded critical path).
