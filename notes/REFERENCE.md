# Nightdrop Dashboard — Reference

Load this when you need component locations or the full endpoint list. Not loaded at session start.

## Key Components

| File | Role |
|------|------|
| `src/components/TopHeader.jsx` | Top nav bar — logo, view links, theme toggle, avatar dropdown |
| `src/components/LeftPanel.jsx` | Left sidebar — nav links, TonightsRunCard |
| `src/components/DealDetail.jsx` | Full-page deal detail (12 tabs). Styled by `deal-detail.css` |
| `src/components/DealMap.jsx` | Reusable Mapbox map. `fitDeals()` fires after `onLoad` and on data change |
| `src/components/DealPanel.jsx` | Collapsible sidebar in MapView. Filter state, sort, CSV export |
| `src/components/DealPanelCard.jsx` | Deal card in DealPanel. Expandable preview, calls `onOpenDeal` |
| `src/components/DealComponents.jsx` | Shared atoms: `ScoreBubble`, `MapPinSVG`, `DealCard` |
| `src/components/Icons.jsx` | Central icon lib — exports `I` object. Always import from here |
| `src/components/BuyBoxWizard.jsx` | Buy box create/edit wizard. Multi-page: Page1–6 + RightRail |
| `src/components/BuyBoxPage1.jsx` | Wizard page 1 |
| `src/components/BuyBoxPage23.jsx` | Wizard pages 2 + 3 (exports `BuyBoxPage2`, `BuyBoxPage3`) |
| `src/components/BuyBoxPage4.jsx` | Wizard page 4 |
| `src/components/BuyBoxPage5.jsx` | Wizard page 5 |
| `src/components/BuyBoxPage6.jsx` | Wizard page 6 |
| `src/components/BuyBoxRightRail.jsx` | Right rail in wizard |
| `src/components/buybox-icons.jsx` | Buy box wizard icon set — exports `Ic` |
| `src/components/LeftRail.jsx` | Left filter rail in DashboardView |
| `src/components/RightRail.jsx` | Right rail in DashboardView |
| `src/components/feed/FeedDealCard.jsx` | Deal card in Dashboard feed |
| `src/components/feed/WeekDayTabs.jsx` | Sun–Sat week nav above feed |
| `src/components/feed/DealChatThread.jsx` | Inline chat on deal card |
| `src/components/feed/ChatFab.jsx` | Floating action button for agent chat |
| `src/components/feed/AgentMessageCard.jsx` | Agent message in chat feed |
| `src/components/feed/MessageInputBar.jsx` | Chat input bar |
| `src/components/feed/TonightsRunCard.jsx` | Tonight's deal run status |
| `src/components/ScoreBadge.jsx` | Deal score badge |
| `src/components/OverflowMenu.jsx` | Three-dot overflow menu on deal cards |
| `src/components/ContactLogModal.jsx` | Log and view contact attempts |
| `src/components/BulkActionBar.jsx` | Bulk action toolbar in DealPanel |
| `src/components/ConfirmModal.jsx` | Generic danger-confirm modal; `kind` prop selects copy |
| `src/components/AerialThumb.jsx` | Aerial imagery thumbnail |
| `src/components/PipelineTimeline.jsx` | Animated pipeline timeline. All styles inlined to avoid cascade conflicts |
| `src/components/MarketNewsfeed.jsx` | Scrolling market news. Data from `src/data/marketPulse.json` |
| `src/components/Toast.jsx` | Toast UI. Use `useToast()` hook — never render directly |
| `src/views/DashboardView.jsx` | Main feed view: LeftRail + center feed + RightRail + ChatFab |
| `src/views/MapView.jsx` | Full-screen map + DealPanel sidebar |
| `src/views/BuyBoxesView.jsx` | Buy box management table |
| `src/views/ForgotPasswordView.jsx` | Forgot password (unauthenticated) |
| `src/views/ResetPasswordView.jsx` | Password reset via URL token (unauthenticated) |
| `src/views/InviteView.jsx` | Admin invite queue manager |
| `src/views/AdminView.jsx` | Admin dashboard — subscriber list, runs, trigger button. Styled by `admin.css` |
| `src/views/InviteClaimView.jsx` | Invite claim at `/invite/:token` (unauthenticated) |
| `src/views/SettingsView.jsx` | Profile + password settings |
| `src/views/LoginView.jsx` | Login at `POST /api/dealfeed/auth/login` |
| `src/lib/format.js` | `fmt(val)`, `hasVal(val)`, `fmtMoney(n)`, `scoreClass(s)` |
| `src/lib/buyBoxTaxonomy.js` | Asset class + property type taxonomy for wizard |
| `src/lib/wizardHelpers.js` | `toNum(v)`, `activeGeoHasData(form)`, `canProceed(step, form)`, `buildPayload(form)` |
| `src/lib/inviteHelpers.js` | `parseInvitesFromText`, `validateInvite`, `dedupeByEmail` |
| `src/data/mockData.js` | Static fallback: `DEALS`, `BUY_BOXES`, `COMPS`, `ASSET_CLASSES` |

## Full Endpoint List

- `POST /api/dealfeed/auth/login` → `{ token, subscriber }`
- `GET /api/dealfeed/auth/me` → `{ subscriber }`
- `PATCH /api/dealfeed/auth/me` → update profile
- `POST /api/dealfeed/auth/change-password`
- `GET /api/dealfeed/auth/invite/:token` → `{ email }` (unauthenticated)
- `POST /api/dealfeed/auth/invite/:token/claim` → activates account (unauthenticated)
- `GET /api/dealfeed/deals` → `{ deals: Deal[] }` — includes `brief_json` and `notes`
- `POST /api/dealfeed/deals/:id/feedback` → body `{ feedback: "hot" | "no" | null }`
- `PATCH /api/dealfeed/deals/:id/notes` → body `{ notes: string }`
- `PATCH /api/dealfeed/deals/:id/status` → body `{ status: string }`
- `PATCH /api/dealfeed/deals/:id/save` → toggles `saved_at` → `{ id, saved: boolean }`
- `PATCH /api/dealfeed/deals/:id/read` → marks read → `{ ok: true }`
- `GET /api/dealfeed/deals/:id/contacts` → `{ contacts: ContactLog[] }`
- `POST /api/dealfeed/deals/:id/contacts` → body `{ method, note, ... }` → `{ contact }`
- `GET /api/dealfeed/buy-boxes` → `{ buy_boxes: BuyBox[] }`
- `PATCH /api/dealfeed/buy-boxes/:id` → pause/resume/edit
- `POST /api/dealfeed/buy-boxes/preview` → `{ count }` (may not exist yet on backend)
- `GET /api/dealfeed/invites` → `{ invites: Invite[] }` (admin only)
- `POST /api/dealfeed/invites` → body `{ invites: [{email, full_name}] }` → `{ added, skipped }`
- `POST /api/dealfeed/invites/send` → `{ sent, failed }`
- `DELETE /api/dealfeed/invites/:id`
- `GET /api/dealfeed/admin/subscribers` → `{ subscribers }` (admin only)
- `GET /api/dealfeed/admin/subscribers/:id` → full detail (admin only)
- `GET /api/dealfeed/admin/runs` → `{ runs: AgentRun[] }` (admin only)
- `POST /api/dealfeed/admin/runs/trigger` → triggers deal-feed run (admin only)
- `GET /api/dealfeed/agent/messages` → `{ messages }` — oldest first
- `POST /api/dealfeed/agent/message` → body `{ content, deal_id? }` → `{ reply }`
