import { useState, useEffect, useRef, Fragment } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { BuyBoxPage1 } from './BuyBoxPage1';
import { BuyBoxPage2, BuyBoxPage3 } from './BuyBoxPage23';
import { BuyBoxPage4 } from './BuyBoxPage4';
import { BuyBoxPage5 } from './BuyBoxPage5';
import { BuyBoxPage6 } from './BuyBoxPage6';
import { BuyBoxRightRail } from './BuyBoxRightRail';
import { Ic } from './buybox-icons';
import '../styles/buy-box-wizard.css';
import '../styles/buy-box-wizard-pages.css';

const STEPS = [
  { id: 1, label: 'Target' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Owner' },
  { id: 4, label: 'Distress' },
  { id: 5, label: 'Threshold' },
  { id: 6, label: 'Activate' },
];

const NATIVE_FORM = {
  assets: [],
  geo: { states: [], counties: [], zips: [] },
  phys: { sf_min: '', sf_max: '', acres_min: '', acres_max: '', year_min: '', year_max: '', stories_min: '', units_min: '', units_max: '' },
  fin: { price_min: '', price_max: '', equity_preset: '', assessed_below_market: false },
  owner: { entity: '', occupancy: '', hold_min: '', hold_max: '', out_of_state: false },
  signals: [],
  logic: 'OR',
  risk: { climate: 10, flood: false, wildfire: 10, wildfireOpen: false, heat: 10, heatOpen: false },
  threshold: 'balanced',
  delivery: { cadence: 'daily', max: 25 },
  name: '',
  matchCount: 0,
};

const ASSET_CLASS_TITLES = {
  sfr: 'SFR', small_mf: 'Small MF', large_mf: 'Large MF',
  commercial: 'Commercial', industrial: 'Industrial',
  mixed_use: 'Mixed Use', land: 'Land', hospitality: 'Hospitality',
};

const EQUITY_MAP = { '25%': 0.25, '40%': 0.40, '50%': 0.50, '60%': 0.60, '75%': 0.75 };
const THRESHOLD_MAP = { volume: 0.70, balanced: 0.80, precision: 0.90 };
const ENTITY_MAP = { individual: ['individual'], llc: ['llc'], trust: ['trust'] };

function toNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function toNativeForm(b) {
  if (!b) return { ...NATIVE_FORM };
  const reversedEquity = Object.entries(EQUITY_MAP).find(([, v]) => v === b.min_equity_pct)?.[0] || '';
  const reversedThreshold = Object.entries(THRESHOLD_MAP).find(([, v]) => v === b.match_threshold)?.[0] || 'balanced';
  const rawEntity = b.owner_types;
  const reversedEntity = rawEntity?.length === 1
    ? (Object.entries(ENTITY_MAP).find(([, v]) => v[0] === rawEntity[0])?.[0] || 'any')
    : rawEntity?.length > 1 ? 'any' : '';
  return {
    assets: b.asset_classes || [],
    geo: { states: b.geo_states || [], counties: b.geo_counties || [], zips: b.geo_zips || [] },
    phys: {
      sf_min: b.sf_min ?? '', sf_max: b.sf_max ?? '',
      acres_min: b.acres_min ?? '', acres_max: b.acres_max ?? '',
      year_min: b.year_built_min ?? '', year_max: b.year_built_max ?? '',
      stories_min: b.stories_min ?? '', units_min: b.units_min ?? '', units_max: b.units_max ?? '',
    },
    fin: {
      price_min: b.value_min ?? '', price_max: b.value_max ?? '',
      equity_preset: reversedEquity, assessed_below_market: b.under_assessed || false,
    },
    owner: {
      entity: reversedEntity,
      occupancy: b.absentee_only ? 'absentee' : '',
      hold_min: b.hold_period_min ?? '', hold_max: b.hold_period_max ?? '',
      out_of_state: b.out_of_state_only || false,
    },
    signals: b.distress_signals || [],
    logic: b.distress_match_mode ? b.distress_match_mode.toUpperCase() : 'OR',
    risk: {
      climate: b.climate_risk_max ? b.climate_risk_max / 10 : 10,
      flood: b.flood_exclude || false,
      wildfire: b.wildfire_risk_max ? b.wildfire_risk_max / 10 : 10,
      wildfireOpen: false,
      heat: b.heat_risk_max ? b.heat_risk_max / 10 : 10,
      heatOpen: false,
    },
    threshold: reversedThreshold,
    delivery: {
      cadence: b.run_schedule?.days?.length === 1 ? 'weekly' : 'daily',
      max: b.delivery_max_per_run || 25,
    },
    name: b.label || '',
    matchCount: 0,
  };
}

function nativeToPayload(form) {
  return {
    label: form.name || '',
    asset_classes: form.assets.length ? form.assets : null,
    asset_class: null,
    geo_states: form.geo.states.length ? form.geo.states : null,
    geo_counties: form.geo.counties.length ? form.geo.counties : null,
    geo_zips: form.geo.zips.length ? form.geo.zips : null,
    sf_min: toNum(form.phys.sf_min), sf_max: toNum(form.phys.sf_max),
    acres_min: toNum(form.phys.acres_min), acres_max: toNum(form.phys.acres_max),
    year_built_min: toNum(form.phys.year_min), year_built_max: toNum(form.phys.year_max),
    stories_min: toNum(form.phys.stories_min),
    units_min: toNum(form.phys.units_min), units_max: toNum(form.phys.units_max),
    value_min: toNum(form.fin.price_min), value_max: toNum(form.fin.price_max),
    min_equity_pct: form.fin.equity_preset ? (EQUITY_MAP[form.fin.equity_preset] ?? null) : null,
    under_assessed: form.fin.assessed_below_market || false,
    owner_types: ENTITY_MAP[form.owner.entity] ?? null,
    absentee_only: form.owner.occupancy === 'absentee',
    out_of_state_only: form.owner.out_of_state || false,
    hold_period_min: toNum(form.owner.hold_min), hold_period_max: toNum(form.owner.hold_max),
    distress_signals: form.signals.length ? form.signals : null,
    distress_only: form.signals.length > 0,
    distress_match_mode: form.logic.toLowerCase(),
    climate_risk_max: form.risk.climate < 10 ? form.risk.climate * 10 : null,
    flood_exclude: form.risk.flood || false,
    wildfire_risk_max: form.risk.wildfire < 10 ? form.risk.wildfire * 10 : null,
    heat_risk_max: form.risk.heat < 10 ? form.risk.heat * 10 : null,
    match_threshold: THRESHOLD_MAP[form.threshold] ?? 0.80,
    run_schedule: form.delivery.cadence === 'weekly' ? { days: ['mon'] } : { days: ['mon','tue','wed','thu','fri','sat','sun'] },
    delivery_max_per_run: form.delivery.max || 25,
  };
}

function buildFilters(form) {
  const out = [];
  if (form.assets.length) out.push({ id: 'assets', label: 'Assets', val: form.assets.length === 1 ? (ASSET_CLASS_TITLES[form.assets[0]] || form.assets[0]) : `${form.assets.length} classes` });
  if (form.geo.states.length) out.push({ id: 'states', label: 'States', val: form.geo.states.join(', ') });
  if (form.geo.counties.length) out.push({ id: 'counties', label: 'Counties', val: `${form.geo.counties.length}` });
  if (form.geo.zips.length) out.push({ id: 'zips', label: 'Zips', val: form.geo.zips.length === 1 ? form.geo.zips[0] : `${form.geo.zips.length}` });
  if (form.fin.equity_preset) out.push({ id: 'equity', label: 'Equity', val: `≥ ${form.fin.equity_preset}` });
  if (form.fin.assessed_below_market) out.push({ id: 'under', label: '', val: 'Under-assessed' });
  if (form.owner.occupancy && form.owner.occupancy !== 'any') out.push({ id: 'occ', label: 'Occ.', val: form.owner.occupancy });
  if (form.owner.hold_min) out.push({ id: 'hold', label: 'Hold', val: `≥${form.owner.hold_min}yr` });
  if (form.owner.out_of_state) out.push({ id: 'oos', label: '', val: 'Out-of-state' });
  if (form.owner.entity && form.owner.entity !== 'any') out.push({ id: 'entity', label: 'Entity', val: form.owner.entity });
  if (form.signals.length) out.push({ id: 'signals', label: form.logic, val: `${form.signals.length} signals` });
  if (form.risk.climate < 10) out.push({ id: 'climate', label: 'Climate', val: `≤${form.risk.climate}` });
  if (form.risk.flood) out.push({ id: 'flood', label: '', val: 'No floodplain' });
  return out;
}

function buildSummary(form) {
  const arr = [];
  form.assets.forEach(a => arr.push({ label: 'Asset', val: ASSET_CLASS_TITLES[a] || a }));
  if (form.geo.states.length) arr.push({ label: 'States', val: form.geo.states.join(', ') });
  if (form.geo.counties.length) arr.push({ label: 'Counties', val: `${form.geo.counties.length} selected` });
  if (form.geo.zips.length) arr.push({ label: 'Zips', val: form.geo.zips.join(', ') });
  if (form.phys.sf_min || form.phys.sf_max) arr.push({ label: 'Sqft', val: `${form.phys.sf_min || 'any'}–${form.phys.sf_max || 'any'}` });
  if (form.phys.year_min || form.phys.year_max) arr.push({ label: 'Year', val: `${form.phys.year_min || 'any'}–${form.phys.year_max || 'any'}` });
  if (form.fin.price_min || form.fin.price_max) arr.push({ label: 'Price', val: `${form.fin.price_min ? '$' + form.fin.price_min : 'any'}–${form.fin.price_max ? '$' + form.fin.price_max : 'any'}` });
  if (form.fin.equity_preset) arr.push({ label: 'Equity', val: `≥ ${form.fin.equity_preset}` });
  if (form.fin.assessed_below_market) arr.push({ label: '', val: 'Under-assessed' });
  if (form.owner.entity && form.owner.entity !== 'any') arr.push({ label: 'Entity', val: form.owner.entity });
  if (form.owner.occupancy && form.owner.occupancy !== 'any') arr.push({ label: 'Occ.', val: form.owner.occupancy });
  if (form.owner.hold_min) arr.push({ label: 'Hold', val: `≥${form.owner.hold_min}yr` });
  if (form.owner.out_of_state) arr.push({ label: '', val: 'Out-of-state' });
  arr.push({ label: 'Threshold', val: form.threshold === 'volume' ? '70% Volume' : form.threshold === 'precision' ? '90%+ Precision' : '80% Balanced' });
  if (form.signals.length) arr.push({ label: form.logic, val: `${form.signals.length} signals` });
  if (form.risk.climate < 10) arr.push({ label: 'Climate', val: `≤${form.risk.climate}/10` });
  if (form.risk.flood) arr.push({ label: '', val: 'No floodplain' });
  return arr;
}

function canGoNext(page, form) {
  if (page === 1) return form.assets.length > 0 && form.geo.states.length > 0;
  return true;
}

export function BuyBoxWizard({ mode, initialData, onSuccess, onCancel }) {
  const addToast = useToast();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(() => mode === 'edit' && initialData ? toNativeForm(initialData) : { ...NATIVE_FORM });
  const [activating, setActivating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activatedForm, setActivatedForm] = useState(null);
  const formRef = useRef(form);
  const debounceRef = useRef(null);

  useEffect(() => { formRef.current = form; });

  const filterKey = JSON.stringify({
    assets: form.assets, geo: form.geo, phys: form.phys, fin: form.fin,
    owner: form.owner, signals: form.signals, logic: form.logic,
    risk: form.risk, threshold: form.threshold,
  });

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const payload = nativeToPayload(formRef.current);
        const data = await api.post('/api/dealfeed/buy-boxes/preview', payload);
        if (typeof data.count === 'number') {
          setForm(f => ({ ...f, matchCount: data.count }));
        }
      } catch {
        // preview endpoint may not exist; failure is non-fatal
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filterKey]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (page < 6 && canGoNext(page, formRef.current)) setPage(p => p + 1);
      }
      if (e.key === 'ArrowRight' && e.altKey && page < 6) setPage(p => p + 1);
      if (e.key === 'ArrowLeft' && e.altKey && page > 1) setPage(p => p - 1);
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, onCancel]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const payload = nativeToPayload(form);
      if (mode === 'edit' && initialData?.id) {
        await api.patch(`/api/dealfeed/buy-boxes/${initialData.id}`, payload);
      } else {
        await api.post('/api/dealfeed/onboarding', payload);
      }
      setActivatedForm(form);
      setSubmitted(true);
    } catch (err) {
      addToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setActivating(false);
    }
  };

  const filters = buildFilters(form);
  const summary = buildSummary(form);

  const clearFilter = (id) => {
    const f = form;
    if (id === 'assets') setForm({ ...f, assets: [] });
    else if (id === 'states') setForm({ ...f, geo: { ...f.geo, states: [], counties: [] } });
    else if (id === 'counties') setForm({ ...f, geo: { ...f.geo, counties: [] } });
    else if (id === 'zips') setForm({ ...f, geo: { ...f.geo, zips: [] } });
    else if (id === 'equity') setForm({ ...f, fin: { ...f.fin, equity_preset: '' } });
    else if (id === 'under') setForm({ ...f, fin: { ...f.fin, assessed_below_market: false } });
    else if (id === 'occ') setForm({ ...f, owner: { ...f.owner, occupancy: '' } });
    else if (id === 'hold') setForm({ ...f, owner: { ...f.owner, hold_min: '' } });
    else if (id === 'oos') setForm({ ...f, owner: { ...f.owner, out_of_state: false } });
    else if (id === 'entity') setForm({ ...f, owner: { ...f.owner, entity: '' } });
    else if (id === 'signals') setForm({ ...f, signals: [] });
    else if (id === 'climate') setForm({ ...f, risk: { ...f.risk, climate: 10 } });
    else if (id === 'flood') setForm({ ...f, risk: { ...f.risk, flood: false } });
  };

  const renderPage = () => {
    switch (page) {
      case 1: return <BuyBoxPage1 form={form} setForm={setForm} />;
      case 2: return <BuyBoxPage2 form={form} setForm={setForm} />;
      case 3: return <BuyBoxPage3 form={form} setForm={setForm} />;
      case 4: return <BuyBoxPage4 form={form} setForm={setForm} />;
      case 5: return <BuyBoxPage5 form={form} setForm={setForm} />;
      case 6: return <BuyBoxPage6 form={form} setForm={setForm} matchCount={form.matchCount} summary={summary} onActivate={handleActivate} activating={activating} />;
      default: return null;
    }
  };

  return (
    <div className="buy-box-wizard">
      <div className="backdrop" />
      {submitted && (
        <div className="confirm">
          <div className="confirm-card">
            <div className="confirm-check">
              <Ic.check width="24" height="24" />
            </div>
            <div className="confirm-title">You're hunting.</div>
            <div className="confirm-sub">
              <strong>{activatedForm?.name || 'Your buy box'}</strong> is live.
              First batch lands at <strong>06:00 AM tomorrow</strong>.
            </div>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={onSuccess}>
              Back to dashboard
            </button>
          </div>
        </div>
      )}
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">N</span>
            <span className="brand-name">Nightdrop</span>
            <span className="brand-sep">›</span>
            <span className="brand-context">{mode === 'edit' ? 'Edit buy box' : 'New buy box'}</span>
          </div>

          <div className="stepper">
            {STEPS.map((s, i) => (
              <Fragment key={s.id}>
                <button
                  className={`step${page === s.id ? ' active' : page > s.id ? ' done' : ''}`}
                  onClick={() => { if (page > s.id) setPage(s.id); }}
                >
                  <span className="step-num">
                    <span className="step-num-text mono">{String(s.id).padStart(2, '0')}</span>
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <span className={`step-bar${page > s.id ? ' done' : ''}`} />}
              </Fragment>
            ))}
          </div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous step">←</button>
            <button className="icon-btn" onClick={() => page < 6 && canGoNext(page, form) && setPage(p => p + 1)} disabled={page === 6 || !canGoNext(page, form)} aria-label="Next step">→</button>
            <span style={{ margin: '0 8px', color: 'var(--border-hi)' }}>|</span>
            <span>Next</span>
            <span className="kbd">⌘↵</span>
            <button className="icon-btn" style={{ marginLeft: 8 }} onClick={onCancel} aria-label="Close">
              <Ic.close width="16" height="16" />
            </button>
          </div>
        </header>

        <div className="main">
          <div className="content-col">
            <main className="content">
              <div className="content-inner">{renderPage()}</div>
            </main>
            <footer className="footer">
              <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <Ic.arrowL width="14" height="14" /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-mute)' }}>
                  Step {page} of 6 · {form.matchCount.toLocaleString('en-US')} matches
                </span>
                {page < 6 ? (
                  <button className="btn btn-primary" onClick={() => setPage(p => p + 1)} disabled={!canGoNext(page, form)}>
                    Continue <span className="kbd">⌘↵</span>
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleActivate} disabled={activating || !form.name.trim()}>
                    {activating ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Review & activate'}
                  </button>
                )}
              </div>
            </footer>
          </div>

          <BuyBoxRightRail matchCount={form.matchCount} filters={filters} geoStates={form.geo.states} onRemoveFilter={clearFilter} />
        </div>
      </div>
    </div>
  );
}
