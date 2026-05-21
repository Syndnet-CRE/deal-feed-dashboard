<!-- Generated: 2026-05-20 | Files scanned: ~75 | Token estimate: ~900 -->
# Frontend — nightdrop-dashboard

## Routes (src/App.jsx)
```
/login                          → LoginView (unauth)
/forgot-password                → ForgotPasswordView (unauth)
/reset-password                 → ResetPasswordView (unauth)
/invite/:token                  → InviteClaimView (unauth)
/buy-boxes/new                  → BuyBoxPage mode="new"  → BuyBoxWizard
/buy-boxes/:id/edit             → BuyBoxPage mode="edit" → BuyBoxWizard
/*  (catch-all auth)            → AppShell  → views switched by `view` state
                                              (no URLs for non-deal views)
/deal/:id                       → DealDetailPage  (state.fromMap → DealDetailModal)
```

## View map (state-driven inside AppShell)

| `view` value     | Component                       | Description                                  |
|------------------|---------------------------------|----------------------------------------------|
| `dashboard`      | views/DashboardView.jsx         | Main feed: LeftRail + center feed + RightRail|
| `map`            | views/MapView.jsx               | Full-screen Mapbox + DealPanel sidebar       |
| `buy-boxes`      | views/BuyBoxesView.jsx          | Kanban (pending / active / paused / gap)     |
| `accounts`       | views/AccountsView.jsx          | Owner roll-up (subscriber-level)             |
| `settings`       | views/SettingsView.jsx          | Profile + password                           |
| `invites`        | views/InviteView.jsx            | Admin invite queue (brady@parcyl.ai)         |
| `admin`          | views/AdminView.jsx             | Admin dashboard (brady@parcyl.ai)            |

## Component hierarchy

### Top-level chrome
```
TopHeader (logo + countdown + pipeline track)
LeftPanel (nav + TonightsRunCard + metric tiles)
RightRail (DashboardView-only stats)
ChatFab → DealChatThread (agent chat)
Toast (via useToast — never render directly)
```

### Buy Box Wizard (7 steps)
```
BuyBoxWizard.jsx (shell, ~340 lines)
  ├─ wizardFormState.js (EMPTY_FORM, nativeToPayload, toNativeForm)
  ├─ buyBoxFieldSchema.js (class → field visibility map)
  ├─ buyBoxTaxonomy.js (10 ASSET_CLASSES, LAND_SUB_ASSETS, building classes)
  ├─ buyBoxInputs.jsx (NumberField, RangeInputs, SingleInput — shared themed inputs)
  ├─ numberFormat.js (formatNumber / parseNumber: int / money / year / decimal)
  └─ pages:
      ├─ BuyBoxPage1.jsx     (Target: 10 asset cards + subtypes + geography)
      ├─ BuyBoxPage23.jsx    (Profile + Owner)
      ├─ BuyBoxPage4.jsx     (Distress signals — tier-coded cards)
      ├─ BuyBoxPage5.jsx     (Location & Risk — utilities + class-specific)
      ├─ BuyBoxPage6.jsx     (Threshold — Volume/Balanced/Precision)
      ├─ BuyBoxPage7.jsx     (Activate — name + delivery + activate)
      └─ BuyBoxRightRail.jsx (live match pool + filter chips)
  ScrollHint: auto-detected via useScrollHint hook (any page that overflows)
```

### Dashboard feed
```
views/DashboardView.jsx
  ├─ LeftRail.jsx (filter tiles)
  └─ feed/
       ├─ WeekDayTabs.jsx       (Sun–Sat nav)
       ├─ FeedDealCard.jsx      (deal card)
       │    ├─ normalizeAssetClass (10-class map)
       │    └─ quickFacts (per-class fact config)
       └─ TonightsRunCard.jsx
```

### Deal detail
```
DealDetail.jsx (12 tabs, ~1100 lines)
  ├─ OwnerPortfolio.jsx (D3 force graph)
  ├─ PipelineTimeline.jsx
  ├─ ContactLogModal.jsx
  └─ ScoreBadge, AerialThumb, DealComponents shared atoms
```

### Buy boxes kanban
```
views/BuyBoxesView.jsx
  ├─ BuyBoxCard
  │    ├─ CardMenu (Tune button → Edit / Pause / Delete / Fix-geo)
  │    └─ formatAsset (uses getAssetClass for humanized labels)
  └─ ConfirmModal (delete/pause confirm)
```

### Map view
```
views/MapView.jsx
  ├─ DealMap.jsx (Mapbox, fitDeals in onLoad + useEffect)
  ├─ DealPanel.jsx (collapsible sidebar)
  └─ DealPanelCard.jsx (expandable preview)
```

## State management

### React context
| Context                          | Hook                  | Scope                                       |
|----------------------------------|-----------------------|---------------------------------------------|
| `DealsContext.jsx`               | `useDeals()`          | deals, buyBoxes, contacts, portfolios + CRUD|
| `ToastContext.jsx`               | `useToast()`          | toast queue                                 |
| `ReadStateContext.jsx`           | `useReadState()`      | localStorage read/unread per subscriber     |
| `DealStateContext.jsx`           | `useDealState()`      | localStorage deal-state machine             |
| `useAuth.jsx`                    | `useAuth()`           | JWT + subscriber object                     |

### Form state pattern (BuyBoxWizard)
Single deep object held in `useState`. Mutations always immutable
(`setForm({...form, ...})`). `formRef` mirror for stable closures in debounced
preview effect. `wizardFormState.js` exports the canonical shape.

## Styling
- Plain CSS, no Tailwind. Tokens in `src/styles/tokens.css`.
- Font tokens: `--font-ui` (Manrope global, DM Sans inside `.buy-box-wizard`),
  `--font-secondary` (Inter inside wizard), `--font-mono` (legacy, unused in wizard).
- Wizard CSS scoped to `.buy-box-wizard` root class. Two files:
  `buy-box-wizard.css` (chrome) + `buy-box-wizard-pages.css` (page content).
- Heavy global CSS in `styles.css` (~3900 lines) and `feed-layout.css` (~2300).

## Mock fallback
`src/data/mockData.js` is auto-used by `DashboardView` when the API returns
zero deals. Subscribers with truly empty feeds see fake data. Documented
landmine in CLAUDE.md.
