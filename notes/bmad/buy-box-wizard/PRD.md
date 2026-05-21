> **SHIPPED / HISTORICAL — 2026-05-20**
>
> The work in this PRD shipped (migration 029, 8-field expansion, initial wizard). Superseded by `buy-box-wizard-v2` (which also shipped), and now superseded by the buy box MVP rebuild driven by the 10-class taxonomy on the backend (nightdrop-api 2026-05-20, migration 049).
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# PRD — Buy Box Wizard Buildout
Date: 2026-05-03
Author: PM phase
Requires: requirements.md

---

## Problem
The current NewBoxWizard is a 93-line static mock. It collects 3 fields (name, asset class, hold period), has a hardcoded MSA dropdown, and never calls the API. Buy boxes created through it exist only in component state and are discarded on close.

## Goal
Replace the static mock with a fully functional 7-step configuration wizard that collects every field the backend needs, posts to the onboarding endpoint, and leaves the user in a confirmed state with their buy box live.

## Users
CRE investors using the deal feed. Two contexts:
1. Existing subscriber adding a new buy box from the Buy Boxes page (max 3 total)
2. New subscriber completing onboarding for the first time

## Success Criteria
- A subscriber completes the wizard and a row appears in `df_buy_boxes` with `status = 'pending'`
- The buy boxes list in BuyBoxesView refreshes without a page reload
- All 8 field categories from the spec are collectable
- Validation enforced: label + geo + asset class required before submit
- Both light and dark themes render correctly

---

## Feature Spec

### Modal shell
- Class: `modal lg` (720px wide, existing CSS)
- Backdrop click does NOT close (prevents accidental dismissal)
- Escape key closes only from step 1
- Step indicator: 7 segments at top of modal-body, filled green = completed/current

### Step 1 — Name & Description
Headline: "Name your buy box"
Supporting copy: "Give it a short label so you can tell it apart in your feed. The description is just for you."
- Label (required, single-line input, max 80 chars)
- Notes (optional, textarea, 3 rows, max 500 chars)

### Step 2 — Market Geography
Headline: "Where do you want to invest?"
Supporting copy: "We'll search every parcel in your selected geography every night."
Mode selector: 4 tab-style buttons — State, Metro, ZIP Codes, Radius
Each mode renders its own input panel:
- State: multi-select dropdown, selected states shown as removable chips
- Metro: typeahead text input, selected metros as chips
- ZIP Codes: text input with Enter-to-add, chips shown below
- Radius: address text input + miles slider (1–100 mi, default 25)
Validation: at least one value in the active mode before Next is enabled.

### Step 3 — Asset Classes
Headline: "What asset types do you buy?"
Supporting copy: "Select every type you'd consider. You can run separate buy boxes for different strategies."
UI: 2-column grid of checkbox cards. Selected = green tint + checkmark.
At least one required.

### Step 4 — Property Criteria
Headline: "Narrow by property characteristics"
Supporting copy: "All fields are optional. Leave blank to match any value."
- Lot size: acres_min + acres_max side by side, unit label "acres"
- Estimated value: value_min + value_max side by side, formatted dollar inputs
- Year built: year_built_min + year_built_max side by side
- Min hold years: stepper, 1–30, unit label "yr" inline
- Zoning codes: tag input (Enter to add), chips below

### Step 5 — Ownership Profile
Headline: "Who owns the properties you want to find?"
Supporting copy: "Filter to specific ownership structures and location patterns."
2-col checkbox card grid: Individual, LLC or Entity, Trust, Corporate
Toggles below:
- Absentee owner only
- Out-of-state owner only

### Step 6 — Distress Signals
Headline: "What distress signals should we screen for?"
Supporting copy: "We score every property against these signals. Toggle 'Required' to exclude properties that don't match any."
Checkbox cards (label + one-sentence description):
- "Long-term hold, no recent improvements" — Owned 10+ years with no capital improvements on record
- "Tax delinquency" — Active or recent delinquency on county tax rolls
- "No permits filed in 5+ years" — No building or renovation permits since at least 2020
- "Absentee ownership" — Owner's mailing address differs from property address
- "Inactive or dissolved entity" — Owning entity has lapsed or dissolved registration
Toggle at bottom: "Only show properties that match at least one selected signal" → distress_only

### Step 7 — Review & Confirm
Headline: "Review your buy box"
Supporting copy: "Everything looks good? Hit Activate and we'll run your first search tonight."
Read-only summary card — label/value rows grouped by section.
Empty optional fields shown as "—".
Single primary CTA: "Activate Buy Box"
On click: POST to /api/dealfeed/onboarding, then transition to confirmation state.

### Confirmation State
Replaces modal body (not a step in the progress indicator).
Shows: success icon, "Your buy box is active", buy box name, "First run tonight at 02:00 EDT".
Button: "View Buy Boxes" — calls onClose and triggers refetch in DealsContext.

---

## Out of Scope
- Coverage validation UI (async on backend)
- Editing an existing buy box (PATCH — separate feature)
- Map preview of selected geography
- Onboarding account info collection (buy box naming serves as step 1 in both contexts)
