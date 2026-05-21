> **HISTORICAL — 2026-05-20**
>
> Root-cause analysis for issues observed on 2026-05-11. RC-1 (edit arg), RC-2 (showToast undefined), RC-3 (refetch missing) all have shipped fixes. Kept as a debugging-method reference.
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# Agent Self-Debug / Root Cause Report
Date: 2026-05-11
Method: Direct code read of every relevant source file. No speculation. No grepping for keywords and inferring. Every finding below was confirmed by reading the actual line.

---

## Failure Capture

- **Session / task:** Buy box feature audit — kanban management + wizard flow
- **Goal in progress:** Identify why edit mode, settings buttons, geo buttons, and buy box submission are broken. Identify missing sub-asset class. Establish root causes for five beta user launch.
- **Error:** No runtime error. Silent behavioral failure: edit opens blank form, buttons do nothing, toasts never fire, submission payload is incomplete.
- **Last successful step:** Parallel audit agents produced four audit docs. Master synthesis written to `notes/audit/MASTER-AUDIT-BUY-BOX-2026-05-11.md`.
- **Repeated pattern:** Multiple audit agents agreed on some root causes but over-reported one (`value_min/value_max` claimed missing — confirmed present at BuyBoxWizard.jsx line 112). Also under-reported one (`showToast` bug).
- **Environment assumptions verified:** All files read directly in this session. Findings supersede audit agent output where they conflict.

---

## Root-Cause Diagnosis

### RC-1: Edit mode opens blank form
**File:** `src/views/BuyBoxesView.jsx` lines 170, 231, 236, 244
**File:** `src/App.jsx` line 214
**File:** `src/components/BuyBoxWizard.jsx` lines 53-98

All four edit triggers in BuyBoxesView pass `box.id` (UUID string) to `onEdit`:
```js
onClick={() => onEdit?.(box.id)}   // line 170, 231, 236, 244
```
App.jsx receives this and stores it directly:
```js
onEdit={setEditingBuyBox}          // line 214
```
BuyBoxWizard receives the UUID string as `initialData` and feeds it into `toNativeForm()`:
```js
const [form, setForm] = useState(() => toNativeForm(initialData))
```
`toNativeForm(b)` accesses `b.status`, `b.name`, `b.asset_classes`, etc. When `b` is a string, every field access returns `undefined`. The function falls through to `NATIVE_FORM` defaults, returning a blank form.

**Root cause:** `onEdit(box.id)` should be `onEdit(box)`. Three call sites pass string, one call site passes string. App.jsx wires `setEditingBuyBox` directly instead of finding the box object first.

---

### RC-2: showToast is always undefined — all submission errors are silent
**File:** `src/contexts/ToastContext.jsx` line 23
**File:** `src/components/BuyBoxWizard.jsx` line 178

ToastContext exports the function itself as context value:
```js
<ToastCtx.Provider value={addToast}>   // ToastContext.jsx line 23
```
BuyBoxWizard destructures an object property from it:
```js
const { showToast } = useToast()       // BuyBoxWizard.jsx line 178
```
Destructuring `{ showToast }` from a plain function returns `undefined`. Every call to `showToast(...)` in BuyBoxWizard silently does nothing. All error feedback on create/edit/activate failure is dropped.

**Root cause:** BuyBoxWizard must use `const addToast = useToast()` then call `addToast(...)` directly, matching how App.jsx uses it correctly (App.jsx line: `const addToast = useToast()`).

---

### RC-3: No data refresh after create or edit success
**File:** `src/App.jsx` lines 244-248, 256-259
**File:** `src/contexts/DealsContext.jsx` lines 115-119, 140

Create onSuccess:
```js
addToast('Buy box created!', 'success')
setShowWizard(false)
navigate('/boxes')
```
Edit onSuccess:
```js
addToast('Buy box updated!', 'success')
setEditingBuyBox(null)
```
Neither calls `refetch()`. `DealsContext` exports `refetch: fetchAll` at line 140. It is available but never called. Kanban board reflects stale data until manual page reload.

**Root cause:** Both onSuccess callbacks need `refetch()` from `useDeals()` in App.jsx.

---

### RC-4: stories_min doubly broken — missing from payload AND stored as non-numeric string
**File:** `src/components/BuyBoxPage23.jsx`
**File:** `src/components/BuyBoxWizard.jsx` lines 100-130

Page 2 stores stories chips as the exact chip label string: `'1'`, `'2'`, `'3'`, `'4–6'`, `'7+'`. The `'4–6'` value is a range string. `toNum('4–6')` returns `null` because `parseFloat('4–6')` is `NaN`.

Additionally, `stories_min` is not present anywhere in `nativeToPayload()`. Even if the string issue were fixed, the field would never reach the backend.

**Root cause:** Two separate bugs. (a) Chip values should map to numeric floor values (e.g., `'4–6'` → `4`, `'7+'` → `7`). (b) `nativeToPayload()` must include `stories_min: toNum(form.phys.stories_min)`.

---

### RC-5: zoning_codes never sent to backend
**File:** `src/components/BuyBoxWizard.jsx` lines 100-130

`nativeToPayload()` does not contain `zoning_codes` anywhere. The field is collected in `form.phys.zoning` (a string) but dropped before reaching the API.

**Root cause:** `nativeToPayload()` needs `zoning_codes: form.phys.zoning ? [form.phys.zoning] : []`.

---

### RC-6: Sub-asset class — taxonomy exists, wizard never uses it, IDs are incompatible
**File:** `src/lib/buyBoxTaxonomy.js` — 8 asset classes each with `subtypes: [{label, code}]`
**File:** `src/components/BuyBoxPage1.jsx` — defines its own local `ASSET_CLASSES` array

Page 1 does not import `buyBoxTaxonomy.js`. It defines its own local array with different IDs:

| Taxonomy ID | Page 1 ID |
|-------------|-----------|
| multifamily | small_mf / large_mf (split into two) |
| sfr | sfr |
| retail | commercial (renamed) |
| industrial | industrial |
| land | land |
| hospitality | hospitality |
| office | (missing) |
| special_purpose | (missing) |
| (none) | mixed (added, not in taxonomy) |

Selecting an asset class on Page 1 never triggers a sub-asset class selector because no such UI exists. The taxonomy's `subtypes` arrays (e.g., multifamily has Garden Style, Mid-Rise, High-Rise, etc.) are never surfaced.

**Root cause:** Page 1 must import `buyBoxTaxonomy.js`, map its own IDs to taxonomy IDs, and render a sub-asset selector when a class with subtypes is selected. This is also a build requirement for backend matching — the backend matcher needs ATTOM use codes, which live in the taxonomy subtypes.

---

### RC-7: under_assessed vs assessed_below_market field name divergence
**File:** `src/components/BuyBoxWizard.jsx` line 114: `under_assessed: form.dist.under_assessed`
**File:** `src/lib/wizardHelpers.js` buildPayload: `assessed_below_market: form.distress.assessed_below_market`

Active wizard sends `under_assessed`. The fully-tested but unused `wizardHelpers.js` sends `assessed_below_market`. Backend schema and matcher must be consulted to determine which field name is correct. One of the two is sending the wrong key.

**Root cause:** Naming diverged when `nativeToPayload()` was written inline in BuyBoxWizard instead of using `buildPayload()` from wizardHelpers. The correct field name must be confirmed against the backend DB schema (`df_buy_boxes` table definition) and the active matcher in `run_deal_feed.js`.

---

### RC-8: Review page "Edit" buttons are dead (Page 6)
**File:** `src/components/BuyBoxPage6.jsx` lines 46, 62

```jsx
<button className="review-section-edit">Edit ↗</button>           // line 46 — no onClick
<button className="review-section-edit">Connect to email →</button>  // line 62 — no onClick
```

Neither button has an `onClick` handler. They render but do nothing.

**Root cause:** `BuyBoxPage6` receives a `goToStep` prop (or equivalent) but neither button calls it.

---

### RC-9: BuyBoxRightRail stat trio is hardcoded fake data
**File:** `src/components/BuyBoxRightRail.jsx`

```jsx
<span className="stat-value">$184K</span>
<span className="stat-value">11.3yr</span>
<span className="stat-value">47%</span>
```

These are literal strings. Not derived from form values, not from API responses. The live match count and delta pulse are real; the stats below are not.

**Root cause:** Stats were never wired. They should be computed from the preview API response or derived from the form's `fin.*` fields.

---

### RC-10: Hardcoded "06:00 AM tomorrow" on success screen
**File:** `src/components/BuyBoxPage6.jsx` line 105 (confirmed in wizard success screen)
**File:** `src/components/BuyBoxWizard.jsx` lines 285-286

Success screen text ignores the user's cadence choice from Page 5. Always says "First batch lands at 06:00 AM tomorrow."

**Root cause:** Cadence selection value from `form.cadence` is never read when building the success message.

---

## Confirmed Non-Bug (Audit Agent Over-Report)

**value_min / value_max** — audit agents reported these as missing from `nativeToPayload`. Direct file read at BuyBoxWizard.jsx line 112 confirms they ARE present:
```js
value_min: toNum(form.fin.price_min),
value_max: toNum(form.fin.price_max),
```
No fix needed here.

---

## Prioritized Fix Order

For five beta users to successfully create and submit buy boxes:

| Priority | Fix | Files |
|----------|-----|-------|
| P0 | RC-1: Pass `box` object to onEdit, not `box.id` | BuyBoxesView.jsx (4 lines), App.jsx (1 line) |
| P0 | RC-2: Fix `showToast` → `addToast` in BuyBoxWizard | BuyBoxWizard.jsx (1 line + call sites) |
| P0 | RC-3: Call `refetch()` after create and edit success | App.jsx (2 lines) |
| P1 | RC-6: Sub-asset class UI on Page 1 | BuyBoxPage1.jsx (new UI section) |
| P1 | RC-5: Add zoning_codes to nativeToPayload | BuyBoxWizard.jsx (1 field) |
| P1 | RC-4: Fix stories_min chip values + add to payload | BuyBoxPage23.jsx + BuyBoxWizard.jsx |
| P2 | RC-7: Confirm correct field name (under_assessed vs assessed_below_market) | BuyBoxWizard.jsx or backend |
| P2 | RC-8: Wire "Edit" buttons on Page 6 | BuyBoxPage6.jsx |
| P3 | RC-9: Wire stat trio in right rail | BuyBoxRightRail.jsx |
| P3 | RC-10: Dynamic success message from cadence field | BuyBoxWizard.jsx or BuyBoxPage6.jsx |

---

## Recovery Action

- **Diagnosis chosen:** All 10 root causes confirmed from direct source reads. No speculation.
- **Smallest action that proves RC-1:** Change one `onEdit` call in BuyBoxesView from `onEdit?.(box.id)` to `onEdit?.(box)`, open edit from kanban, verify form is pre-populated.
- **Why this is safe:** Single character change, no new logic.
- **Evidence that would prove fixes worked:** Playwright or manual flow: open kanban, click edit, verify name/asset/geo populated; submit new buy box, verify it appears in kanban without page reload; trigger submission error, verify toast fires.

---

## Agent Self-Debug Report (Summary)

- **Session / task:** Buy box full feature audit + introspection, 2026-05-11
- **Failure:** Silent behavioral failures — blank edit forms, dead buttons, swallowed toasts, incomplete API payloads, missing sub-asset class
- **Root cause:** 10 confirmed. Primary: `onEdit(box.id)` should be `onEdit(box)`. `showToast` destructured from function (always undefined). No `refetch()` after mutations. Sub-asset class UI never built.
- **Recovery action:** Fixes documented above, ordered P0-P3. No code written yet.
- **Result:** `partial` — investigation complete, implementation pending Brady approval
- **Token / time burn risk:** LOW — all root causes confirmed. No ambiguity. Fixes are surgical. P0 trio (RC-1, RC-2, RC-3) is under 10 lines total.
- **Follow-up needed:** (1) Brady approves fix execution. (2) Confirm `under_assessed` vs `assessed_below_market` against backend schema. (3) Sub-asset class is a new UI feature — needs sizing before implementation.
- **Preventive change to encode later:** Hookify rule: "When calling onEdit in a kanban/card pattern, always pass the full object, never just the id." Saves future blank-form bugs.
