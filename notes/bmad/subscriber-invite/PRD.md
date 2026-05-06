# PRD — Subscriber Invite Flow
Date: 2026-05-03
Author: PM phase
Requires: requirements.md (complete)

---

## Problem

Brady cannot onboard colleagues to the deal feed. There is no way to create a
subscriber account without a direct database insert. Michael and Ace need
access. As the subscriber base grows, Brady needs a repeatable flow he controls
via a link — not a sysadmin operation.

---

## Goal

Brady generates an invite link in under 30 seconds. The invitee claims it,
sets a password, and lands in the dashboard ready to create their first buy box.
Zero database access required by Brady.

---

## Success Metrics

- Brady can generate an invite link via a single curl command
- Invitee claims the link in under 2 minutes (form is simple and self-explanatory)
- Invalid/expired tokens show a clear error, not a blank page
- After claim, invitee is logged in and sees the dashboard or buy box wizard

---

## Non-Goals

- Brady does not get a UI to manage invites in v1
- The backend does not send the email; Brady copies and sends the link manually
- No subscriber approval step; claiming the invite creates the account immediately

---

## User Stories

### US-1 — Admin generates invite

As Brady, I want to run a curl command with an email address and receive an
invite token that I can use to construct a link for my colleague.

Acceptance criteria:
- `POST /api/dealfeed/admin/invites` with `{ email }` and `x-admin-secret` header
- Returns `{ token, expires_at }`
- Brady constructs the invite URL: `https://[frontend]/invite/[token]`
- If the email already has a pending unclaimed invite, old token is invalidated
  and a new one is issued
- If the email is already a registered subscriber, return 409

### US-2 — Invitee lands on claim page

As an invitee, when I click the link, I land on a page that shows my email
and asks me to set my name and password.

Acceptance criteria:
- `/invite/:token` loads when not logged in
- Email shown as read-only
- If token is invalid or expired: "This invite link is invalid or has expired.
  Ask Brady to send a new one." No form shown.
- Form fields: full name (required), password (min 12 chars), confirm password

### US-3 — Invitee claims invite and logs in

As an invitee, after submitting my name and password, I am immediately logged
in and taken to the dashboard.

Acceptance criteria:
- `POST /api/dealfeed/auth/invite/:token/claim` with `{ full_name, password }`
- Subscriber account is created
- JWT returned and stored as `df_token` in localStorage
- Redirect to `/` (AppShell)
- Token marked `claimed` and cannot be reused

---

## Scope

### Backend (scoutgpt-api)

New migration:
- `df_invite_tokens` table: `token UUID PK`, `email TEXT NOT NULL`,
  `status TEXT NOT NULL DEFAULT 'pending'`, `expires_at TIMESTAMPTZ NOT NULL`,
  `claimed_by UUID REFERENCES df_subscribers(id)`, `created_at TIMESTAMPTZ`

New file: `routes/dealfeed/invites.js`
Routes:
- `POST /api/dealfeed/admin/invites` — protected by `x-admin-secret` header
- `GET /api/dealfeed/auth/invite/:token` — validate + return `{ email }`
- `POST /api/dealfeed/auth/invite/:token/claim` — create subscriber, return JWT

### Frontend (deal-feed-dashboard)

New file: `src/views/InviteClaimView.jsx`
New route in `src/App.jsx`: `/invite/:token` (unauthenticated, outside AppShell)

---

## Open Questions (Resolved)

1. Who constructs the invite URL?
   Resolution: Brady constructs it. Backend returns token only.

2. What if Brady invites same email twice?
   Resolution: Invalidate old token, issue new one.

3. What if email is already registered?
   Resolution: Return 409 — do not create a duplicate subscriber.
