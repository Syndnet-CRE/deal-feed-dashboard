# Nightdrop Rebrand — Full BMAD Review Document
Date: 2026-05-08
Status: AWAITING BRADY APPROVAL BEFORE ANY CODE IS WRITTEN

---

# PART 1: REQUIREMENTS
*Author: BMAD Analyst*

## Business Objective

The product was formerly branded as "Deal Feed" / "Deal Runner" / "Parcyl". It is now called **Nightdrop**. All visible brand references in the two frontend repos must be updated before any marketing or external sharing. Backend API routes are NOT being renamed this session — only the frontend and styling layer.

## Scope

### In Scope
- CSS custom property renames (`--parcyl-*` → `--nightdrop-*`) in both repos
- CSS class renames (`.parcyl-bar` → `.nightdrop-bar`)
- Component renames (`ParcylBar` → `NightdropBar`)
- User-visible brand text ("Deal Feed" → "Nightdrop", "Parcyl" → "Nightdrop")
- Contact email (`hello@parcyl.ai` → `hello@nightdrop.io`) in LoginView
- localStorage key migration (`df_token` → `nd_token`, `parcyl-theme` → `nightdrop-theme`, `parcyl-map-*` → `nightdrop-map-*`)
- HTML page title and package.json name field
- Landing page netlify.toml (add cache clear), lib/config.ts (env var validation), next.config.ts (security headers)
- Landing page `.env.local` for development

### Out of Scope (This Session)
- Backend API routes (`/api/dealfeed/*`) — NOT renamed
- Dynamic localStorage keys `dealfeed.read.*` and `dealfeed.dealstate.*` — too risky, deferred
- Netlify site renames — after MVP verified
- GitHub repo renames — after MVP verified
- Missing image assets (dashboard-preview.png, 6 MCP SVG icons, 4 favicon files) — Brady must supply
- Social media footer links — Brady must supply real URLs
- Custom domain configuration

## Functional Requirements

### R-01 — CSS Design Token Rename (CRITICAL)
Rename all `--parcyl-*` CSS custom properties to `--nightdrop-*`:
- `src/styles/tokens.css` lines 10-19: `--parcyl-ink`, `--parcyl-green-900/700/500/300` → `--nightdrop-*`
- `src/styles/styles.css` lines 1481, 1493, 1501, 2345, 2629: update `var(--parcyl-*)` references
- `src/styles/deal-detail.css` lines 13, 41, 259, 260, 327, 405, 533, 1017: update `var(--parcyl-green-*)` references

Acceptance: `grep -r "parcyl-ink\|parcyl-green" src/styles/` returns 0 lines.

### R-02 — CSS Class Rename
Rename `.parcyl-bar` → `.nightdrop-bar` in `src/styles/styles.css` (definition) and `src/components/ParcylBar.jsx` line 87 (usage).

### R-03 — Component Rename: ParcylBar → NightdropBar
Rename file, update default export, update import and JSX usage in `src/App.jsx` lines 23, 112, 121.

### R-04 — Navigation Bar Brand Text
Replace "Deal Feed" with "Nightdrop" in `NightdropBar.jsx` lines 88-90.

### R-05 — Login Page Brand Text and Contact
- `src/views/LoginView.jsx` line 32: "Deal Feed" → "Nightdrop"
- `src/views/LoginView.jsx` line 75: `hello@parcyl.ai` → `hello@nightdrop.io`

### R-06 — Deal Detail Attribution Text
Replace all "Source: Parcyl..." with "Source: Nightdrop" in `src/components/DealDetail.jsx` at 11 line locations (424, 457, 465, 487, 521, 534, 558, 594, 602, 625, 629).

### R-07 — localStorage Token Migration (CRITICAL — DATA PRESERVATION)
Existing users have `df_token` in localStorage. Renaming without migration logs them all out.

Migration runs **before ReactDOM.createRoot()** in `src/main.jsx`:
```js
const _old = localStorage.getItem('df_token');
if (_old !== null && localStorage.getItem('nd_token') === null) {
  localStorage.setItem('nd_token', _old);
  localStorage.removeItem('df_token');
} else if (_old !== null) {
  localStorage.removeItem('df_token');
}
```

After migration ships: update `src/hooks/useAuth.jsx` line 11 and `src/lib/api.js` lines 4, 8, 12 to use `nd_token`.

### R-08 — Theme localStorage Key Rename
`src/App.jsx`: `parcyl-theme` → `nightdrop-theme`. Theme preference resets once — acceptable.

### R-09 — Map State localStorage Key Renames
`src/views/MapView.jsx` lines 21-24: rename `parcyl-map-style`, `parcyl-map-viewport`, `parcyl-deals-filters`, `dealfeed.mapPanel.collapsed` to `nightdrop-*` equivalents. Map prefs reset once — acceptable.

### R-10 — HTML Title
`index.html` line 7: `<title>Nightdrop</title>`

### R-11 — Package Metadata
`package.json` line 2: `"name": "nightdrop-dashboard"`

### R-12 — Landing Page: netlify.toml Cache Fix
Build command: `rm -rf .next && npm ci && npm run build`
Why: stale `.next/` chunk IDs cause "Cannot find module" errors on Netlify.

### R-13 — Landing Page: Env Var Validation
`lib/config.ts`: throw if `NEXT_PUBLIC_APP_URL` is unset. Create `.env.local` with `NEXT_PUBLIC_APP_URL=http://localhost:3456`.

### R-14 — Landing Page: Security Headers
`next.config.ts`: add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

## Non-Functional Requirements

- NFR-01: Both repos build cleanly after all changes
- NFR-02: `npm test` passes in nightdrop-dashboard
- NFR-03: No console errors on fresh load
- NFR-04: No duplicate CSS property definitions
- NFR-05: Each story independently committable and revertible

## Constraints (Immutable)

1. Admin gate email `brady@parcyl.ai` is NOT changed
2. Green color `#5BCC48` is NOT changed — only the CSS variable name wrapping it changes
3. API routes `/api/dealfeed/*` are NOT renamed
4. Dynamic localStorage keys `dealfeed.read.*` and `dealfeed.dealstate.*` are deferred

## Open Questions — Brady Must Answer Before Execution

1. **Contact email:** Is `hello@nightdrop.io` the correct replacement for `hello@parcyl.ai`?
2. **Social media URLs:** Provide real Twitter/LinkedIn/GitHub URLs for landing page footer, or confirm `href="#"` is acceptable for MVP.
3. **Image assets:** When will dashboard-preview.png, 6 MCP SVG icons, and 4 favicon files be provided?

---

# PART 2: PRD
*Author: BMAD PM*

## Goals and Success Metrics

| Goal | Metric |
|------|--------|
| Unified brand | Zero "Parcyl", "Deal Feed", "Deal Runner" in user-visible UI |
| Zero session loss | Existing users retain login after deployment |
| Clean codebase | All CSS classes, component names, localStorage keys use Nightdrop naming |
| Build stable | Both repos build cleanly; all tests pass; zero console errors on fresh load |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Token migration logs out existing users | Low | CRITICAL | Idempotent copy-then-delete before ReactDOM mount; manual browser test required |
| CSS variable rename breaks UI | Low | Medium | Post-change grep confirms zero orphaned refs before commit |
| Missing assets break landing page | High | Medium | Left as stubs; Brady must supply before public launch |
| Admin gate email accidentally changed | Low | CRITICAL | Hard constraint: `brady@parcyl.ai` is never touched |

## Blockers for Brady

1. Confirm `hello@nightdrop.io` as replacement contact email
2. Provide real social media URLs for landing page footer
3. Provide dashboard-preview.png and 6 MCP SVG icons for `/public/images/`
4. Confirm `brady@parcyl.ai` admin gate stays unchanged

## Acceptance Criteria

1. `grep -r "parcyl-ink\|parcyl-green\|parcyl-bar\|ParcylBar\|Deal Feed" src/` returns 0 applicable hits
2. Existing user with `df_token` set remains authenticated after deployment
3. `npm run build` exits 0 in both repos
4. `npm test` exits 0 in nightdrop-dashboard
5. Browser tab title reads "Nightdrop"
6. App bar shows "Nightdrop"
7. Login page shows "Nightdrop" and `hello@nightdrop.io`
8. Zero console errors on fresh load

---

# PART 3: ARCHITECTURE
*Author: BMAD Architect*

## Change Risk Classification

| Category | Risk | Notes |
|----------|------|-------|
| CSS variable rename | Low | Missed refs fail silently (invisible color); grep validates |
| CSS class rename | Low | One definition, one usage; no cascade |
| Component file rename | Medium | Build fails immediately if import not updated atomically |
| Brand text replacement | Low | String-only, no logic changes |
| localStorage token migration | **CRITICAL** | Missing migration logs out all existing users |
| Non-critical localStorage keys | Low | Resets UI prefs; acceptable at this stage |
| HTML/package metadata | None | No runtime impact |
| Landing page infra | Low-Medium | Each change independently testable via build |

## Implementation Order (Serial Dependencies)

```
1. tokens.css (CSS variable definitions)
        ↓ MUST BE BEFORE ↓
2. styles.css + deal-detail.css (CSS variable usages)
        ↓ MUST BE BEFORE ↓
3. .parcyl-bar CSS class rename
        ↓ MUST BE BEFORE ↓
4. ParcylBar.jsx file rename → NightdropBar.jsx + App.jsx import update (ATOMIC)

5. Brand text (nav bar, login, deal detail) — independent, runs after step 4

6. main.jsx token migration (CRITICAL)
        ↓ MUST BE BEFORE ↓
7. useAuth.jsx + api.js nd_token rename

8. Non-critical localStorage keys (theme, map) — independent of steps 6-7
9. HTML title + package.json — independent, any time
10. Landing page (netlify.toml, config.ts, next.config.ts) — independent of dashboard
```

## localStorage Migration Design (Architectural Intent)

The migration runs **synchronously before ReactDOM.createRoot()** — it cannot be inside a React useEffect because useEffect fires after render, by which time the auth hook has already checked for `nd_token` (which doesn't exist yet) and shown the login screen.

```
BEFORE React mounts:
  old = get('df_token')
  new = get('nd_token')

  IF old EXISTS AND new DOES NOT EXIST → copy old to new, delete old
  IF old EXISTS AND new EXISTS → delete old (already migrated)
  IF old DOES NOT EXIST → no-op (new user or already migrated)
```

This is idempotent: second run is always a no-op. localStorage is synchronous and single-threaded: no race conditions.

## Parallelization Map

```
Parallel Track A (Dashboard CSS + Component):
  Story 1 → Story 2 → Story 3 → Story 4 → Story 5

Parallel Track B (Landing Page):
  Stories 13, 14, 15 (fully independent)

Parallel Track C (Dashboard Text + Misc):
  Stories 6, 7, 10, 11, 12 (independent of each other)

Serial Track D (Token Migration — must run last):
  Story 8 → Story 9
```

## Rollback: Every Change is `git revert`-able

No database migrations, no irreversible external state. Every story can be reverted independently. Token migration revert: code reads `df_token` again on next load; existing sessions unaffected.

## Post-Implementation Validation Greps

```bash
# Must return 0 lines (old brand gone):
grep -r "parcyl-ink\|parcyl-green" src/styles/
grep -r "parcyl-bar" src/
grep -r "ParcylBar" src/
grep -r "df_token" src/
grep -r "parcyl-theme\|parcyl-map\|dealfeed\.map\|parcyl-deals" src/

# Must still exist (constraints preserved):
grep "brady@parcyl.ai" src/    # exactly 1 line — admin gate unchanged
grep "#5BCC48" src/             # at least 1 line — green color preserved
grep "api/dealfeed" src/        # multiple lines — API routes unchanged
```

---

# PART 4: STORIES
*Author: BMAD SM*
*Status: READY FOR IMPLEMENTATION*

Stories are ordered by dependency. Each is independently committable and revertible. Estimated effort per story is under 30 min.

---

## Story 1 — CSS Token Definitions
**Repo:** nightdrop-dashboard | **File:** `src/styles/tokens.css` | **Effort:** 15 min | **Depends on:** nothing

Rename `--parcyl-ink` → `--nightdrop-ink`, `--parcyl-green-900/700/500/300` → `--nightdrop-green-900/700/500/300`. Update `--green`, `--green-deep`, `--green-bright` aliases. Update header comment. Keep all hex values identical.

**DO NOT change `#5BCC48` or any other hex value.**

Validate: `grep "parcyl-ink\|parcyl-green" src/styles/tokens.css` returns 0. `npm run build` exits 0.

Commit: `refactor: rename --parcyl-* CSS tokens to --nightdrop-* in tokens.css`

---

## Story 2 — CSS Token References
**Repo:** nightdrop-dashboard | **Files:** `src/styles/styles.css`, `src/styles/deal-detail.css` | **Effort:** 20 min | **Depends on:** Story 1

- `styles.css` lines 1481, 1493, 1501, 2345, 2629: `var(--parcyl-ink)` → `var(--nightdrop-ink)`
- `deal-detail.css` lines 13, 41, 259, 260, 327, 405, 533, 1017: `var(--parcyl-green-*)` → `var(--nightdrop-green-*)`

Validate: `grep "var(--parcyl" src/styles/styles.css` returns 0. Same for deal-detail.css. Build exits 0.

Commit: `refactor: update var(--parcyl-*) references to var(--nightdrop-*)`

---

## Story 3 — CSS Class Rename
**Repo:** nightdrop-dashboard | **Files:** `src/styles/styles.css`, `src/components/ParcylBar.jsx` | **Effort:** 10 min | **Depends on:** Story 2

- `styles.css`: rename `.parcyl-bar` selector → `.nightdrop-bar`
- `ParcylBar.jsx` line 87: `className="parcyl-bar"` → `className="nightdrop-bar"`

Do NOT rename the file yet — that is Story 4.

Validate: `grep -r "parcyl-bar" src/` returns 0. Build exits 0.

Commit: `refactor: rename .parcyl-bar CSS class to .nightdrop-bar`

---

## Story 4 — Component File Rename (ATOMIC COMMIT)
**Repo:** nightdrop-dashboard | **Files:** `src/components/ParcylBar.jsx` → `NightdropBar.jsx`, `src/App.jsx` | **Effort:** 15 min | **Depends on:** Story 3

1. Copy ParcylBar.jsx → NightdropBar.jsx
2. Update default export name `ParcylBar` → `NightdropBar`
3. `src/App.jsx` line 23: update import path
4. `src/App.jsx` lines 112, 121: `<ParcylBar` → `<NightdropBar`
5. Delete `src/components/ParcylBar.jsx`

File rename + import update must be in the same commit — split commit breaks the build.

Validate: `grep -r "ParcylBar" src/` returns 0. Build exits 0.

Commit: `refactor: rename ParcylBar component to NightdropBar`

---

## Story 5 — Navigation Bar Brand Text
**Repo:** nightdrop-dashboard | **File:** `src/components/NightdropBar.jsx` | **Effort:** 10 min | **Depends on:** Story 4

Replace "Deal Feed" text (lines 88-90 approx) with "Nightdrop".

**DO NOT touch the admin gate check: `subscriber?.email === 'brady@parcyl.ai'` — this stays exactly as-is.**

Validate:
- `grep "Deal Feed" src/components/NightdropBar.jsx` → 0 lines
- `grep "brady@parcyl.ai" src/components/NightdropBar.jsx` → exactly 1 line

Commit: `feat: update nav bar brand text to Nightdrop`

---

## Story 6 — Login Page Brand Text and Contact Email
**Repo:** nightdrop-dashboard | **File:** `src/views/LoginView.jsx` | **Effort:** 10 min | **Depends on:** nothing (independent)

- Line 32: "Deal Feed" → "Nightdrop"
- Line 75: `hello@parcyl.ai` → `hello@nightdrop.io`

Validate: `grep "Deal Feed\|parcyl.ai" src/views/LoginView.jsx` returns 0.

Commit: `feat: update LoginView brand text and contact email to Nightdrop`

---

## Story 7 — Deal Detail Attribution Text
**Repo:** nightdrop-dashboard | **File:** `src/components/DealDetail.jsx` | **Effort:** 20 min | **Depends on:** nothing (independent)

At lines 424, 457, 465, 487, 521, 534, 558, 594, 602, 625, 629: replace "Source: Parcyl" → "Source: Nightdrop" (11 occurrences).

Validate: `grep "Source: Parcyl" src/components/DealDetail.jsx` returns 0. Build exits 0.

Commit: `feat: update deal detail attribution text to Nightdrop`

---

## Story 8 — localStorage Token Migration (CRITICAL)
**Repo:** nightdrop-dashboard | **File:** `src/main.jsx` | **Effort:** 30 min | **Depends on:** Stories 1-7 ideally complete first

Add before `createRoot(...)`:
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

**Manual validation required (do not skip):**
1. `npm run dev`
2. DevTools → Application → Local Storage → manually set `df_token = test-token-abc`
3. Reload → verify `nd_token = test-token-abc`, `df_token` is gone
4. Reload again → verify no re-migration (nd_token unchanged, df_token stays gone)

Commit: `feat: add localStorage token migration df_token → nd_token before React mount`

---

## Story 9 — Token Key Rename in Code
**Repo:** nightdrop-dashboard | **Files:** `src/hooks/useAuth.jsx`, `src/lib/api.js` | **Effort:** 15 min | **Depends on:** Story 8

- `useAuth.jsx` line 11: `localStorage.getItem('df_token')` → `localStorage.getItem('nd_token')`
- `api.js` lines 4, 8, 12: all `df_token` → `nd_token`

Validate:
```bash
grep "df_token" src/hooks/useAuth.jsx  # 0 lines
grep "df_token" src/lib/api.js         # 0 lines
npm run build && npm test              # both exit 0
```
Commit: `refactor: rename localStorage token key df_token → nd_token`

---

## Story 10 — Theme localStorage Key Rename
**Repo:** nightdrop-dashboard | **File:** `src/App.jsx` | **Effort:** 10 min | **Depends on:** nothing

`parcyl-theme` → `nightdrop-theme` (lines 23, 112, 121 approx). Theme resets once — acceptable.

Validate: `grep "parcyl-theme" src/App.jsx` returns 0. Build exits 0.

Commit: `refactor: rename parcyl-theme localStorage key to nightdrop-theme`

---

## Story 11 — Map State localStorage Key Renames
**Repo:** nightdrop-dashboard | **File:** `src/views/MapView.jsx` | **Effort:** 10 min | **Depends on:** nothing

Lines 21-24 approx:
- `parcyl-map-style` → `nightdrop-map-style`
- `parcyl-map-viewport` → `nightdrop-map-viewport`
- `parcyl-deals-filters` → `nightdrop-deals-filters`
- `dealfeed.mapPanel.collapsed` → `nightdrop.mapPanel.collapsed`

Map prefs reset once — acceptable.

Validate: `grep "parcyl-map\|dealfeed\.map\|parcyl-deals" src/views/MapView.jsx` returns 0. Build exits 0.

Commit: `refactor: rename map and panel localStorage keys to nightdrop-* prefix`

---

## Story 12 — HTML Title and Package Metadata
**Repo:** nightdrop-dashboard | **Files:** `index.html`, `package.json` | **Effort:** 5 min | **Depends on:** nothing

- `index.html` line 7: `<title>Nightdrop</title>`
- `package.json` line 2: `"name": "nightdrop-dashboard"`

Validate: `grep "nightdrop-dashboard" index.html` returns 0. Build exits 0.

Commit: `chore: update HTML title and package name to Nightdrop`

---

## Story 13 — Landing Page: netlify.toml Cache Fix
**Repo:** deal-feed-landing | **File:** `netlify.toml` | **Effort:** 10 min | **Depends on:** nothing

Change build command to: `rm -rf .next && npm ci && npm run build`

Why: stale `.next/` chunk IDs cause "Cannot find module" errors on Netlify.

Validate: `cat netlify.toml | grep "command"` shows new command. `npm run build` exits 0.

Commit: `fix: clear .next cache before build in netlify.toml`

---

## Story 14 — Landing Page: Env Var Validation + .env.local
**Repo:** deal-feed-landing | **Files:** `lib/config.ts`, `.env.local` | **Effort:** 20 min | **Depends on:** nothing

- `lib/config.ts`: throw clear error if `NEXT_PUBLIC_APP_URL` is unset (remove `??` empty string fallback)
- Create `.env.local`: `NEXT_PUBLIC_APP_URL=http://localhost:3456`
- Verify `.env.local` is in `.gitignore`

Validate: `npm run build` exits 0 (env var is set). Temporarily unset it and verify build fails with clear message.

Commit: `fix: add NEXT_PUBLIC_APP_URL validation and .env.local for local dev`

---

## Story 15 — Landing Page: Security Headers
**Repo:** deal-feed-landing | **File:** `next.config.ts` | **Effort:** 20 min | **Depends on:** nothing

Add via `headers()` config:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Validate: `npm run build` exits 0.

Commit: `feat: add HTTP security headers to next.config.ts`

---

## Final Verification Checklist

```bash
cd /Users/birwin/nightdrop-dashboard

# All must return 0 lines:
grep -r "parcyl-ink\|parcyl-green" src/styles/
grep -r "parcyl-bar" src/
grep -r "ParcylBar" src/
grep -r "df_token" src/
grep -r "parcyl-theme" src/
grep -r "parcyl-map\|dealfeed\.map\|parcyl-deals" src/
grep "Source: Parcyl" src/components/DealDetail.jsx
grep "Deal Feed" src/components/NightdropBar.jsx
grep "hello@parcyl.ai" src/

# All must still exist:
grep "brady@parcyl.ai" src/    # exactly 1 line
grep "#5BCC48" src/             # at least 1 line
grep "api/dealfeed" src/        # multiple lines

npm run build   # exits 0
npm test        # exits 0
```

Manual browser check:
1. Tab title = "Nightdrop"
2. Login page heading = "Nightdrop", contact = `hello@nightdrop.io`
3. Log in → app bar = "Nightdrop"
4. Colors visually identical (no regressions)
5. localStorage: `df_token` migrated to `nd_token` on first load

---

## Deferred to Future Session

- `dealfeed.read.*` and `dealfeed.dealstate.*` localStorage key renames
- Netlify site renames (dealrunner.netlify.app → nightdrop.netlify.app)
- GitHub repo renames
- Social media links in landing page footer (Brady must supply URLs)
- Missing image assets (Brady must supply before public launch)
