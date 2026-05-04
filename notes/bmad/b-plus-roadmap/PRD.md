# PRD: Deal Feed Dashboard — B+ Upgrade
Date: 2026-05-04
Author: Claude (BMAD PM phase)
Status: APPROVED — ready for architecture

---

## Problem Statement

The Deal Feed Dashboard has the right bones: deal discovery, buy box scoring, GIS-verified parcel data. What it lacks is the action layer. A CRE investor who finds a deal they like cannot call the owner, track their outreach, update the deal status, or trust that what they're seeing is real data. The product currently grades as a C overall. This PRD drives it to a B+ before market launch.

---

## Goals

1. Zero fake data shown to any authenticated user under any condition.
2. Contact workflow: investors can call, email, copy, and log contact attempts directly from the deal.
3. Deal lifecycle: every deal has a status, visible everywhere, moveable with one click.
4. Buy box management: edit and pause/resume are wired, not decorative.
5. Dashboard reflects real activity, not static placeholders.
6. PropertyDetail is a decision-ready executive summary above the fold.

---

## Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| MOCK_DEALS shown to authenticated users | Frequent | 0 |
| Click-to-call / click-to-email available | 0% of deals | 100% of deals with dm data |
| Deal status trackable | No | Yes |
| Contact log entries per deal | Not possible | Enabled |
| Buy box edit functional | No | Yes |
| Build pass after each phase | Required | Required |

---

## User Personas

**Rancher / Land Investor** — wants to find absentee-owned rural parcels and call the owner directly. Needs confidence the phone number is real and recently verified.

**CRE Syndicator** — manages a pipeline of 20-50 deals simultaneously. Needs to see deal status at a glance and filter by what needs attention today.

**Fix-and-Flip / Wholesaler** — high volume, low dwell time. Needs fast filtering, deal aging at a glance, and one-click copy of contact info.

---

## Phases and Features

### Phase 1 — Trust Repair (P0)
**2 days. Frontend only. No backend changes.**

Remove all sources of fake or misleading data visible to authenticated users.

| Feature | User Value |
|---|---|
| REQ-1.1 Remove MOCK_DEALS fallback | Users see an honest empty state, not fake deals |
| REQ-1.2 Fix mock comps SVG | Comps map reflects real data or an honest not-available state |
| REQ-1.3 Data freshness badges | Users know how old the record is before acting on it |
| REQ-1.4 Source attribution on Ownership tab | Users can assess reliability of each field |
| REQ-1.5 Note indicator on deal cards | Users see at a glance which deals they've already engaged |

### Phase 2 — Contact Workflow (P0)
**4 days. Frontend + backend.**

The single highest-leverage gap. Without this, the product cannot drive the primary investor action.

| Feature | User Value |
|---|---|
| REQ-2.1 Clickable contact data | One tap to call or email. Clipboard copy for CRM paste. |
| REQ-2.2 Deal status pipeline | Pipeline visibility: New, Researched, Contacted, Negotiating, Offer Made, Dead |
| REQ-2.3 Contact log | Structured outreach history per deal |
| REQ-2.4 Contact status filter | Filter to only deals with real contact info |

### Phase 3 — Deal Management UX (P1)
**3 days. Frontend only.**

High-frequency actions that professionals will hit every session.

| Feature | User Value |
|---|---|
| REQ-3.1 Deal aging indicator | Urgency at a glance without opening a deal |
| REQ-3.2 Share button | Send a deal to a partner in 2 taps |
| REQ-3.3 Enhanced filtering | Filter by distress type and owner type |
| REQ-3.4 Global search | Find any deal by address or owner name from anywhere in the app |

### Phase 4 — Buy Box Improvements (P1)
**2 days. Frontend + backend.**

Fixes broken workflows users will hit within their first session.

| Feature | User Value |
|---|---|
| REQ-4.1 Edit existing buy boxes | Modify criteria without recreating from scratch |
| REQ-4.2 Pause and resume | Temporarily stop deal delivery without deleting |
| REQ-4.3 Match preview | See estimated match count before saving changes |

### Phase 5 — Dashboard Upgrade (P2)
**2 days. Frontend only — uses already-loaded data.**

Turns the daily landing page from a status wall into a real-time decision surface.

| Feature | User Value |
|---|---|
| REQ-5.1 Meaningful stat blocks | Stats derived from real deals and contact activity |
| REQ-5.2 Live map pins | Actionable map replacing decorative background |
| REQ-5.3 Activity feed | See recent contact log entries at a glance |

### Phase 6 — Property Detail Polish (P2)
**1 day. Frontend only.**

Makes the most-used view scan-ready in under 5 seconds.

| Feature | User Value |
|---|---|
| REQ-6.1 Overview tab as executive summary | All decision-relevant fields visible above the fold |
| REQ-6.2 Distress signals severity hierarchy | Critical signals stand out from informational ones |
| REQ-6.3 Aerial image prominent | Visual confirmation before calling the owner |

---

## Out of Scope

- Mobile / responsive redesign
- Bulk deal actions
- Notification system (bell icon)
- A/B buy box comparison
- Direct mail / outreach templates
- DNC registry check
- Buy box performance metrics
- Full skip trace API integration (BatchSkipTracing / PropStream)

---

## Non-Functional Requirements

- Every commit must pass `npm run build`
- `npm run lint` must pass before every commit
- `npm test` must pass before every commit
- E2E smoke suite must pass before any push touching PropertyDetail, DealDrawer, or DashboardView
- No hardcoded hex values — always use CSS custom property tokens from `tokens.css`
- No `console.log` in committed code
- No mock data shown to authenticated users

---

## Backend Migration Plan

| Migration | Phase | Table | Change |
|---|---|---|---|
| 031_deal_status | Phase 2 | df_deals_sent | ADD COLUMN status VARCHAR(32) DEFAULT 'new' NOT NULL |
| 032_deal_contacts | Phase 2 | deal_contacts (new) | id, deal_id, subscriber_id, contacted_at, channel, outcome, notes |

---

## Open Questions (Brady to resolve before Phase 2 begins)

1. **Data freshness field** — Does `brief_json` contain an enrichment timestamp? If not, which column in `df_deals_sent` proxies data age? (`updated_at`? `created_at`?)
2. **Skip trace data** — Does `dm.phone` / `dm.email` in `brief_json` contain real data for live deals, or is it placeholder?
3. **Migration 030 status** — Confirm `030_subscriber_name_phone.sql` was applied to Neon.
4. **Backend availability** — Brady must be available to review backend work before Phase 2 and Phase 4 begin.
