# Nightdrop Rebrand — Requirements
Date: 2026-05-08
Author: BMAD Analyst

## Business Objective

The product was formerly branded as "Deal Feed" / "Deal Runner" / "Parcyl". It is now called **Nightdrop**. All visible brand references in the two frontend repos (deal-feed-dashboard and deal-feed-landing) must be updated to reflect the Nightdrop identity before any marketing or external sharing. The backend API routes are NOT being renamed this session — only the frontend and styling layer.

## Scope

### In scope
- CSS custom property renames (`--parcyl-*` → `--nightdrop-*`) in both repos
- CSS class renames (`.parcyl-bar` → `.nightdrop-bar`)
- Component renames (`ParcylBar` → `NightdropBar`)
- User-visible brand text ("Deal Feed" → "Nightdrop", "Parcyl" → "Nightdrop")
- Contact email (`hello@parcyl.ai` → `hello@nightdrop.io`) in LoginView
- localStorage key migration (`df_token` → `nd_token`, `parcyl-theme` → `nightdrop-theme`, `parcyl-map-*` → `nightdrop-map-*`)
- HTML page title and package.json name field
- Landing page netlify.toml (add cache clear), lib/config.ts (add env var validation), next.config.ts (security headers)
- Landing page local .env.local for development

### Out of scope (this session)
- Backend API routes (`/api/dealfeed/*`) — NOT renamed
- Dynamic localStorage keys `dealfeed.read.*` and `dealfeed.dealstate.*` — too risky without migration testing
- Netlify site renames (dealrunner.netlify.app → nightdrop.netlify.app) — after MVP verified
- GitHub repo renames — after MVP verified
- Missing image assets (dashboard-preview.png, 6 MCP SVG icons, 4 favicon files) — Brady must supply
- Social media footer links — Brady must supply real URLs
- Custom domain configuration

## Functional Requirements

### R-01 — CSS Design Token Rename (CRITICAL)
Rename all `--parcyl-*` CSS custom properties to `--nightdrop-*` in:
- `src/styles/tokens.css` lines 10-19: `--parcyl-ink` → `--nightdrop-ink`; `--parcyl-green-900/700/500/300` → `--nightdrop-green-900/700/500/300`
- Update all `var(--parcyl-*)` references in `src/styles/styles.css` (lines 1481, 1493, 1501, 2345, 2629)
- Update all `var(--parcyl-green-*)` references in `src/styles/deal-detail.css` (lines 13, 41, 259, 260, 327, 405, 533, 1017)

**Acceptance:** `grep -r "parcyl-ink\|parcyl-green" src/styles/` returns zero results.

### R-02 — CSS Class Rename
Rename `.parcyl-bar` class to `.nightdrop-bar`:
- Definition in `src/styles/styles.css` (line 1)
- Usage in `src/components/ParcylBar.jsx` (line 87)

**Acceptance:** `grep -r "parcyl-bar" src/` returns zero results.

### R-03 — Component Rename: ParcylBar → NightdropBar
- Rename file `src/components/ParcylBar.jsx` to `src/components/NightdropBar.jsx`
- Update default export name from `ParcylBar` to `NightdropBar`
- Update import in `src/App.jsx` (line 23): `import NightdropBar from './components/NightdropBar'`
- Update JSX usage in `src/App.jsx` (lines 112, 121): `<NightdropBar ...>`

**Acceptance:** `grep -r "ParcylBar" src/` returns zero results.

### R-04 — Navigation Bar Brand Text
In `NightdropBar.jsx` (formerly ParcylBar.jsx) lines 88-90: replace "Deal Feed" text with "Nightdrop".

**Acceptance:** App bar shows "Nightdrop" in all authenticated views.

### R-05 — Login Page Brand Text and Contact
In `src/views/LoginView.jsx`:
- Line 32: Replace "Deal Feed" with "Nightdrop"
- Line 75: Replace `hello@parcyl.ai` with `hello@nightdrop.io`

**Acceptance:** Login page shows "Nightdrop" heading and correct contact email.

### R-06 — Deal Detail Attribution Text
In `src/components/DealDetail.jsx` at lines 424, 457, 465, 487, 521, 534, 558, 594, 602, 625, 629:
Replace all "Source: Parcyl..." attribution strings with "Source: Nightdrop".

**Acceptance:** `grep "Source: Parcyl" src/components/DealDetail.jsx` returns zero results.

### R-07 — localStorage Token Migration (CRITICAL — DATA PRESERVATION)
Existing users have `df_token` in localStorage. Renaming without migration logs them all out.

Migration must run **before ReactDOM.createRoot()** in `src/main.jsx`:
```js
// Token migration: df_token → nd_token (one-time, idempotent)
const oldToken = localStorage.getItem('df_token');
if (oldToken && !localStorage.getItem('nd_token')) {
  localStorage.setItem('nd_token', oldToken);
  localStorage.removeItem('df_token');
}
```

After migration, update `src/hooks/useAuth.jsx` (line 11) and `src/lib/api.js` (lines 3-13) to use `nd_token` instead of `df_token`.

**Acceptance:** A user with `df_token` set in localStorage retains their session after the update. A user with `nd_token` already set is unaffected.

### R-08 — Theme localStorage Key Rename
In `src/App.jsx` at lines 23, 112, 121: replace `parcyl-theme` with `nightdrop-theme`.

**Note:** Existing theme preference will reset to default on first load (acceptable — not session-critical).

**Acceptance:** `grep "parcyl-theme" src/` returns zero results.

### R-09 — Map State localStorage Key Renames
In `src/views/MapView.jsx` lines 21-24: rename:
- `parcyl-map-style` → `nightdrop-map-style`
- `parcyl-map-viewport` → `nightdrop-map-viewport`
- `parcyl-deals-filters` → `nightdrop-deals-filters`
- `dealfeed.mapPanel.collapsed` → `nightdrop.mapPanel.collapsed`

**Note:** Existing map preferences will reset on first load (acceptable — not session-critical).

**Acceptance:** `grep "parcyl-map\|dealfeed\.map" src/` returns zero results.

### R-10 — HTML Title
In `index.html` line 7: update `<title>` from "deal-feed-dashboard" to "Nightdrop".

**Acceptance:** Browser tab shows "Nightdrop".

### R-11 — Package Metadata
In `package.json` line 2: update `"name"` from `"deal-feed-dashboard"` to `"nightdrop-dashboard"`.

**Acceptance:** `cat package.json | grep '"name"'` returns `"nightdrop-dashboard"`.

### R-12 — Landing Page: netlify.toml Cache Fix
Update `netlify.toml` build command from `npm run build` to `rm -rf .next && npm ci && npm run build`.

**Why:** Stale `.next/` cache causes "Cannot find module './NNN.js'" errors on Netlify when chunk IDs drift between deployments.

**Acceptance:** Netlify deployment does not fail with stale chunk errors.

### R-13 — Landing Page: Env Var Validation
In `lib/config.ts`: add startup validation that throws if `NEXT_PUBLIC_APP_URL` is not set (instead of silently falling back to empty string). Add a `.env.local` file with `NEXT_PUBLIC_APP_URL=http://localhost:3456` for local dev.

**Acceptance:** `npm run build` fails fast with a clear error if `NEXT_PUBLIC_APP_URL` is unset.

### R-14 — Landing Page: Security Headers
In `next.config.ts`: add HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

**Acceptance:** Response headers include at minimum `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.

## Non-Functional Requirements

- **NFR-01 Build:** Both repos must build cleanly (`npm run build` exits 0) after all changes.
- **NFR-02 Tests:** `npm test` must pass in deal-feed-dashboard after all changes. No test files reference old brand names.
- **NFR-03 No Runtime Errors:** No console errors on fresh load or after token migration.
- **NFR-04 Performance:** CSS variable renames must not introduce duplicate property definitions.
- **NFR-05 Reversibility:** Each story must be independently committable and revertible.

## Constraints

1. Admin gate email `brady@parcyl.ai` in `ParcylBar.jsx` line 48 is NOT changed.
2. Green color `#5BCC48` is NOT changed — only the CSS variable name wrapping it changes.
3. API routes `/api/dealfeed/*` are NOT renamed.
4. Dynamic localStorage keys `dealfeed.read.*` and `dealfeed.dealstate.*` are deferred.
5. Missing image assets are left as stubs — no placeholder images are invented.

## Open Questions (Brady must answer)

1. **Contact email:** Using `hello@nightdrop.io` as replacement for `hello@parcyl.ai` — confirm this is correct.
2. **Social media links:** Footer in landing page has `href="#"` for Twitter/LinkedIn/GitHub. Provide real URLs or confirm `href="#"` is acceptable for MVP.
3. **Missing assets:** dashboard-preview.png, 6 MCP SVG icons, 4 favicon files — when will these be provided? Landing page will show broken image stubs until then.

## Assumptions

1. The Nightdrop brand name is final.
2. Brady will provide missing image assets before the site is shared publicly.
3. Netlify env var `NEXT_PUBLIC_APP_URL=https://deal-feed.netlify.app` is already set in the Netlify dashboard for the landing page (confirmed in prior session).
4. The dashboard Netlify env vars (VITE_API_BASE_URL, VITE_MAPBOX_TOKEN) are already correctly set and do not need changes.
5. Existing deployed users (if any) will tolerate a one-time theme/map preference reset.
6. The `df_token` migration is a one-time operation — no reverse migration is needed.
