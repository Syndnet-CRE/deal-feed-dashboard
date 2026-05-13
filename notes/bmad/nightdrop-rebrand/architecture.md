# Nightdrop Rebrand — Architecture
Date: 2026-05-08
Author: BMAD Architect

## System Overview

Two frontend repos must be rebranded. They are deployed independently and share no code.

**nightdrop-dashboard** — React 19 SPA, Vite, plain CSS, Netlify
**deal-feed-landing** — Next.js, TypeScript, Netlify

Backend (`scoutgpt-api`, Render) is **frozen** for this task. No route changes.

## Change Categories

### Category A: CSS Variable Rename (Low risk)
Rename `--parcyl-*` CSS custom properties to `--nightdrop-*`. The rename is mechanical: grep-and-replace across three files. Risk: if a `var(--parcyl-*)` call is missed, the variable silently falls back to the browser default (usually transparent/inherit) instead of erroring. The fix is a post-change grep to confirm zero orphaned references.

**Token structure in tokens.css:**
- `--parcyl-ink` → `--nightdrop-ink` (the base near-black color, `#0D0D0D`)
- `--parcyl-green-900/700/500/300` → `--nightdrop-green-900/700/500/300` (the brand greens)
- `--green`, `--green-deep`, `--green-bright` are convenience aliases pointing to the parcyl-green-* vars. These aliases can keep their names, but their values must point to the renamed vars.

### Category B: CSS Class Rename (Low risk)
`.parcyl-bar` is defined once in styles.css and used once in ParcylBar.jsx. Rename both in the same story. No cascade risk.

### Category C: Component File Rename (Medium risk)
Renaming `ParcylBar.jsx` → `NightdropBar.jsx` requires updating the import in `App.jsx`. Vite will immediately error if the import path is wrong — so this failure is immediate and loud, not silent. Commit the rename and the import update together.

### Category D: Brand Text Replacement (Low risk)
String replacements in JSX: "Deal Feed" → "Nightdrop", "Source: Parcyl" → "Source: Nightdrop". No logic changes. Risk is near zero.

### Category E: localStorage Token Migration (CRITICAL — Highest risk)
`df_token` is the session token. If renamed without a migration, every existing browser loses its token and gets logged out on the next page load. This is the highest-risk change in the entire rebrand.

**Migration design (see dedicated section below).**

### Category F: Non-Critical localStorage Keys (Low risk)
`parcyl-theme`, `parcyl-map-style`, `parcyl-map-viewport`, `parcyl-deals-filters`, `dealfeed.mapPanel.collapsed` store UI preferences only. Renaming these causes a one-time reset of user preferences (dark/light mode choice, map position, filters) — acceptable at this stage of the product.

### Category G: HTML/Package Metadata (No risk)
index.html title and package.json name field. No runtime impact.

### Category H: Landing Page Infra Fixes (Low-Medium risk)
netlify.toml cache clear, env var validation in lib/config.ts, security headers in next.config.ts. Each change is independent and testable via build output.

## Implementation Order (with rationale)

```
Step 1: CSS token definitions (tokens.css)
        BEFORE step 2 — you cannot reference a renamed variable before it's defined

Step 2: CSS variable usages (styles.css, deal-detail.css)
        Now safe because step 1 defined the new names

Step 3: CSS class rename (.parcyl-bar → .nightdrop-bar)
        Independent of steps 1-2 but logically groups with CSS work

Step 4: Component rename (ParcylBar → NightdropBar)
        After CSS class rename so no intermediate state with mismatched names

Step 5: Brand text replacement (nav bar, login, deal detail)
        Independent — can run after step 4 since same component file

Step 6: localStorage token migration (main.jsx, useAuth.jsx, api.js)
        CRITICAL — migration function must be added to main.jsx BEFORE the
        new key name (nd_token) is used in useAuth.jsx and api.js. If the key
        rename ships without the migration, all existing sessions break.

Step 7: Non-critical localStorage key renames (theme, map, filters)
        Independent of step 6 — no migration needed, just rename

Step 8: HTML title and package.json
        Independent, any time

Step 9: Landing page infra fixes
        Independent of dashboard work, can run in parallel with steps 1-8
```

## localStorage Migration Design

The migration function runs **synchronously** before `ReactDOM.createRoot()` so it executes before any React code reads from localStorage.

**Pseudocode (architectural intent):**
```
FUNCTION migrateLocalStorageTokens():
  old_token = localStorage.get('df_token')
  new_token = localStorage.get('nd_token')

  IF old_token EXISTS AND new_token DOES NOT EXIST:
    localStorage.set('nd_token', old_token)
    localStorage.remove('df_token')
  ELSE IF old_token EXISTS AND new_token EXISTS:
    // Both exist — new key wins (already migrated or manually set)
    // Clean up old key to avoid confusion
    localStorage.remove('df_token')
  ELSE:
    // No old token — nothing to migrate (new user or already migrated)
    RETURN

END FUNCTION
```

**Placement in main.jsx:**
```
migrateLocalStorageTokens()  ← MUST BE HERE, BEFORE:
createRoot(...).render(...)
```

**Why not inside useAuth?**
`useAuth` runs inside a React `useEffect`, which fires after render. By that time, `localStorage.getItem('nd_token')` returns null (before migration has run), so the user appears logged out. The migration MUST be synchronous and pre-React.

**Atomicity:** localStorage operations are synchronous and single-threaded in the browser. No race condition is possible. The migration is safe.

**Idempotency:** The condition `old_token EXISTS AND new_token DOES NOT EXIST` ensures the migration runs at most once per browser. Running it again after `df_token` is deleted is a no-op.

## CSS Variable Rename Strategy

The rename is a pure string replacement. Three files are affected:

**tokens.css** (definitions, lines 10-19):
- Define the `--nightdrop-*` variables with the same hex values as the `--parcyl-*` variables
- Update `--green`, `--green-deep`, `--green-bright` aliases to point to `--nightdrop-green-*`
- Remove the old `--parcyl-*` definitions

**styles.css** (usages, ~6 occurrences):
- Replace every `var(--parcyl-ink)` → `var(--nightdrop-ink)`
- Replace every `var(--parcyl-green-*)` → `var(--nightdrop-green-*)`

**deal-detail.css** (usages, ~8 occurrences):
- Same replacements as styles.css

**Validation pattern (post-change):**
```
grep -r "parcyl-ink\|parcyl-green\|var(--parcyl" src/styles/
```
Must return zero lines before commit.

**Immutable constraint:** The hex value `#5BCC48` (mid brand green) is NOT changed. Only the CSS variable name wrapping it changes.

## Component Rename Strategy

`ParcylBar.jsx` → `NightdropBar.jsx` is a rename, not a rewrite. Steps:
1. Copy file to new name
2. Update the default export name and internal className to `.nightdrop-bar`
3. Update import in `App.jsx` (3 occurrences: import line, and 2 JSX usages)
4. Delete old file

**Commit atomically:** File rename + import update must be in one commit. A commit with the old file deleted but the import not updated will break the build.

**Validation:** `npm run build` will error immediately if the import path is wrong.

## Parallelization Map

```
Stories that CAN run simultaneously:
  Group A (CSS): tokens.css + styles.css + deal-detail.css
  Group B (Landing): netlify.toml + lib/config.ts + next.config.ts + .env.local

Stories that MUST run serially (dependencies):
  tokens.css BEFORE styles.css/deal-detail.css
  .parcyl-bar CSS rename BEFORE NightdropBar file rename
  main.jsx migration BEFORE useAuth.jsx + api.js nd_token rename
```

Optimal dispatch:
- **Agent A:** CSS token definitions (tokens.css) → CSS usages (styles.css, deal-detail.css) → CSS class rename
- **Agent B:** Landing page infra (netlify.toml, config.ts, next.config.ts, .env.local)
- **Agent C (after A):** Component rename + brand text replacement
- **Agent D (after C):** localStorage migration + nd_token rename
- **Agent E (after D):** Non-critical localStorage key renames + HTML title + package.json

## Rollback Strategy per Phase

| Phase | Rollback method |
|-------|----------------|
| CSS tokens | `git revert <commit>` — zero runtime state affected |
| CSS classes | `git revert <commit>` — zero runtime state affected |
| Component rename | `git revert <commit>` — build will re-resolve old import |
| Brand text | `git revert <commit>` — zero runtime state affected |
| Token migration | `git revert <commit>` — next load, code reads `df_token` again; old sessions work |
| Non-critical localStorage | `git revert <commit>` — prefs reset again on next load (acceptable) |
| HTML/package | `git revert <commit>` — no risk |
| Landing page | `git revert <commit>` — re-deploy restores previous netlify.toml |

No database migrations, no irreversible external state. Every change is `git revert`-able.

## Testing Strategy

### Build verification (after each phase)
```
cd nightdrop-dashboard && npm run build  # must exit 0
cd deal-feed-landing/landing_page_audit && npm run build  # must exit 0
```

### Unit tests (after Phase 6)
```
cd nightdrop-dashboard && npm test  # must exit 0
```
Existing tests in `src/lib/format.test.js` and `src/lib/wizardHelpers.test.js` test pure utility functions, not brand strings. They should pass unchanged.

### Grep validation (after each CSS phase)
```
grep -r "parcyl-ink\|parcyl-green" src/styles/  # must return 0 lines
grep -r "parcyl-bar" src/  # must return 0 lines
grep -r "ParcylBar" src/  # must return 0 lines
grep -r "df_token" src/  # must return 0 lines after Phase 6
grep -r "parcyl-theme\|parcyl-map\|dealfeed\.map" src/  # must return 0 after Phase 7
```

### Token migration verification (manual)
1. In Chrome DevTools → Application → Local Storage → set `df_token` = any string
2. Reload page
3. Verify `nd_token` has the same value and `df_token` is gone
4. Verify app shows authenticated state (or redirects to login if token invalid)

### Visual spot-check
1. Load app in dev mode
2. Verify app bar shows "Nightdrop"
3. Verify login page shows "Nightdrop" heading and `hello@nightdrop.io`
4. Verify no broken styles (colors should be identical — only variable names changed)

## Constraints Validation

At the end of implementation, these grep assertions must ALL return zero results or only expected hits:

```bash
# Admin gate unchanged (should still exist — NOT zero)
grep "brady@parcyl.ai" src/  # must return exactly 1 line (the admin gate in NightdropBar)

# Green color preserved (should still exist — NOT zero)
grep "#5BCC48" src/  # must return at least 1 line (in tokens.css)

# API routes untouched (should still exist — NOT zero)
grep "api/dealfeed" src/  # must return multiple lines (all the API calls)

# Old brand names gone (must be zero — except admin email)
grep -r "parcyl-ink\|parcyl-green\|parcyl-bar\|ParcylBar\|df_token\|parcyl-theme\|parcyl-map\|dealfeed\.map" src/
# → must return 0 lines
```
