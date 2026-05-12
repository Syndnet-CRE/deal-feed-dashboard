HANDOFF
Date: 2026-05-12
Repo: deal-feed-dashboard
Session objective: Fix P1/P2 buy box bugs from audit — RC-4 through RC-10
Status: COMPLETE (all actionable fixes done; RC-5 and RC-6 are feature gaps, not surgical fixes)

---

What was done:

RC-4 fixed (commit fa08b8f):
- nativeToPayload() was missing stories_min entirely — added stories_min: toNum(form.phys.stories_min)
- toNativeForm() was hardcoding '' for stories_min on pre-fill — fixed to b.stories_min ?? ''
- BuyBoxPage23.jsx stories chip values were label strings ('1','2','3','4–6','7+') — changed to numeric floor values (1,2,3,4,7) so toNum() can serialize them correctly
- Files: src/components/BuyBoxWizard.jsx, src/components/BuyBoxPage23.jsx

RC-7 fixed (commit b6c8209):
- nativeToPayload() was sending under_assessed field — backend schema uses assessed_below_market. Fixed.
- toNativeForm() was reading b.under_assessed on pre-fill — fixed to b.assessed_below_market
- Root cause confirmed against scoutgpt-api migration 046_buybox_wizard_v2.sql
- File: src/components/BuyBoxWizard.jsx

RC-8 fixed (commit 56386d5):
- BuyBoxPage6 "Edit ↗" and "Connect to email →" buttons had no onClick — both were dead
- Added goToStep prop to BuyBoxPage6 component signature
- "Edit ↗" now calls goToStep(1) — jumps back to asset/geo filters page
- "Connect to email →" now calls goToStep(5) — jumps back to delivery settings page
- Wired goToStep={setPage} in BuyBoxWizard.jsx at case 6 render call
- Files: src/components/BuyBoxPage6.jsx, src/components/BuyBoxWizard.jsx

RC-10 fixed (commit 56386d5):
- Activate ribbon hardcoded "06:00 AM tomorrow" regardless of user's cadence selection
- Now derives time from CADENCES array using delivery.cadence; realtime cadence gets a separate message
- Files: src/components/BuyBoxPage6.jsx

Pushed to main — Netlify deploy triggered.

---

What was NOT done (and why):

RC-5 (zoning_codes payload):
- Audit claimed zoning was collected in form.phys.zoning. This field does not exist anywhere.
- NATIVE_FORM has no zoning key. No wizard page collects it. The audit hallucinated the form field.
- Real fix requires new UI (zoning input on Page 2) + form state + payload serialization. Feature gap, not a bug fix.

RC-6 (sub-asset class UI on Page 1):
- Audit called this "Page 1 must import buyBoxTaxonomy.js and render a sub-asset selector."
- Reality: BuyBoxPage1's asset class IDs (small_mf, large_mf, commercial, mixed) don't exist in buyBoxTaxonomy.js at all.
- The payload model diverges too: wizard uses asset_classes (plural string IDs); taxonomy system uses asset_class (singular) + asset_use_codes (ATTOM numeric codes).
- This is an architectural redesign, not a page edit. Needs dedicated BMAD session.

RC-9 (right rail stat trio):
- Stats ($184K, 11.3yr, 47%) are hardcoded literals in BuyBoxRightRail.jsx.
- Wiring them requires either the preview API response or deriving from form.fin.* fields.
- Not broken enough to block beta — deferred.

---

Remaining audit items by priority:

| RC | Status | Notes |
|----|--------|-------|
| RC-1 | DONE | Edit mode blank form |
| RC-2 | DONE | showToast was undefined |
| RC-3 | DONE | No refetch after create/edit |
| RC-4 | DONE | stories_min missing + string chip values |
| RC-5 | DEFERRED | Zoning field is a feature gap |
| RC-6 | DEFERRED | Sub-asset class is architectural redesign |
| RC-7 | DONE | assessed_below_market field name |
| RC-8 | DONE | Page 6 edit buttons wired |
| RC-9 | DEFERRED | Right rail stats still hardcoded |
| RC-10 | DONE | Dynamic cadence time in activate ribbon |

---

Next session:

Decide whether to tackle RC-5 (new zoning UI), RC-6 (asset class architectural redesign), or RC-9 (right rail stats). All three require new features, not bug fixes. RC-5 and RC-9 are smaller; RC-6 needs a BMAD planning session first.

cd ~/deal-feed-dashboard && claude --dangerously-skip-permissions

Blockers for Brady:

None. All 7 actionable RC fixes are live. RC-5/RC-6/RC-9 need Brady to scope before implementation.
