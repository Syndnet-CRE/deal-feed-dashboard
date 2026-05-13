# Nightdrop Rebrand — Stories
Date: 2026-05-08
Author: BMAD SM
Status: READY FOR IMPLEMENTATION

Stories are ordered by implementation dependency. Each story is independently committable and revertible. No story should take more than 2 hours. Run tests after each story before moving to the next.

---

## Story 1 — CSS Token Definitions (tokens.css)
**Repo:** nightdrop-dashboard
**Files:** `src/styles/tokens.css`
**Effort:** 15 min
**Depends on:** nothing

**Work:**
- Rename `--parcyl-ink` → `--nightdrop-ink` (line 10)
- Rename `--parcyl-green-900` → `--nightdrop-green-900` (line 11)
- Rename `--parcyl-green-700` → `--nightdrop-green-700` (line 12)
- Rename `--parcyl-green-500` → `--nightdrop-green-500` (line 13)
- Rename `--parcyl-green-300` → `--nightdrop-green-300` (line 14)
- Update the `--green`, `--green-deep`, `--green-bright` aliases (lines 17-19) to reference the new names
- Update the header comment (lines 2-4) from "Parcyl Design System" to "Nightdrop Design System"
- Keep hex values identical

**DO NOT:** Change `#5BCC48` or any other hex value.

**Validation:**
```bash
grep "parcyl-ink\|parcyl-green" src/styles/tokens.css  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `refactor: rename --parcyl-* CSS tokens to --nightdrop-* in tokens.css`

---

## Story 2 — CSS Token References (styles.css + deal-detail.css)
**Repo:** nightdrop-dashboard
**Files:** `src/styles/styles.css`, `src/styles/deal-detail.css`
**Effort:** 20 min
**Depends on:** Story 1 (tokens must be defined before references are updated)

**Work in styles.css:**
- Line 1: Update comment header if it references Parcyl
- Lines 1481, 1493, 1501, 2345, 2629: Replace `var(--parcyl-ink)` → `var(--nightdrop-ink)`

**Work in deal-detail.css:**
- Lines 13, 41, 259, 260, 327, 405, 533, 1017: Replace `var(--parcyl-green-*)` → `var(--nightdrop-green-*)`

**Validation:**
```bash
grep "var(--parcyl" src/styles/styles.css      # must return 0 lines
grep "var(--parcyl" src/styles/deal-detail.css  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `refactor: update var(--parcyl-*) references to var(--nightdrop-*)`

---

## Story 3 — CSS Class Rename (.parcyl-bar)
**Repo:** nightdrop-dashboard
**Files:** `src/styles/styles.css` (line 1 — class definition), `src/components/ParcylBar.jsx` (line 87 — className usage)
**Effort:** 10 min
**Depends on:** Story 2

**Work:**
- In styles.css: find the `.parcyl-bar` selector definition, rename to `.nightdrop-bar`
- In ParcylBar.jsx: change `className="parcyl-bar"` to `className="nightdrop-bar"`

**NOTE:** Do NOT rename the file or component export yet — that is Story 4.

**Validation:**
```bash
grep -r "parcyl-bar" src/  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `refactor: rename .parcyl-bar CSS class to .nightdrop-bar`

---

## Story 4 — Component File and Export Rename (ParcylBar → NightdropBar)
**Repo:** nightdrop-dashboard
**Files:** `src/components/ParcylBar.jsx` (rename to NightdropBar.jsx), `src/App.jsx` (update import)
**Effort:** 15 min
**Depends on:** Story 3

**Work:**
- Copy `src/components/ParcylBar.jsx` content to `src/components/NightdropBar.jsx`
- Update the default export name from `ParcylBar` to `NightdropBar`
- In `src/App.jsx` line 23: update import to `import NightdropBar from './components/NightdropBar'`
- In `src/App.jsx` lines 112 and 121: update JSX `<ParcylBar` → `<NightdropBar`
- Delete `src/components/ParcylBar.jsx`

**Commit all changes atomically — file rename + import update must be in the same commit.**

**Validation:**
```bash
grep -r "ParcylBar" src/   # must return 0 lines
ls src/components/ | grep -i parcyl  # must return nothing
npm run build  # must exit 0
```
**Commit message:** `refactor: rename ParcylBar component to NightdropBar`

---

## Story 5 — Navigation Bar Brand Text
**Repo:** nightdrop-dashboard
**Files:** `src/components/NightdropBar.jsx` (formerly ParcylBar.jsx)
**Effort:** 10 min
**Depends on:** Story 4

**Work:**
- Lines 88-90 (approximately): Find the "Deal Feed" text string in the JSX and replace with "Nightdrop"

**DO NOT:** Change the admin gate check on line 48: `subscriber?.email === 'brady@parcyl.ai'` — this must stay exactly as-is.

**Validation:**
- Start dev server: `npm run dev`
- Verify app bar shows "Nightdrop"
- Verify admin dropdown still appears for brady@parcyl.ai (do NOT test with another account — just read the code)
```bash
grep "Deal Feed" src/components/NightdropBar.jsx  # must return 0 lines
grep "brady@parcyl.ai" src/components/NightdropBar.jsx  # must return exactly 1 line
```
**Commit message:** `feat: update nav bar brand text to Nightdrop`

---

## Story 6 — Login Page Brand Text and Contact Email
**Repo:** nightdrop-dashboard
**Files:** `src/views/LoginView.jsx`
**Effort:** 10 min
**Depends on:** nothing (independent of Stories 1-5)

**Work:**
- Line 32: Replace "Deal Feed" with "Nightdrop"
- Line 75: Replace `hello@parcyl.ai` with `hello@nightdrop.io`

**Validation:**
```bash
grep "Deal Feed\|parcyl.ai" src/views/LoginView.jsx  # must return 0 lines
```
**Commit message:** `feat: update LoginView brand text and contact email to Nightdrop`

---

## Story 7 — Deal Detail Attribution Text
**Repo:** nightdrop-dashboard
**Files:** `src/components/DealDetail.jsx`
**Effort:** 20 min
**Depends on:** nothing (independent)

**Work:**
- At lines 424, 457, 465, 487, 521, 534, 558, 594, 602, 625, 629 (approximately): Find all "Source: Parcyl" strings and replace with "Source: Nightdrop"

**Validation:**
```bash
grep "Source: Parcyl" src/components/DealDetail.jsx  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `feat: update deal detail attribution text to Nightdrop`

---

## Story 8 — localStorage Token Migration (CRITICAL)
**Repo:** nightdrop-dashboard
**Files:** `src/main.jsx`
**Effort:** 30 min (including manual testing)
**Depends on:** Stories 1-7 should be complete first, but this story can technically run independently

**Work:**
Add this function call BEFORE the `createRoot(...)` call in `src/main.jsx`:

```js
// Token migration: df_token → nd_token (one-time, idempotent)
const _old = localStorage.getItem('df_token');
if (_old !== null && localStorage.getItem('nd_token') === null) {
  localStorage.setItem('nd_token', _old);
  localStorage.removeItem('df_token');
} else if (_old !== null) {
  localStorage.removeItem('df_token');
}
```

The file should look like:
```
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
...

// Token migration (runs once, before React mounts)
const _old = localStorage.getItem('df_token');
if (_old !== null && localStorage.getItem('nd_token') === null) {
  localStorage.setItem('nd_token', _old);
  localStorage.removeItem('df_token');
} else if (_old !== null) {
  localStorage.removeItem('df_token');
}

createRoot(document.getElementById('root')).render(...)
```

**Manual validation (required — do not skip):**
1. `npm run dev`
2. Open Chrome DevTools → Application → Local Storage → localhost:5173
3. Manually add key `df_token` with value `test-token-abc`
4. Reload the page
5. Verify `nd_token` = `test-token-abc` exists
6. Verify `df_token` is gone
7. Reload again — verify no duplicate migration (nd_token unchanged, df_token stays gone)

**Commit message:** `feat: add localStorage token migration df_token → nd_token before React mount`

---

## Story 9 — Token Key Rename in useAuth and api.js
**Repo:** nightdrop-dashboard
**Files:** `src/hooks/useAuth.jsx`, `src/lib/api.js`
**Effort:** 15 min
**Depends on:** Story 8 (migration must ship before the key rename)

**Work in useAuth.jsx:**
- Line 11: `localStorage.getItem('df_token')` → `localStorage.getItem('nd_token')`

**Work in api.js:**
- Line 4: `localStorage.getItem('df_token')` → `localStorage.getItem('nd_token')`
- Line 8: `localStorage.setItem('df_token', token)` → `localStorage.setItem('nd_token', token)`
- Line 12: `localStorage.removeItem('df_token')` → `localStorage.removeItem('nd_token')`

**Validation:**
```bash
grep "df_token" src/hooks/useAuth.jsx  # must return 0 lines
grep "df_token" src/lib/api.js         # must return 0 lines
grep "df_token" src/                   # must return 0 lines
npm run build  # must exit 0
npm test  # must exit 0
```
**Commit message:** `refactor: rename localStorage token key df_token → nd_token`

---

## Story 10 — Theme localStorage Key Rename
**Repo:** nightdrop-dashboard
**Files:** `src/App.jsx`
**Effort:** 10 min
**Depends on:** nothing (non-critical localStorage; resets user theme preference — acceptable)

**Work:**
- Lines 23, 112, 121 (approximately): Replace all `parcyl-theme` → `nightdrop-theme`

**Validation:**
```bash
grep "parcyl-theme" src/App.jsx  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `refactor: rename parcyl-theme localStorage key to nightdrop-theme`

---

## Story 11 — Map State localStorage Key Renames
**Repo:** nightdrop-dashboard
**Files:** `src/views/MapView.jsx`
**Effort:** 10 min
**Depends on:** nothing (non-critical; resets map preferences — acceptable)

**Work:**
- Line 21: `parcyl-map-style` → `nightdrop-map-style`
- Line 22: `parcyl-map-viewport` → `nightdrop-map-viewport`
- Line 23: `parcyl-deals-filters` → `nightdrop-deals-filters`
- Line 24: `dealfeed.mapPanel.collapsed` → `nightdrop.mapPanel.collapsed`

**Validation:**
```bash
grep "parcyl-map\|dealfeed\.map\|parcyl-deals" src/views/MapView.jsx  # must return 0 lines
npm run build  # must exit 0
```
**Commit message:** `refactor: rename map and panel localStorage keys to nightdrop-* prefix`

---

## Story 12 — HTML Title and Package Metadata
**Repo:** nightdrop-dashboard
**Files:** `index.html`, `package.json`
**Effort:** 5 min
**Depends on:** nothing

**Work:**
- `index.html` line 7: `<title>nightdrop-dashboard</title>` → `<title>Nightdrop</title>`
- `package.json` line 2: `"name": "nightdrop-dashboard"` → `"name": "nightdrop-dashboard"`

**Validation:**
```bash
grep "nightdrop-dashboard" index.html   # must return 0 lines
grep '"name"' package.json              # must return "nightdrop-dashboard"
npm run build  # must exit 0
```
**Commit message:** `chore: update HTML title and package name to Nightdrop`

---

## Story 13 — Landing Page: netlify.toml Cache Fix
**Repo:** deal-feed-landing (`/Users/birwin/deal-feed-landing/landing_page_audit`)
**Files:** `netlify.toml`
**Effort:** 10 min
**Depends on:** nothing (independent of dashboard)

**Work:**
- Update the `command` field under `[build]` from `npm run build` to `rm -rf .next && npm ci && npm run build`

**Why:** Stale `.next/` chunk IDs cause "Cannot find module './NNN.js'" errors when Netlify reuses cached `.next/` across deploys.

**Validation:**
```bash
cat netlify.toml | grep "command"  # must show the new build command
npm run build  # must exit 0
```
**Commit message:** `fix: clear .next cache before build in netlify.toml`

---

## Story 14 — Landing Page: Env Var Validation + .env.local
**Repo:** deal-feed-landing (`/Users/birwin/deal-feed-landing/landing_page_audit`)
**Files:** `lib/config.ts`, `.env.local` (create new)
**Effort:** 20 min
**Depends on:** nothing

**Work in lib/config.ts:**
- Remove the `??` empty string fallback on `NEXT_PUBLIC_APP_URL`
- Add a startup check: if the value is empty or undefined, throw an error with a clear message: `"NEXT_PUBLIC_APP_URL is not set. Add it to .env.local for dev or Netlify env vars for deploy."`

**Create .env.local:**
```
NEXT_PUBLIC_APP_URL=http://localhost:3456
```
Ensure `.env.local` is already in `.gitignore` (it should be by Next.js default).

**Validation:**
```bash
cat .env.local  # must show NEXT_PUBLIC_APP_URL=http://localhost:3456
grep "NEXT_PUBLIC_APP_URL" .gitignore  # must show it's ignored
npm run build  # must exit 0 (env var is set)
```
**Commit message:** `fix: add NEXT_PUBLIC_APP_URL validation and .env.local for local dev`

---

## Story 15 — Landing Page: Security Headers
**Repo:** deal-feed-landing (`/Users/birwin/deal-feed-landing/landing_page_audit`)
**Files:** `next.config.ts`
**Effort:** 20 min
**Depends on:** nothing

**Work:**
Add HTTP security headers via Next.js `headers()` config function:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Validation:**
```bash
npm run build  # must exit 0
# After deploying: curl -I <url> | grep -i "x-frame\|x-content-type"
```
**Commit message:** `feat: add HTTP security headers to next.config.ts`

---

## Final Verification Checklist (run after all stories complete)

**Dashboard grep assertions:**
```bash
cd /Users/birwin/nightdrop-dashboard

# These must ALL return 0 lines:
grep -r "parcyl-ink\|parcyl-green" src/styles/
grep -r "parcyl-bar" src/
grep -r "ParcylBar" src/
grep -r "df_token" src/
grep -r "parcyl-theme" src/
grep -r "parcyl-map\|dealfeed\.map\|parcyl-deals" src/
grep -r "nightdrop-dashboard" index.html
grep "Source: Parcyl" src/components/DealDetail.jsx
grep "Deal Feed" src/components/NightdropBar.jsx
grep "hello@parcyl.ai" src/

# These must still exist (NOT zero):
grep "brady@parcyl.ai" src/        # admin gate — must be exactly 1 line
grep "#5BCC48" src/                # brand green — must exist
grep "api/dealfeed" src/           # API routes — must exist
```

**Final build and test:**
```bash
npm run build   # must exit 0
npm test        # must exit 0
```

**Manual browser check:**
1. Open localhost:5173
2. Verify browser tab = "Nightdrop"
3. Verify login page heading = "Nightdrop"
4. Log in → verify app bar = "Nightdrop"
5. Verify colors identical to pre-rebrand (no visual regressions)

---

## Commit and Push

After all stories complete and verification passes:
```bash
git push origin main
```
Netlify auto-deploys from main. Verify the production URL after deploy.

## Not Done in This Session (deferred)

- `dealfeed.read.*` and `dealfeed.dealstate.*` localStorage key renames — too risky, deferred
- Netlify site renames — after MVP verified
- GitHub repo renames — after MVP verified
- Social media links in landing page footer — Brady must supply URLs
- Missing image assets (dashboard-preview.png, SVG icons, favicons) — Brady must supply
