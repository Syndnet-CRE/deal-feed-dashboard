# Architecture — Subscriber Invite Flow
Date: 2026-05-03
Author: Architect phase
Requires: PRD.md (complete)

---

## System Overview

Three new moving parts:
1. `df_invite_tokens` table in Neon Postgres
2. Three new API routes in scoutgpt-api (`routes/dealfeed/invites.js`)
3. One new frontend view (`src/views/InviteClaimView.jsx`)

All existing auth infrastructure (bcrypt, JWT, poolWrite, sendWelcomeEmail)
is reused.

---

## Data Model

### New table: `df_invite_tokens`

```sql
CREATE TABLE df_invite_tokens (
  token        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  -- status: pending | claimed | expired
  expires_at   TIMESTAMPTZ NOT NULL,
  claimed_by   UUID REFERENCES df_subscribers(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON df_invite_tokens(email);
CREATE INDEX ON df_invite_tokens(status, expires_at);
```

Tokens are immutable after creation except for the status transition to
`claimed`. No `updated_at` needed. `expires_at` checked at query time.

---

## Backend Routes

### New file: `routes/dealfeed/invites.js`

#### POST /api/dealfeed/admin/invites

Protected by inline `requireAdminSecret` check against `ADMIN_SECRET` env var.

Flow:
1. Validate `x-admin-secret` header — 401 if missing or wrong
2. Validate `email` in body — 400 if missing or malformed
3. Check if email is already a live subscriber — 409 if so
4. Invalidate existing pending tokens for this email (UPDATE status = 'expired')
5. INSERT new token with `expires_at = now() + interval '7 days'`
6. Return `{ token, expires_at }`

#### GET /api/dealfeed/auth/invite/:token

Public. Validates token and returns email for prefill.

Flow:
1. SELECT WHERE token = $1 AND status = 'pending' AND expires_at > now()
2. Not found: 404 `{ error: 'Invalid or expired invite' }` (same for all failure modes — no enumeration)
3. Found: 200 `{ email }`

#### POST /api/dealfeed/auth/invite/:token/claim

Public. Claims token and creates subscriber account.

Flow (single DB transaction):
1. SELECT ... FOR UPDATE WHERE token = $1 AND status = 'pending' AND expires_at > now()
2. Not found: 404
3. Validate `full_name` (required) and `password` (min 12 chars)
4. bcrypt.hash(password, 12)
5. INSERT into df_subscribers (email from token, full_name, password_hash)
   On 23505 conflict: 409
6. UPDATE df_invite_tokens SET status = 'claimed', claimed_by = new_subscriber.id
7. sendWelcomeEmail (fire-and-forget — import from auth.js or extract to shared helper)
8. signToken and return `{ token: jwt, subscriber }` — same shape as login

### Wire into `routes/dealfeed/index.js`

```js
const invites = require('./invites');
router.use('/', invites);
```

---

## Admin Secret Guard

Inline in `invites.js` — no separate middleware file for single-route use:

```js
function requireAdminSecret(req, res, next) {
  if (!process.env.ADMIN_SECRET || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

`ADMIN_SECRET` set in Render env and local `.env`. Never committed.

---

## Frontend Architecture

### Route placement in App.jsx

`/invite/:token` must be outside `AppShell` (which requires auth).

Current pattern — both LoginView and the new InviteClaimView sit at the
same level as AppShell, rendered by the top-level Routes:

```jsx
<Routes>
  <Route path="/login" element={<LoginView />} />
  <Route path="/invite/:token" element={<InviteClaimView />} />
  <Route path="/*" element={<AppShell />} />
</Routes>
```

### InviteClaimView.jsx — State Machine

```
loading → (GET token)
  → invalid: show error state (no form)
  → valid: show form state
      → submitting (POST claim)
          → success: store JWT, navigate('/')
          → error: show inline error, re-enable form
```

State:
- `status`: 'loading' | 'invalid' | 'ready' | 'submitting' | 'error'
- `email`: string (from token validation)
- `errorMsg`: string
- `form`: { full_name, password, confirm }

On mount: `api.get('/api/dealfeed/auth/invite/' + token)`
Note: `api.js` sends `Authorization: Bearer null` when no token is stored.
The invite routes do not use `dealfeedAuth` — they accept requests with no
auth header and ignore whatever is sent.

On claim success: call `login(subscriber)` from `useAuth()` to set AuthContext
state, then `navigate('/')`.

---

## Security Notes

| Risk | Mitigation |
|------|-----------|
| Token brute force | UUID v4 = ~2^122 entropy |
| Double-claim race | `SELECT ... FOR UPDATE` in transaction |
| Email enumeration | Same 404 response for all token failures |
| Admin endpoint exposure | `x-admin-secret` header; env var only |
| Weak passwords | 12-char min enforced server-side |

---

## File Change Summary

### scoutgpt-api
- `migrations/030_invite_tokens.sql` — new table
- `routes/dealfeed/invites.js` — new file (~110 lines)
- `routes/dealfeed/index.js` — add 2 lines to mount invites router

### deal-feed-dashboard
- `src/views/InviteClaimView.jsx` — new file (~130 lines)
- `src/App.jsx` — add 2 lines: import + Route

### Config
- `.env.example` (scoutgpt-api) — add `ADMIN_SECRET=`
- Render env — add `ADMIN_SECRET`

---

## Build Order

1. DB migration (030_invite_tokens.sql)
2. Backend: invites.js + index.js wire-up
3. Frontend: InviteClaimView.jsx + App.jsx route
4. E2E test: full claim flow
