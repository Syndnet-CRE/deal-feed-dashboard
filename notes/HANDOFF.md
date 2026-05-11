# HANDOFF
Date: 2026-05-11
Repo: deal-feed-dashboard
Session objective: DB audit, buy box UX post-mortem, design handoff prompt, toast bug fix
Status: COMPLETE

---

## What was done

### Bug fix (committed + pushed — 3a5abf9)
- `src/App.jsx` — added `useToast` import, added `const addToast = useToast()` to AppShell
- Create onSuccess: fires `addToast('Buy box activated! We start tonight.', 'success')` then navigates to boxes
- Edit onSuccess: fires `addToast('Buy box saved.', 'success')` then closes wizard
- Both handlers were previously silent (no toast, no confirmation)

### Database audit
Queried 423,117 properties across all tables. Key fill rates:

**Solid (use these in wizard):**
- area_building, area_lot_sf, units_count, in_floodplain — 100%
- owner name, absentee flag, company flag, assessed value, market value, water/sewer distance — 99%
- climate risk scores (heat, wildfire, flood) — 98%
- year built — 95%, last sale price — 94%, last sale date — 91%
- ownership_transfer_date (hold period) — 87%
- first_loan_amount, first_interest_rate, first_interest_rate_type — 83%
- ltv, available_equity — 77%, estimated_rental_value — 79%
- foreclosure_records table — 87,846 records, default_amount 100% fill

**Broken (remove from wizard):**
- zoning — 0% (completely empty)
- tax_delinquent_year — 0% (completely empty)
- estimated_value / AVM — 0% (completely empty)

### Design work
- Full buy box UX post-mortem written (persona coverage analysis)
- New 6-page wizard architecture designed and documented
- Design handoff prompt written for Claude design tool

### New wizard architecture (6 pages)
1. Asset class + geography
2. Property profile (physical + financial)
3. Owner profile (entity type, occupancy, hold period, out-of-state)
4. Distress signals + risk tolerance (foreclosure, LTV, ARM, equity, climate risk)
5. Deal quality threshold (Volume 70% / Balanced 80% / Precision 90%+) + distress signal chips
6. Review + activate (name, summary, delivery frequency, max per run, CTA)

**Right rail persistent on all 6 pages:** live match count (JetBrains Mono), avg equity / avg hold / % absentee stats, active filter chips, Mapbox density thumbnail.

---

## Next session

Brady has the Claude Design output (Figma/pencil code) for the new 6-page buy box wizard. Next session: wire the design code into the React app, replace the current BuyBoxWizard.jsx with the new 6-page flow, connect all filters to the backend payload via wizardHelpers.js.

```
cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions
```

Start by reading this HANDOFF, then ask Brady to paste or share the design output code.

---

## Blockers for Brady

1. Hand the design prompt to Claude design, get the output code, bring it to the next session.
2. The full 6-page design prompt is in this conversation -- it ends with the token legend. Copy the full prompt from the last complete version in this thread.
3. New wizard needs backend support for the deal quality threshold (match score filter) -- confirm with scoutgpt-api whether `run_deal_feed.js` supports a `min_score` parameter on the buy box payload. If not, that needs to be added backend-side before the threshold UI does anything.
4. The preview API (`POST /api/dealfeed/buy-boxes/preview`) needs to return avg_equity, avg_hold_years, pct_absentee alongside the count -- right rail stats depend on this. Check scoutgpt-api routes/dealfeed/buy-boxes.js.
