> **PARTIALLY STALE — 2026-05-20**
>
> App wiring largely accurate; component locations may have drifted. Buy box specifics here predate the 10-class backend rebuild.
>
> **Current state:** `notes/audit/CROSS-REPO-AUDIT-BUY-BOX-MVP-2026-05-20.md`

---

# App Wiring Audit

Date: 2026-05-11
Scope: App.jsx, BuyBoxesView.jsx, TopHeader.jsx, LeftPanel.jsx, BuyBoxWizard.jsx, DealsContext.jsx

---

## 1. Wizard Open/Close State Machine

### Create Mode (New Buy Box)
- **Trigger**: `onCreateBuyBox()` from LeftPanel (line 186) → sets `showWizard=true`
- **Trigger**: BuyBoxesView `onCreate()` prop (line 213) → sets `showWizard=true`
- **Render condition**: `(showWizard || onboardingMatch)` at App.jsx:241
- **Mode**: `mode="create"`
- **onSuccess callback**: 
  - Shows toast: "Buy box activated! We start tonight."
  - Closes wizard: `setShowWizard(false)`
  - Navigates to boxes view: `handleSetView('boxes')`
- **onCancel callback**: 
  - Closes wizard: `setShowWizard(false)`
  - If onboarding, navigates to dashboard

### Edit Mode (Existing Buy Box)
- **Trigger**: BuyBoxesView `onEdit(boxId)` prop (line 214) → sets `editingBuyBox` to the box object
- **Render condition**: `editingBuyBox &&` at App.jsx:252
- **Mode**: `mode="edit"`
- **Initial data**: `initialData={editingBuyBox}` (full box object)
- **onSuccess callback**: 
  - Shows toast: "Buy box saved."
  - Closes wizard: `setEditingBuyBox(null)`
  - Does NOT navigate (stays on current view)
- **onCancel callback**: 
  - Closes wizard: `setEditingBuyBox(null)`

### Close Mechanisms
1. **Escape key**: App.jsx:148-151 handles ESC to close all modals
2. **X button**: BuyBoxWizard:326 → calls `onCancel()`
3. **Backdrop**: No backdrop click handler; backdrop exists but doesn't close wizard
4. **After submit**: In both modes, `onSuccess()` closes the wizard

### State Reset
- **Create**: Form is reset via BuyBoxWizard state initialization (line 180)
- **Edit**: Form is pre-populated via `toNativeForm(initialData)` (line 180)
- **Between sessions**: No explicit form clearing on cancel; next open re-initializes

---

## 2. Edit Mode (Pre-population)

### Props Chain
```
App.jsx:214 → BuyBoxesView.onEdit = setEditingBuyBox
  ↓
BuyBoxCard.onEdit(box.id) → calls onEdit(box.id)
  ↓ (BuyBoxCard line 170)
BuyBoxesView receives box.id, calls onEdit(box.id)
  ↓ (BuyBoxesView line 365)
App.jsx setEditingBuyBox(box)
  ↓ (via callback prop)
BuyBoxWizard initialData={editingBuyBox}
```

### Issue Found: ID vs Object Mismatch
- **BuyBoxCard** calls `onEdit(box.id)` with ID only (line 170)
- **BuyBoxesView** expects `onEdit(setEditingBuyBox)` but gets ID
- **App.jsx** expects full box object: `initialData={editingBuyBox}` (line 255)
- **BROKEN**: onEdit is being called with `box.id`, but App expects full box object

### Pre-population Flow (If Fixed)
1. BuyBoxWizard receives `initialData={editingBuyBox}` (full object)
2. Calls `toNativeForm(initialData)` to convert API shape → form shape
3. All form fields are populated from the box object
4. Right panel shows existing filters

### Data Available for Pre-population
- Assets: `b.asset_classes || []`
- Geo: `b.geo_states`, `b.geo_counties`, `b.geo_zips`
- Physical: `b.sf_min/max`, `b.acres_min/max`, `b.year_built_min/max`, `b.units_min/max`
- Financial: `b.value_min/max`, `b.min_equity_pct`, `b.under_assessed`
- Owner: `b.owner_types`, `b.absentee_only`, `b.out_of_state_only`, `b.hold_period_min/max`
- Distress: `b.distress_signals`, `b.distress_match_mode`
- Risk: `b.climate_risk_max`, `b.flood_exclude`, `b.wildfire_risk_max`, `b.heat_risk_max`
- Threshold: `b.match_threshold`
- Delivery: `b.run_schedule?.days`, `b.delivery_max_per_run`
- Label: `b.label`

---

## 3. Success Flow

### Create Mode
1. User submits form on page 6
2. BuyBoxWizard.handleActivate() triggers (line 224)
3. API call: `POST /api/dealfeed/onboarding` (line 231)
4. On success:
   - Sets `submitted=true` → shows success screen (line 234)
   - Shows confirmation card with green checkmark
   - Message: "You're hunting. [name] is live. First batch lands at 06:00 AM tomorrow."
   - Button: "Back to dashboard"
5. User clicks "Back to dashboard" → calls `onSuccess()`
6. App.jsx onSuccess (line 244-248):
   - Shows toast: "Buy box activated! We start tonight."
   - Closes wizard: `setShowWizard(false)`
   - Navigates to boxes: `handleSetView('boxes')`

### Edit Mode
1. User submits form on page 6
2. BuyBoxWizard.handleActivate() triggers (line 224)
3. API call: `PATCH /api/dealfeed/buy-boxes/{id}` (line 229)
4. On success:
   - Sets `submitted=true` → shows success screen
   - Shows confirmation card with green checkmark
   - Message: "You're hunting. [name] is live. First batch lands at 06:00 AM tomorrow."
   - Button: "Back to dashboard"
5. User clicks "Back to dashboard" → calls `onSuccess()`
6. App.jsx onSuccess (line 256-259):
   - Shows toast: "Buy box saved."
   - Closes wizard: `setEditingBuyBox(null)`
   - Does NOT navigate

### Data Refresh After Success
- **BuyBoxWizard**: After API call succeeds, form is submitted but wizard doesn't refetch
- **App.jsx**: After wizard closes, no explicit refetch
- **DealsContext**: `patchBuyBox()` updates local state (line 117)
  - Called by: Internal resume action only
  - NOT called by: Create or edit wizard
- **Problem**: After creating/editing a buy box via wizard, the app does NOT refetch buy boxes
  - `api.patch()` updates the DB
  - `patchBuyBox()` in context updates local cache
  - But BuyBoxWizard calls raw `api.patch()`, not `patchBuyBox()`
  - The new/updated box is not automatically synced to `buyBoxes` state
  - Kanban may show stale data until page refresh

---

## 4. Pause/Resume/Delete

### Pause Buy Box
- **Trigger**: BuyBoxCard "Pause" button (active column only)
- **Props chain**: 
  ```
  App.jsx:215 → BuyBoxesView.onPause = setPausingBuyBox
    ↓
  BuyBoxCard.onPause(box) → calls onPause(box)
    ↓ (line 220)
  BuyBoxesView.handlePause(box) → calls onPause(box) (line 311)
    ↓ (line 366 in Column)
  App.jsx setPausingBuyBox(box)
  ```
- **Confirmation**: PauseBoxConfirm modal (line 240)
- **Action**: `patchBuyBox(box.id, { status: 'paused' })` (line 98)
- **After**: Modal closes via `setPausingBuyBox(null)`
- **Status**: WIRED ✓

### Resume Buy Box
- **Trigger**: BuyBoxCard "Resume" button (paused column only)
- **Props chain**:
  ```
  App.jsx doesn't have onResume prop
    ↓
  BuyBoxesView.handleResume(id) (line 314)
    ↓
  patchBuyBox(id, { status: 'active' })
    ↓
  Shows toast: "Search resumed — runs tonight."
  ```
- **Status**: WIRED ✓ (internal to BuyBoxesView, no App involvement)

### Drag & Drop Reorder
- **Trigger**: User drags card between columns
- **Logic**: BuyBoxesView.handleDrop() (line 325-331)
- **Action**: `patchBuyBox(id, { status: newStatus })`
- **Status map**: `{ active: 'active', paused: 'paused', pending: 'pending', validating: 'pending' }`
- **Gap column**: Cannot drop into gap; ignored
- **Status**: WIRED ✓

### Delete/Archive
- **Trigger**: Not found
- **Menu options**: BuyBoxCard shows only "Edit" and settings button
- **NO delete button**: Line 240-247 shows only Configure, Edit, Pause/Resume actions
- **Status**: NOT IMPLEMENTED (no delete UI or API call)

---

## 5. Confirm Modal

### Configurations
```
CONFIGS = {
  pause: account pause,
  cancel: subscription cancel,
  'pause-box': buy box pause
}
```

### Usage in App.jsx
1. **confirmDanger state**: Line 111
2. **Set by**: SettingsView.onConfirmDanger (line 226)
3. **Rendered**: Line 239 `{confirmDanger && <ConfirmModal kind={confirmDanger} ... />}`
4. **Close**: Line 239 `onClose={() => setConfirmDanger(null)}`

### Pause Box Modal
- **Name**: `kind="pause-box"`
- **Title**: "Pause this buy box?"
- **Body**: "Nightly runs will stop for this buy box..."
- **Buttons**: "Pause Buy Box" (primary), "Keep Running" (cancel)
- **Callback**: `onConfirm` in PauseBoxConfirm component (line 98)
  - Calls: `patchBuyBox(buyBox.id, { status: 'paused' })`

### Account Pause
- **Name**: `kind="pause"`
- **Wired in**: SettingsView.onConfirmDanger (not shown)

### Subscription Cancel
- **Name**: `kind="cancel"`
- **Wired in**: SettingsView.onConfirmDanger (not shown)

---

## 6. Props Chain Analysis

### App → BuyBoxesView
```jsx
<BuyBoxesView
  onCreate={() => setShowWizard(true)}        // ✓ WIRED
  onEdit={setEditingBuyBox}                   // ✓ WIRED (but has ID/object bug)
  onPause={setPausingBuyBox}                  // ✓ WIRED
/>
```

### BuyBoxesView → BuyBoxCard
```jsx
<BuyBoxCard
  box={b}
  column={col.id}
  onEdit={onEdit}                             // ✓ receives from App
  onPause={handlePause}                       // ✓ wraps onPause prop
  onResume={handleResume}                     // ✓ internal handler
  onDragStart={onDragStart}                   // ✓ internal handler
/>
```

### BuyBoxCard Handlers
```jsx
onClick={() => onEdit?.(box.id)}              // ❌ PASSES ID, NOT BOX
onClick={() => onPause?.(box)}                // ✓ PASSES FULL BOX
onClick={() => onResume?.(box.id)}            // ✓ PASSES ID (correct for resume)
onDragStart={(e) => onDragStart(e, box)}      // ✓ PASSES BOX
```

### LeftPanel → App
```jsx
<button onClick={onCreateBuyBox} />            // ✓ WIRED (line 125)
```

### TopHeader
- No buy-box-related actions
- Only renders PipelineTimeline

---

## 7. Post-Submit Refresh

### After Create
1. BuyBoxWizard calls: `api.post('/api/dealfeed/onboarding', payload)`
2. API succeeds, wizard shows success screen
3. User clicks "Back to dashboard"
4. onSuccess() closes wizard and navigates to boxes
5. **Result**: New box NOT automatically in `buyBoxes` state
6. **Fix needed**: Call `useDeals().refetch()` in onSuccess

### After Edit
1. BuyBoxWizard calls: `api.patch('/api/dealfeed/buy-boxes/{id}', payload)`
2. API succeeds, wizard shows success screen
3. User clicks "Back to dashboard"
4. onSuccess() closes wizard
5. **Result**: Updated box NOT automatically synced to `buyBoxes` state
6. **Fix needed**: Call `useDeals().refetch()` in onSuccess

### Current Refresh Mechanism
- DealsContext provides `refetch()` (line 140)
- Called on mount (line 72)
- Called manually by: Resume action only (no toast on refresh)
- NOT called after: Create or edit via wizard

### Manual Refresh by User
- User navigates away and back to boxes view
- Entire app remounts? No, view state changes but DealsProvider doesn't refetch
- User manually reloads page? Yes, fetchAll() runs on DealsProvider mount

---

## 8. Routing & Navigation

### View-Based Navigation
- App uses `view` state (line 110)
- Navigation via `setView()` callback from LeftPanel
- No URL-based routing for wizard (wizard is state-based)
- `/deal/:dealId` for individual deals (URL routing)
- `/dashboard`, `/map`, `/boxes`, `/calendar`, `/settings`, `/invites`, `/admin` are inferred from `view` state

### Normalization
- App normalizes bare `/` to `/dashboard` (line 140-143)
- Escape key closes modals but doesn't change view (line 148-151)

### Wizard Location
- Rendered at App.jsx root (lines 241-262)
- Outside main Routes block
- Always visible when state is true, regardless of current view

---

## 9. Edit Mode: Full Flow with Bug Detail

### The Bug
In BuyBoxCard (line 170):
```jsx
onClick={() => onEdit?.(box.id)}  // ❌ WRONG: passes ID only
```

Should be:
```jsx
onClick={() => onEdit?.(box)}     // ✓ CORRECT: pass full box
```

### Impact
- User clicks "Edit" on a card
- BuyBoxCard calls `onEdit(box.id)`
- BuyBoxesView calls `onEdit(box.id)` (which is `setEditingBuyBox`)
- App.jsx receives ID instead of box object
- BuyBoxWizard gets `initialData={boxId}` (a string/number)
- `toNativeForm(initialData)` receives non-object
- Form defaults to empty state
- User sees blank form, not pre-populated fields

### Other Edit Calls (Correct)
- Line 231: "Edit geo" button: `onClick={() => onEdit?.(box.id)}` — also wrong
- Line 236: "Configure" button: `onClick={() => onEdit?.(box.id)}` — also wrong
- Line 244: Settings icon: `onClick={() => onEdit?.(box.id)}` — also wrong

All four edit triggers pass ID instead of box.

---

## 10. Resume Implementation Detail

### Handler Chain
```
BuyBoxCard → onResume(box.id)
  ↓
BuyBoxesView.handleResume(id)
  ↓
await patchBuyBox(id, { status: 'active' })
  ↓
DealsContext.patchBuyBox:
  - API PATCH
  - Update local buyBoxes state
  - Show no feedback
  ↓
BuyBoxesView catches and shows toast
```

### Toast Messaging
```jsx
addToast('Search resumed — runs tonight.', 'success')
```

---

## Verdict

### Overall Assessment
The app-level wiring is mostly functional with clear but fixable issues.

### Critical Issues
1. **Edit Mode Broken**: BuyBoxCard passes `box.id` instead of full `box` object to onEdit. This prevents form pre-population. All four edit buttons have this bug.
   - Impact: Users cannot edit buy boxes; form always appears empty
   - Fix: Change `onEdit?.(box.id)` to `onEdit?.(box)` in all 4 places (lines 170, 231, 236, 244)

2. **Missing Post-Submit Refresh**: After creating or editing a buy box, the app does not refetch the buy boxes list. The new/updated box exists in the API but not in the UI state.
   - Impact: User creates box, kanban doesn't update until page reload
   - Fix: In BuyBoxWizard.onSuccess callback (App.jsx lines 244-248, 256-259), call `useDeals().refetch()` before closing wizard

### Design Issues
1. **No Delete/Archive UI**: BuyBoxCard shows no delete button. Users cannot remove a buy box. No frontend or backend wiring.
   - Impact: Buy boxes are permanent; pause is the only alternative
   - Fix: Add "Archive" button, implement API DELETE endpoint, wire in confirmation modal

2. **Backdrop Click**: BuyBoxWizard backdrop exists but doesn't close the modal
   - Impact: User cannot click outside to dismiss; must use X or Escape
   - Fix: Add `onClick={onCancel}` to backdrop div

3. **No Resume Toast**: Resume action doesn't show failure feedback if API fails
   - Impact: User doesn't know if resume succeeded or failed
   - Fix: Wrap in try/catch (already done at line 314-321) ✓

### Flow Status
- **Wizard open**: ✓ Fully wired
- **Wizard close**: ✓ Fully wired (Escape, X button)
- **Create mode**: ✓ Wired (but missing refresh)
- **Edit mode**: ❌ Broken (ID vs object mismatch)
- **Success screen**: ✓ Displays, but doesn't refresh data
- **Pause/Resume**: ✓ Fully wired
- **Delete**: ❌ Not implemented
- **Data refresh**: ❌ Missing after create/edit
- **Props chain**: ⚠️ Correct structure but bug at BuyBoxCard level

### Recommended Fixes (Priority Order)
1. **HIGH**: Fix onEdit to pass full box object (4 lines)
2. **HIGH**: Add refetch() call after create/edit success (2 lines)
3. **MEDIUM**: Add backdrop click handler to close wizard (1 line)
4. **MEDIUM**: Implement delete/archive flow (UI + API + modal)
5. **LOW**: Add error handling feedback to resume action (already done)
