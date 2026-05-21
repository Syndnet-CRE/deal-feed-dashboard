> **STALE — 2026-05-20**
>
> Issues 1–3 (edit arg, refetch, dropped payload fields) have shipped fixes. Issue 4 (sub-asset class selector) is implemented in `BuyBoxPage1.jsx`. The 8-class taxonomy referenced throughout this doc was replaced by a 10-class taxonomy in nightdrop-api on 2026-05-20 (migration 049 + 3-file taxonomy lockstep).
>
> Keep as a regression checklist. Do not treat as a current to-do list.
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# Buy Box Feature — Master Audit
**Date:** 2026-05-11
**Scope:** Full buy box workflow from kanban management through wizard creation, submission, and backend delivery
**Status:** 4 sub-audits complete — see notes/audit/ for detail files
**Goal:** Production-ready for 5 beta users — functional, submittable, backend-readable buy boxes

---

## The One Sentence Verdict

The kanban board LOOKS complete and most buttons ARE wired, but edit mode is completely broken (passes wrong argument), new buy boxes never appear after creation without a page reload, three payload fields are dropped silently, and sub-asset class selection doesn't exist despite being in the taxonomy.

---

## CRITICAL BUGS — Fix Before Any Beta Test

### 1. Edit Mode Sends Wrong Argument (All 4 Edit Buttons)
**File:** `src/views/BuyBoxesView.jsx` — lines 170, 231, 236, 244 inside BuyBoxCard render
**Bug:** All four edit triggers call `onEdit?.(box.id)` but App.jsx expects the full `box` object
**Impact:** Every edit click opens a completely blank wizard form — users cannot edit any buy box
**Fix:** 4 one-line changes: `onEdit?.(box.id)` → `onEdit?.(box)`

### 2. Kanban Doesn't Refresh After Create or Edit
**File:** `src/App.jsx` — onSuccess callbacks at lines 244–248 (create) and 256–259 (edit)
**Bug:** Neither callback calls `refetch()` after wizard closes
**Impact:** User creates a buy box, sees the success screen, clicks "Back to dashboard" — their new box is not visible in the kanban until they reload the page
**Fix:** Call `useDeals().refetch()` inside both onSuccess handlers before closing wizard

### 3. Three Form Fields Collected but Silently Dropped from Payload
**File:** `src/components/BuyBoxWizard.jsx` — `nativeToPayload()` function, lines 100–130
**Bug:** `stories_min`, `zoning_codes`, and implicitly `value_min/value_max` are in the form but not serialized
**Impact:** Users configure these filters; they don't reach the API; backend can't use them for matching
**Fix:** Add the missing fields to `nativeToPayload()`

---

## HIGH PRIORITY — Required for Correct Deal Matching

### 4. Sub-Asset Class Selector Missing Entirely
**File:** `src/components/BuyBoxPage1.jsx`
**Gap:** `src/lib/buyBoxTaxonomy.js` defines full subtypes (e.g., Duplex/Triplex/Apartment for MF; Warehouse/Light Industrial for Industrial). Page 1 only exposes top-level asset class. No sub-type UI exists.
**Impact:** Users can't say "Warehouse only" or "Duplex only" — they get all Industrial or all Small MF
**Fix:** Add sub-asset class multi-select that appears after selecting a parent asset class on Page 1

### 5. Field Name Mismatch — assessed_below_market vs under_assessed
**File:** `src/components/BuyBoxWizard.jsx` — `nativeToPayload()` line ~118
**Bug:** Wizard sends `under_assessed`; wizardHelpers.js and BMAD architecture spec `assessed_below_market`
**Impact:** Backend may not read the filter at all
**Fix:** Verify backend column name, align wizard to match

### 6. Risk Field Scaling Inconsistency
**File:** `src/components/BuyBoxWizard.jsx` — lines 122–125
**Bug:** Wizard stores risk as 1–10, multiplies by 10 before sending (`climate_risk_max: form.risk.climate * 10`). wizardHelpers.js sends as-is. Two competing scales.
**Impact:** If both implementations ever merge, risk thresholds will be miscalculated
**Fix:** Decide on one scale (recommend 0–100 matching backend) and use consistently

### 7. Geo Contract Drift — Metro/Radius Never Built
**Files:** `src/components/BuyBoxPage23.jsx` (BuyBoxPage2)
**Gap:** BMAD architecture.md specifies 4 geo modes (State, Metro, ZIP, Radius). Only State and ZIP are implemented. No city/metro typeahead. No radius mode.
**Impact:** Users limited to state + county + zip filtering; city-level and radius targeting unavailable
**Fix:** Phase 2 feature — add Metro typeahead + Radius address input on Page 2

### 8. Dual Payload Implementations — wizardHelpers.js is Unused
**Files:** `src/lib/wizardHelpers.js` (34 fields, fully tested, NOT USED) vs `src/components/BuyBoxWizard.jsx::nativeToPayload()` (31 fields, active, untested)
**Bug:** Two competing implementations that have diverged. The tested one is ignored. The active one is missing fields.
**Impact:** Dead code risk; future merges will produce incorrect payloads
**Fix:** Import `buildPayload()` from wizardHelpers, delete `nativeToPayload()`, reconcile form schemas

---

## MEDIUM PRIORITY — UX and Completeness Gaps

### 9. canProceed Gates Too Loose (Pages 2–5)
**File:** `src/components/BuyBoxWizard.jsx` — `canGoNext()`, lines 172–175
**Gap:** Only Page 1 has a gate (requires assets + states). Pages 2–5 always return `true`.
**Impact:** User can activate a buy box with zero distress signals, zero risk filters, zero owner constraints — backend gets an essentially empty filter set
**Fix:** Add optional minimum gate to Page 4 (require at least 1 distress signal) or add warnings

### 10. Hardcoded Delivery Message Ignores Cadence Choice
**File:** `src/components/BuyBoxPage6.jsx` — lines 105–106 and success modal line 286
**Bug:** Always says "First batch lands at 06:00 AM tomorrow" regardless of whether user picked daily/weekly/real-time
**Impact:** Misleading UX for weekly or real-time users
**Fix:** Compute delivery time from `form.delivery.cadence`

### 11. No Delete/Archive Buy Box
**File:** `src/views/BuyBoxesView.jsx` — BuyBoxCard action buttons
**Gap:** No delete button, no archive button. Pause is the only way to disable a buy box.
**Impact:** Users cannot remove buy boxes they no longer want
**Fix:** Add "Archive" to overflow menu, confirm modal, call `patchBuyBox(id, { status: 'cancelled' })`

### 12. Page 6 Buttons Are Dead
**File:** `src/components/BuyBoxPage6.jsx` — lines ~46 and ~62
**Bug:** "Edit ↗" and "Connect to email →" buttons render but have no onClick handlers
**Impact:** Tappable elements that do nothing — confusing for users
**Fix:** Wire or remove

### 13. Right Rail Stats Are Hardcoded/Fake
**File:** `src/components/BuyBoxRightRail.jsx` — lines 63–75
**Gap:** "Avg equity $184K", "Hold 11.3yr", "Absentee 47%" are hardcoded. Never change as user adjusts filters.
**Impact:** Users may make decisions based on fake stats
**Fix:** Wire to real preview API response or remove until data exists

---

## LOW PRIORITY — Polish

### 14. Last Run Date Display-Only (Brady's Original Report)
**Gap:** Shown as plain text on cards; no click handler. Users reported expecting to be able to change it.
**Fix:** Remove the interactive-looking styling, or add a date picker modal — decide which.

### 15. Sparkline and Weekly Delta Missing from API
**Gap:** Cards render `deliveredSpark` and `deliveredThisWeek` but API doesn't return these fields.
**Fix:** Add to API response or remove from card UI

### 16. Fake UUID Shown to User on Page 6
**Bug:** UUID displayed is `bb-{hash from name length}` — not a real backend-assigned ID
**Fix:** Remove or replace with "ID assigned after activation"

### 17. Light Mode CSS Needs Polish
**Gap:** `buyBoxes.css` was built dark-first; `#101116` hardcoded background; some elements are illegible in light theme
**Fix:** Audit with light mode toggled, replace hardcoded darks with `--bg-*` tokens

---

## Sprint Plan Recommendation

### Sprint 1 — Blockers (est. 2–3 hours, must ship before beta)
| # | Fix | Files | Effort |
|---|-----|-------|--------|
| 1 | Fix edit buttons to pass full box object | BuyBoxesView.jsx (4 lines) | 10 min |
| 2 | Call refetch() after create/edit success | App.jsx (2 lines) | 10 min |
| 3 | Add missing fields to nativeToPayload | BuyBoxWizard.jsx | 30 min |
| 4 | Verify/fix assessed_below_market field name | BuyBoxWizard.jsx | 15 min |

### Sprint 2 — Core Features (est. 4–6 hours)
| # | Fix | Files | Effort |
|---|-----|-------|--------|
| 5 | Add sub-asset class selector to Page 1 | BuyBoxPage1.jsx + buyBoxTaxonomy.js | 2–3 hr |
| 6 | Consolidate nativeToPayload → wizardHelpers buildPayload | BuyBoxWizard.jsx + wizardHelpers.js | 2 hr |
| 7 | Fix hardcoded delivery message | BuyBoxPage6.jsx | 20 min |
| 8 | Wire or remove Page 6 dead buttons | BuyBoxPage6.jsx | 30 min |
| 9 | Add delete/archive to overflow menu | BuyBoxesView.jsx + App.jsx | 1 hr |

### Sprint 3 — Polish (est. 2–3 hours)
- Light mode CSS audit (buyBoxes.css)
- canProceed gates tighten (Pages 2–5)
- Right rail real data or removal
- Last run date decision (edit or remove hint)
- Sparkline/delta — confirm API or remove UI

### Deferred
- Metro/City geo mode (architecture.md Story 4)
- Radius geo mode (architecture.md Story 4)
- Zoning codes UI (Page 2 tag input)

---

## Files Requiring Changes

| File | Issues | Priority |
|------|--------|----------|
| `src/views/BuyBoxesView.jsx` | Edit buttons pass ID not object (4 lines) | CRITICAL |
| `src/App.jsx` | Missing refetch after wizard success (2 lines) | CRITICAL |
| `src/components/BuyBoxWizard.jsx` | nativeToPayload missing fields + consolidation needed | CRITICAL + HIGH |
| `src/components/BuyBoxPage1.jsx` | Sub-asset class selector missing | HIGH |
| `src/components/BuyBoxPage6.jsx` | Dead buttons, hardcoded delivery message | MEDIUM |
| `src/components/BuyBoxRightRail.jsx` | Hardcoded fake stats | MEDIUM |
| `src/lib/wizardHelpers.js` | Unused — consolidate with BuyBoxWizard payload | HIGH |
| `src/styles/buyBoxes.css` | Light mode polish | LOW |

---

## Sub-Audit Files
- `notes/audit/audit-kanban-management.md` — Kanban page, buttons, drag-drop, data gaps
- `notes/audit/audit-wizard-flow.md` — All 6 wizard pages, canProceed, submit flow, dead UI
- `notes/audit/audit-api-contract.md` — buildPayload(), BMAD spec gaps, backend contract alignment
- `notes/audit/audit-app-wiring.md` — App.jsx state machine, edit mode, success flow, props chain
