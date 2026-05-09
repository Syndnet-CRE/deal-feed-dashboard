# HANDOFF
Date: 2026-05-09
Repo: nightdrop-web (at ~/nightdrop-web)
Session objective: Complete nightdrop-web wiring — providers, deal detail route, ConfigurationOverlay
Status: COMPLETE — build passes clean, all routes wired, dev server verified

## What was done

### nightdrop-web — fully wired, 9 routes

Next.js 16 App Router, React 19 JSX, Tailwind + --nightdrop-* tokens, Manrope font.

**Routes:**
- `/` — landing page
- `/login` — auth
- `/signup` — waitlist stub
- `/onboarding` — fixes the 404 bug (invited subscribers hit this after activation)
- `/forgot-password`
- `/invite/[token]` — invite claim flow
- `/app` — dashboard shell with client-side auth guard
- `/app/deal/[id]` — NEW — deal detail page with back nav and not-found state

**Providers confirmed wrapped** in `app/app/layout.jsx`:
- AuthProvider, ToastProvider, DealsProvider, ReadStateProvider, DealStateProvider
- Auth guard in the same layout checks `nd_token` in localStorage; redirects to /login if missing

**ConfigurationOverlay wired** in `app/app/page.jsx`:
- Opens on `showWizard` (new box) or `editingBuyBox` (edit mode)
- Fixed all import paths in `configuration-overlay.jsx` (was using old relative paths from deal-feed-dashboard)
- Added default export alias to the file (`export default BuyBoxWizard`)
- Copied missing `styles/buy-box-wizard.css` from source repo

**NightdropBar fixed**: Profile button was pushing to `/app/settings` (route doesn't exist); fixed to `onSetView('settings')`.

**Build:** `npm run build` exits 0, all 9 routes compile.

**Commits:** 3 commits on main in ~/nightdrop-web (no GitHub remote yet)

### ctx-watch.sh and PreCompact hook

- `~/.claude/scripts/ctx-watch.sh` fires on UserPromptSubmit, shows context % in terminal
- PreCompact hook in settings.json stamps HANDOFF.md before every compact

## Dev server verified

```bash
cd ~/nightdrop-web && npm run dev
```

- `/` — landing renders (full hero, features, pricing, FAQ, footer)
- `/login` — renders correctly
- `/app` — returns 200 (auth guard is client-side; redirects to /login on load when no token)

## Stubs (wire before launch)

| Stub | File | What's needed |
|------|------|---------------|
| Waitlist email | app/signup/page.jsx | Real API endpoint or Resend/Loops |
| Social URLs | components/landing/footer.jsx | Twitter, GitHub, LinkedIn URLs |
| Favicons | app/favicon.ico (placeholder) | Brand asset files |
| MapView | components/dashboard/views/map-view.jsx | Verify full Mapbox impl vs stub |

## What was NOT done

- GitHub remote not created (Brady must create Syndnet-CRE/nightdrop-web)
- Netlify site not connected
- MapView not verified — may still be a stub without a running Mapbox token

## Next session

```bash
cd ~/nightdrop-web && npm run dev
```

Then test end-to-end:
1. Log in with real credentials (need NEXT_PUBLIC_API_BASE_URL set)
2. Verify dashboard views switch correctly
3. Open a deal — verify deal detail page loads
4. Click "New Box" — verify ConfigurationOverlay opens
5. Check MapView renders Mapbox tiles (not a stub)

To test locally with the backend: set `.env.local` with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=<token>
```

## Blockers for Brady

1. Create GitHub repo Syndnet-CRE/nightdrop-web and:
   ```bash
   cd ~/nightdrop-web && git remote add origin <url> && git push -u origin main
   ```
2. Create Netlify site connected to that repo, set env vars:
   - NEXT_PUBLIC_API_BASE_URL (backend URL)
   - NEXT_PUBLIC_MAPBOX_TOKEN
3. Decide waitlist email destination (Resend? Loops? Custom endpoint?)
4. Verify MapView — check components/dashboard/views/map-view.jsx for Mapbox vs stub
