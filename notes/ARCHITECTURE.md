# Nightdrop Architecture — Long-Term Plan

**Status:** Captured 2026-05-09 — most items DEFERRED to pre-launch infrastructure sprint.
**Rule during MVP:** Workflow correctness first. Don't execute anything in this doc until the pre-launch sprint unless Brady explicitly says do it now.

---

## North Star

Nightdrop is its own product, fully independent of Parcyl at runtime. The only shared element is the Neon DB cluster, where each product owns a separate endpoint.

```
Nightdrop                                           Parcyl
─────────                                           ──────
Frontend: nightdropai.netlify.app                   Frontend: parcyl-frontend, cortex-frontend, etc
Backend:  nightdrop-api (its own Render service)    Backend:  scoutgpt-app (Render service)
Owns:     df_* tables on DATABASE_WRITE_URL         Owns:     property/parcel tables on DATABASE_URL
Reads:    property tables (read-only, as a dataset) Reads:    its own data only
                                                    Never reads df_* tables
```

**No runtime communication.** No HTTP calls between them. No shared frontend libs. No shared agents. No shared auth. If a Parcyl process ever needs Nightdrop data, it's a violation — the data flow goes through the DB or it doesn't happen.

---

## Current state (MVP, 2026-05-09)

| Surface | Where it lives now |
|---|---|
| Nightdrop frontend | `~/nightdrop-dashboard` → Netlify (`nightdropai.netlify.app`) |
| Nightdrop backend code | `~/parcyl/scoutgpt-api/routes/dealfeed/*` plus `scripts/run_deal_feed.js`, `scripts/backfill_brief_narratives.js`, `migrations/04*_*.sql` |
| Nightdrop runtime | Render service `scoutgpt-app` (shared with Parcyl) |
| Nightdrop DB | `df_*` tables on `DATABASE_WRITE_URL` (Neon, ep-weathered-poetry) |
| Property data | `DATABASE_URL` (Neon, ep-weathered-cell), Parcyl-owned, Nightdrop reads only |

The data layer is already cleanly separated. The code layer is mixed in `scoutgpt-api`. That mixing is the deferred problem.

---

## Pre-launch infrastructure sprint — execute right before public launch

### 1. Extract Nightdrop backend into its own repo

**New repo:** `~/nightdrop-api/`

**Move from `~/parcyl/scoutgpt-api`:**
- `routes/dealfeed/*` → `routes/*` (drop the `dealfeed/` namespace; whole repo is dealfeed)
- `scripts/run_deal_feed.js`
- `scripts/backfill_brief_narratives.js`
- `migrations/043_agent_messages.sql`
- `migrations/044_deal_saved.sql`
- `migrations/045_subscriber_login_security.sql`
- Any `df_*` related migrations created between now and launch
- `db/pool.js` (or copy + deduplicate)
- Any middleware, helpers, or utils that only dealfeed code uses

**Audit before extracting:** grep `routes/dealfeed` and `df_` across all of `~/parcyl/` to find any cross-product imports. Cut them.

### 2. Deploy as its own Render service

- New Render web service: `nightdrop-api`
- Branch: `main` of new repo
- Env vars copied: `DATABASE_URL`, `DATABASE_WRITE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` (or whatever email provider), CORS allowlist
- Health endpoint: `/health`
- Production URL: `nightdrop-api.onrender.com` (or custom subdomain like `api.nightdrop.ai`)

### 3. Cut frontend over

- Update `VITE_API_BASE_URL` in Netlify env to the new backend URL
- Trigger Netlify redeploy
- Verify login + feed + agent message + admin all hit the new backend
- Once verified, delete `routes/dealfeed/*` from `scoutgpt-api` and redeploy `scoutgpt-app`

### 4. DB pool sizing

- New Render service = new connection pool against the same Neon endpoints
- Bump Neon compute size if pool count gets close to limits
- Both services should use Neon's pooler endpoint, not the direct endpoint

### 5. Delete legacy Render service

- `scoutgpt-api.onrender.com` (the empty-DB free-tier dev service) is unused and adds confusion. Delete or repurpose during the sprint.

---

## Repo and folder cleanup (also deferred)

```
~/nightdrop-dashboard/      ← unchanged, stays where it is
~/nightdrop-api/            ← new during pre-launch sprint
~/scoutgpt-api/             ← move out of ~/parcyl/ during sprint, becomes Parcyl backend only
~/_archive/                 ← move dead repos here:
   deal-feed-landing/
   deal-feed-landing-extract/
   nightdrop-web/
   parcyl-landing/
   scoutgpt-v2/
   parcyl-w1..w5/           (verify no live branches first)
~/parcyl/notes/archive/     ← sweep ~/parcyl/ root *.md audit/handoff/sprint files here
```

Optional umbrella for working ergonomics:

```
~/nightdrop/
   frontend -> ~/nightdrop-dashboard
   backend  -> ~/nightdrop-api
   notes/
   README.md
```

---

## Rules that apply right now during MVP

Even though we're not splitting the backend yet, the runtime rule still holds at the code level:

- `routes/dealfeed/*` must not import from non-dealfeed modules
- Non-dealfeed code must not import from `routes/dealfeed/*` or any script touching `df_*`
- `df_*` tables: never read or written by anything outside dealfeed code paths
- Property tables: Nightdrop reads only, never writes
- No new "shared" abstraction between the two products. If extraction is tempting, copy-paste instead — copies are cheaper to delete than couplings.

These rules make the eventual extraction a cut-and-move, not a refactor.

---

## What stays shared forever

- The Neon DB cluster (separate endpoints, separate ownership, but one Neon project for billing)
- Mapbox token (frontend env, no coupling)
- Domain registrar / DNS

That's it.

---

## Definition of done for the pre-launch sprint

- [ ] `nightdrop-api` repo exists, builds, passes tests
- [ ] `nightdrop-api` Render service deployed and healthy
- [ ] Frontend `VITE_API_BASE_URL` cut over and verified end-to-end
- [ ] Dealfeed routes deleted from `scoutgpt-app`, redeployed clean
- [ ] CORS allowlist on `nightdrop-api` matches production frontend domains only
- [ ] All `df_*` migrations applied to `DATABASE_WRITE_URL`
- [ ] Login → feed → agent message → save deal → admin views all green from production frontend against new backend
- [ ] Dead repos archived
- [ ] HANDOFF.md updated with new topology
- [ ] CLAUDE.md in both `nightdrop-dashboard` and `nightdrop-api` updated; old `scoutgpt-api` CLAUDE.md scrubbed of dealfeed references
