# Requirements — Subscriber Invite Flow
Date: 2026-05-03
Author: Analyst phase

## Source of Truth
Brady's spec (verbal, 2026-05-03) + codebase audit of:
- ~/parcyl/scoutgpt-api/routes/dealfeed/auth.js (signup/login/me)
- ~/parcyl/scoutgpt-api/migrations/018_dealfeed.sql (df_subscribers schema)
- ~/nightdrop-dashboard/src/views/LoginView.jsx
- ~/nightdrop-dashboard/src/lib/api.js (api layer)

---

## Current State

`POST /api/dealfeed/auth/signup` already exists and creates a subscriber. It is
NOT currently linked to an invite gate — anyone with the URL could call it.

Brady needs an invite-only flow: he generates a link, sends it to a colleague,
the colleague lands on a page, sets a password, and ends up logged in.

No invite tokens table exists. No frontend invite-claim page exists.

---

## R1 — Invite Lifecycle

An invite is a one-time, expiring token tied to an email address.

States: `pending` → `claimed` | `expired`

Lifecycle:
1. Brady (admin) POSTs to a backend endpoint with an email address
2. Backend creates a token row (UUID token, email, 7-day expiry)
3. Backend returns the full invite URL (or Brady constructs it)
4. Brady copies the link and sends it to the invitee via any channel (email, Slack)
5. Invitee clicks the link, lands on `/invite/:token` in the frontend
6. Frontend calls `GET /api/dealfeed/auth/invite/:token` to validate/prefill email
7. Invitee sets a password and submits
8. Backend claims the token, creates the subscriber row, issues JWT
9. Frontend stores JWT and navigates to the buy box wizard

---

## R2 — Admin Invite Generation

Brady is the sole admin. No admin role system exists or is needed for v1.

The invite generation endpoint must be protected by a shared admin secret
(env var `ADMIN_SECRET`) checked via a header — not by a subscriber JWT.
Rationale: Brady is not a subscriber himself; he cannot log in as one.

Brady calls this endpoint from a terminal or simple tool. No admin UI is
required for v1 (future story).

---

## R3 — Token Rules

- Token: UUID v4, cryptographically random
- Expiry: 7 days from creation
- Single-use: claiming the token immediately marks it `claimed`
- Email is bound to the token at creation time; invitee cannot change it on the
  claim page (display-only)
- Resend the invite by generating a new token for the same email; old token
  remains valid until claimed or expired

---

## R4 — Claim Page (Frontend)

A new unauthenticated route `/invite/:token` in the React app.

On load:
- Call `GET /api/dealfeed/auth/invite/:token` to validate and prefill email
- If invalid/expired: show clear error message with no form
- If valid: show email (read-only) + full_name field + password + confirm password

On submit:
- Call `POST /api/dealfeed/auth/invite/:token/claim` with `{ full_name, password }`
- On success: store JWT, redirect to dashboard (which triggers buy box wizard
  if no buy boxes exist — per existing onboarding flow)

---

## R5 — Post-Claim Onboarding

After a successful claim, the subscriber has zero buy boxes. The existing
AppShell should detect this and prompt/launch the buy box wizard. This behavior
already exists (or is being built in the buy-box-wizard story) — the invite
flow just needs to land the user at the right place.

No custom post-claim screen is needed; the existing dashboard + wizard handles it.

---

## R6 — Security Constraints

- Invite tokens must not be guessable (UUID v4 is sufficient)
- Token validation endpoint must NOT reveal whether an email is already
  registered (returns 404 for invalid or expired tokens, same response in both cases)
- Admin secret for invite generation must be at least 32 characters, env var only
- Password minimum: 12 characters (matching existing change-password route)
- No rate limiting required for v1 (invite-only flow is low volume)

---

## R7 — What Is Out of Scope for v1

- Admin UI for Brady to view pending/claimed invites
- Automated email delivery from the backend (Brady sends the link manually)
- Subscriber approval/rejection workflow
- Bulk invite generation
- Invite resend via UI
