# Stories — Subscriber Invite Flow
Date: 2026-05-03
Author: SM phase
Requires: architecture.md (complete)

Max 2 hours per story. Implement in order. Each story requires passing tests
before marked complete.

---

## Story 1 — DB Migration: df_invite_tokens table
Estimate: 30 min
Repo: scoutgpt-api

Tasks:
- Write `migrations/030_invite_tokens.sql` with table + indexes per architecture.md
- Run migration against Neon
- Confirm: `SELECT * FROM df_invite_tokens LIMIT 1;` returns empty set (not error)

Test: migration runs without error; table exists with correct columns.
No application code in this story.

---

## Story 2 — Backend: Admin invite generation route
Estimate: 1.5 hours
Repo: scoutgpt-api

Tasks:
- Create `routes/dealfeed/invites.js`
- Implement inline `requireAdminSecret` guard (x-admin-secret header vs. ADMIN_SECRET env)
- Implement `POST /api/dealfeed/admin/invites`:
  - Validate header (401 if wrong/missing)
  - Validate email in body (400 if missing)
  - Check for existing live subscriber with that email (409)
  - Invalidate old pending tokens for email (UPDATE status = 'expired')
  - INSERT new token, expires_at = now() + 7 days
  - Return { token, expires_at }
- Wire into `routes/dealfeed/index.js`
- Add `ADMIN_SECRET=` to `.env.example`

Test file: `tests/invites-admin.test.js`
- Returns 401 when header missing
- Returns 401 when header wrong
- Returns 409 when email is already a subscriber
- Returns 201 with token for valid new email
- Invalidates old pending token and issues new one for same email

Agents: tdd-guide before coding; code-reviewer + security-reviewer after

---

## Story 3 — Backend: Invite validation and claim routes
Estimate: 1.5 hours
Repo: scoutgpt-api

Tasks:
- Add to `routes/dealfeed/invites.js`:
  - `GET /api/dealfeed/auth/invite/:token` — validate + return { email }
  - `POST /api/dealfeed/auth/invite/:token/claim` — create subscriber, return JWT
- Claim route uses DB transaction with SELECT FOR UPDATE to prevent double-claim
- Extract or import `sendWelcomeEmail` and `signToken` from auth.js

Test file: `tests/invites-claim.test.js`
- GET returns 404 for nonexistent token
- GET returns 404 for expired token
- GET returns 404 for already-claimed token
- GET returns 200 with email for valid pending token
- POST claim returns 404 for invalid token
- POST claim creates subscriber and returns JWT for valid token
- POST claim marks token claimed; second attempt returns 404
- POST claim returns 400 for missing full_name
- POST claim returns 400 for password under 12 characters

Agents: tdd-guide before coding; code-reviewer + security-reviewer after

---

## Story 4 — Frontend: InviteClaimView and route
Estimate: 1.5 hours
Repo: nightdrop-dashboard

Tasks:
- Create `src/views/InviteClaimView.jsx`:
  - On mount: GET /api/dealfeed/auth/invite/:token
  - Invalid/expired state: error message only, no form
  - Valid state: read-only email, full_name input, password, confirm password
  - Client-side: passwords match + length >= 12 before submitting
  - On submit: POST /claim, store JWT as df_token, call login() from useAuth,
    navigate('/')
- Add `/invite/:token` Route in `src/App.jsx` outside AppShell
- Use existing CSS classes: field, input, btn, modal-body patterns

Test file: `tests/invite-claim.spec.js` (Playwright E2E)
- Invalid token URL shows error message, no form visible
- Valid token URL shows prefilled email and form fields
- Submitting valid form logs in and redirects to /
- Mismatched passwords shows inline error without submitting

Agents: tdd-guide; code-reviewer after; e2e-runner for Playwright test

---

## Story 5 — Integration smoke + Brady usage doc
Estimate: 30 min
Repo: both

Tasks:
- Run full flow manually: generate invite, claim it, verify dashboard loads
- Write `notes/bmad/subscriber-invite/INVITE_USAGE.md` with:
  - Exact curl command Brady uses to generate an invite
  - What URL Brady sends to colleague
  - What the colleague does to claim it
- Commit and push both repos

Test: Brady successfully onboards at least one colleague end-to-end.

---

## Per-Story Checklist

Before each story:
- [ ] tdd-guide agent (backend stories 2-3) or review existing E2E setup (story 4)
- [ ] Write tests first (RED), then implement (GREEN)

After each story:
- [ ] code-reviewer agent
- [ ] security-reviewer on Stories 2 and 3
- [ ] e2e-runner on Story 4
- [ ] /quality-gate before commit
- [ ] Push to main
