import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { useDeals } from '../contexts/DealsContext';
import { useToast } from '../contexts/ToastContext';
import { canProceedStep, buildPayload } from '../lib/wizardHelpers';
import {
  ASSET_CLASSES, SCHEDULE_DAYS, ALL_DAYS, DISTRESS_SIGNAL_OPTIONS,
  OWNER_TYPE_OPTIONS, GEO_TYPES, US_STATES, MAJOR_METROS,
  getAssetClass, formatUseCodes, formatSchedule, formatGeo,
} from '../lib/buyBoxTaxonomy';
import { I } from './Icons';
import '../styles/buy-box-wizard.css';

const STEP_LABELS = [
  'Asset Class', 'Sub-Asset', 'Name', 'Geography',
  'Criteria', 'Ownership', 'Distress', 'Threshold', 'Schedule', 'Review',
];

const EMPTY_FORM = {
  label: '',
  geoMode: 'state',
  geo_states: [], geo_cities: [], geo_zips: [],
  geo_radius_address: '', geo_radius_miles: 25,
  geo_radius_lat: null, geo_radius_lng: null,
  asset_class: '', asset_use_codes: [],
  sf_min: '', sf_max: '',
  acres_min: '', acres_max: '',
  value_min: '', value_max: '',
  year_built_min: '', year_built_max: '',
  min_hold_yrs: '',
  zoning_codes: [],
  owner_types: [],
  absentee_only: false,
  out_of_state_only: false,
  distress_signals: [],
  distress_only: false,
  distress_match_mode: 'any',
  notes: '',
  match_threshold: 80,
  run_schedule: { days: [...ALL_DAYS] },
};

function detectGeoMode(box) {
  if (box.geo_cities?.length) return 'metro';
  if (box.geo_zips?.length) return 'zip';
  if (box.geo_radius_address) return 'radius';
  return 'state';
}

function toFormState(box) {
  return {
    ...EMPTY_FORM,
    label: box.label || '',
    geoMode: detectGeoMode(box),
    geo_states: box.geo_states || [],
    geo_cities: box.geo_cities || [],
    geo_zips: box.geo_zips || [],
    geo_radius_address: box.geo_radius_address || '',
    geo_radius_miles: box.geo_radius_miles || 25,
    geo_radius_lat: box.geo_radius_lat ?? null,
    geo_radius_lng: box.geo_radius_lng ?? null,
    asset_class: box.asset_class || '',
    asset_use_codes: box.asset_use_codes || [],
    sf_min: box.sf_min ?? '',
    sf_max: box.sf_max ?? '',
    acres_min: box.acres_min ?? '',
    acres_max: box.acres_max ?? '',
    value_min: box.value_min ?? '',
    value_max: box.value_max ?? '',
    year_built_min: box.year_built_min ?? '',
    year_built_max: box.year_built_max ?? '',
    min_hold_yrs: box.min_hold_yrs ?? '',
    zoning_codes: box.zoning_codes || [],
    owner_types: box.owner_types || [],
    absentee_only: box.absentee_only || false,
    out_of_state_only: box.out_of_state_only || false,
    distress_signals: box.distress_signals || [],
    distress_only: box.distress_only || false,
    distress_match_mode: box.distress_match_mode || 'any',
    notes: box.notes || '',
    match_threshold: box.match_threshold ?? 80,
    run_schedule: box.run_schedule || { days: [...ALL_DAYS] },
  };
}

function toggleArr(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export function BuyBoxWizard({ mode = 'create', initialData = null, onSuccess, onCancel }) {
  const { refetch } = useDeals();
  const addToast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => initialData ? toFormState(initialData) : { ...EMPTY_FORM, run_schedule: { days: [...ALL_DAYS] } });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [metroSearch, setMetroSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [coverage, setCoverage] = useState(null);
  const coverageTimer = useRef(null);

  const set = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  // Coverage check — fires on geo changes while on step 4 (Geo)
  useEffect(() => {
    if (step !== 4) return;
    clearTimeout(coverageTimer.current);
    coverageTimer.current = setTimeout(async () => {
      setCoverage('loading');
      try {
        const payload = buildPayload(form);
        const res = await api.post('/api/dealfeed/buy-boxes/preview', payload);
        const count = res.count ?? res.estimated_count ?? 0;
        setCoverage(count >= 500 ? 'strong' : count >= 100 ? 'limited' : 'sparse');
      } catch {
        setCoverage(null);
      }
    }, 600);
    return () => clearTimeout(coverageTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.geoMode, form.geo_states, form.geo_cities, form.geo_zips, form.geo_radius_address, form.geo_radius_miles]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function handleNext() {
    if (!canProceedStep(step, form)) { setTouched(true); return; }
    setTouched(false);
    if (step === 10) { handleSubmit(); return; }
    setStep(s => s + 1);
  }

  function handleBack() {
    setTouched(false);
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = buildPayload(form);
      let box;
      if (mode === 'edit' && initialData?.id) {
        box = await api.patch(`/api/dealfeed/buy-boxes/${initialData.id}`, payload);
      } else {
        box = await api.post('/api/dealfeed/onboarding', payload);
      }
      refetch();
      addToast(
        mode === 'edit' ? 'Buy box updated — takes effect tonight.' : 'Buy box activated — we start tonight.',
        'success'
      );
      onSuccess?.(box);
    } catch (err) {
      addToast(err?.message || 'Save failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step renders ─────────────────────────────────────────────────────────

  function renderStep3() {
    const missing = touched && !form.label.trim();
    const cls = getAssetClass(form.asset_class);
    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Name Your Buy Box</h2>
        {cls && <div className="bbwiz-context-chip">{cls.label}</div>}
        <p className="bbwiz-step-desc">Give this buy box a name that helps you identify it at a glance.</p>
        <div className="bbwiz-field">
          <label className="bbwiz-label">Buy Box Name <span className="bbwiz-req">*</span></label>
          <input
            className={`bbwiz-input${missing ? ' is-error' : ''}`}
            value={form.label}
            onChange={e => set('label', e.target.value.slice(0, 60))}
            placeholder={cls ? `e.g. ${cls.label} — ${form.geo_states?.[0] || 'My Market'}` : 'e.g. Austin Storage Play, DFW Industrial Watch'}
            maxLength={60}
            autoFocus
          />
          {missing && <p className="bbwiz-inline-error">Name is required.</p>}
          <p className="bbwiz-char-count">{form.label.length}/60</p>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const missingGeo = touched && !canProceedStep(4, form);
    const coverageLabel = { strong: 'Strong Coverage', limited: 'Limited Coverage', sparse: 'Sparse Coverage', loading: 'Checking coverage…' };

    function addZip() {
      const val = zipInput.trim().replace(/,/g, '');
      if (val.length >= 3 && !form.geo_zips.includes(val)) {
        set('geo_zips', [...form.geo_zips, val]);
      }
      setZipInput('');
    }

    const filteredMetros = MAJOR_METROS.filter(m =>
      !metroSearch || m.toLowerCase().includes(metroSearch.toLowerCase())
    );

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Geography</h2>
        <p className="bbwiz-step-desc">Define where you want to find deals. Select one geography type.</p>
        <div className="bbwiz-geo-tabs">
          {GEO_TYPES.map(gt => (
            <button
              key={gt.id}
              className={`bbwiz-geo-tab${form.geoMode === gt.id ? ' is-active' : ''}`}
              onClick={() => set('geoMode', gt.id)}
            >{gt.label}</button>
          ))}
        </div>
        {form.geoMode === 'state' && (
          <>
            <input className="bbwiz-input" placeholder="Search states…" value={stateSearch}
              onChange={e => setStateSearch(e.target.value)} style={{ marginBottom: 8 }} />
            <div className="bbwiz-select-list">
              {US_STATES
                .filter(([abbr, name]) => !stateSearch || abbr.toLowerCase().includes(stateSearch.toLowerCase()) || name.toLowerCase().includes(stateSearch.toLowerCase()))
                .map(([abbr, name]) => (
                  <label key={abbr} className={`bbwiz-select-item${form.geo_states.includes(abbr) ? ' is-selected' : ''}`}>
                    <input type="checkbox" checked={form.geo_states.includes(abbr)}
                      onChange={() => set('geo_states', toggleArr(form.geo_states, abbr))} />
                    <span>{abbr} — {name}</span>
                  </label>
                ))}
            </div>
            {form.geo_states.length > 0 && (
              <p className="bbwiz-selection-count">{form.geo_states.length} state{form.geo_states.length > 1 ? 's' : ''} selected</p>
            )}
            {/* TODO: cascading county/city picker */}
          </>
        )}
        {form.geoMode === 'metro' && (
          <>
            <input className="bbwiz-input" placeholder="Search metros…" value={metroSearch}
              onChange={e => setMetroSearch(e.target.value)} style={{ marginBottom: 8 }} />
            <div className="bbwiz-select-list">
              {filteredMetros.map(m => (
                <label key={m} className={`bbwiz-select-item${form.geo_cities.includes(m) ? ' is-selected' : ''}`}>
                  <input type="checkbox" checked={form.geo_cities.includes(m)}
                    onChange={() => set('geo_cities', toggleArr(form.geo_cities, m))} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </>
        )}
        {form.geoMode === 'zip' && (
          <div className="bbwiz-field">
            <div className="bbwiz-chips-wrap">
              {form.geo_zips.map(z => (
                <span key={z} className="bbwiz-chip">
                  {z}
                  <button onClick={() => set('geo_zips', form.geo_zips.filter(x => x !== z))} aria-label={`Remove ${z}`}><I.Close size={12}/></button>
                </span>
              ))}
              <input
                className="bbwiz-chip-input"
                placeholder="Type zip and press Enter or comma"
                value={zipInput}
                onChange={e => setZipInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addZip(); } }}
                onBlur={addZip}
              />
            </div>
          </div>
        )}
        {form.geoMode === 'radius' && (
          <div className="bbwiz-field">
            <label className="bbwiz-label">Address</label>
            <input className="bbwiz-input" placeholder="e.g. 1600 Pennsylvania Ave NW, Washington DC"
              value={form.geo_radius_address}
              onChange={e => set('geo_radius_address', e.target.value)} />
            <label className="bbwiz-label" style={{ marginTop: 16 }}>Radius: <strong>{form.geo_radius_miles} miles</strong></label>
            <input type="range" className="bbwiz-slider" min={5} max={100} step={5}
              value={form.geo_radius_miles}
              onChange={e => set('geo_radius_miles', Number(e.target.value))} />
            <div className="bbwiz-slider-labels"><span>5 mi</span><span>100 mi</span></div>
          </div>
        )}
        {missingGeo && <p className="bbwiz-inline-error" style={{ marginTop: 12 }}>At least one geography selection is required.</p>}
        {coverage && (
          <div className={`bbwiz-coverage ${coverage === 'loading' ? 'loading' : coverage}`} style={{ marginTop: 16 }}>
            {coverage !== 'loading' && (
              <span className="bbwiz-coverage-dot" />
            )}
            <span>{coverageLabel[coverage]}</span>
          </div>
        )}
      </div>
    );
  }

  function renderStep1() {
    const missing = touched && !form.asset_class;
    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Asset Class</h2>
        <p className="bbwiz-step-desc">Select exactly one asset class. Each buy box targets a single property type.</p>
        {missing && <p className="bbwiz-inline-error">Select an asset class to continue.</p>}
        <div className="bbwiz-asset-grid">
          {ASSET_CLASSES.map(cls => (
            <button
              key={cls.id}
              className={`bbwiz-asset-card${form.asset_class === cls.id ? ' is-selected' : ''}`}
              onClick={() => {
                if (form.asset_class !== cls.id) {
                  setForm(f => ({ ...f, asset_class: cls.id, asset_use_codes: [] }));
                }
              }}
            >
              <span className="bbwiz-asset-label">{cls.label}</span>
              <span className="bbwiz-asset-desc">{cls.description}</span>
              {form.asset_class === cls.id && <span className="bbwiz-asset-check"><I.Check size={14}/></span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderStep2() {
    const cls = getAssetClass(form.asset_class);
    if (!cls) return (
      <div className="bbwiz-step-body">
        <p className="bbwiz-step-desc">Go back and select an asset class first.</p>
      </div>
    );
    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Sub-Asset Class</h2>
        <p className="bbwiz-step-desc">
          Select one or more property types within <strong>{cls.label}</strong>.
          <span className="bbwiz-optional"> Optional — skip to include all types.</span>
        </p>
        <div className="bbwiz-subtype-actions">
          <button className="bbwiz-link" onClick={() => set('asset_use_codes', cls.subtypes.map(s => s.code))}>Select all</button>
          <button className="bbwiz-link" onClick={() => set('asset_use_codes', [])}>Clear all</button>
        </div>
        <div className="bbwiz-subtype-grid">
          {cls.subtypes.map(st => {
            const on = form.asset_use_codes.includes(st.code);
            return (
              <button
                key={st.code}
                className={`bbwiz-subtype-card${on ? ' is-selected' : ''}`}
                onClick={() => set('asset_use_codes', toggleArr(form.asset_use_codes, st.code))}
              >
                {on && <span className="bbwiz-subtype-check"><I.Check size={12}/></span>}
                {st.label}
              </button>
            );
          })}
        </div>
        {form.asset_use_codes.length > 0 && (
          <p className="bbwiz-selection-count">{form.asset_use_codes.length} of {cls.subtypes.length} selected</p>
        )}
      </div>
    );
  }

  function renderStep5() {
    const ac = form.asset_class;
    const ZONING = ['AG', 'R1', 'R2', 'C1', 'C2', 'I1', 'MU', 'PD'];

    const sfLabel = ac === 'multifamily' ? 'Unit Count' : ac === 'hospitality' ? 'Room Count' : 'Building Size (SF)';
    const showSf = ['multifamily', 'sfr', 'industrial', 'retail', 'office', 'hospitality', 'special_purpose'].includes(ac);
    const showAcres = ac === 'land';
    const showZoning = ['land', 'multifamily'].includes(ac);

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Property Criteria</h2>
        <p className="bbwiz-step-desc">All fields optional. Leave blank to match any value.</p>
        <div className="bbwiz-criteria-grid">
          {showSf && (
            <div className="bbwiz-range-pair">
              <label className="bbwiz-label">{sfLabel}</label>
              <div className="bbwiz-range-inputs">
                <input className="bbwiz-input" type="number" placeholder="Min" value={form.sf_min}
                  onChange={e => set('sf_min', e.target.value)} />
                <span className="bbwiz-range-sep">–</span>
                <input className="bbwiz-input" type="number" placeholder="Max" value={form.sf_max}
                  onChange={e => set('sf_max', e.target.value)} />
              </div>
            </div>
          )}
          {showAcres && (
            <div className="bbwiz-range-pair">
              <label className="bbwiz-label">Lot Size (Acres)</label>
              <div className="bbwiz-range-inputs">
                <input className="bbwiz-input" type="number" placeholder="Min Acres" value={form.acres_min}
                  onChange={e => set('acres_min', e.target.value)} />
                <span className="bbwiz-range-sep">–</span>
                <input className="bbwiz-input" type="number" placeholder="Max Acres" value={form.acres_max}
                  onChange={e => set('acres_max', e.target.value)} />
              </div>
            </div>
          )}
          <div className="bbwiz-range-pair">
            <label className="bbwiz-label">Estimated Value ($)</label>
            <div className="bbwiz-range-inputs">
              <input className="bbwiz-input" type="number" placeholder="Min $" value={form.value_min}
                onChange={e => set('value_min', e.target.value)} />
              <span className="bbwiz-range-sep">–</span>
              <input className="bbwiz-input" type="number" placeholder="Max $" value={form.value_max}
                onChange={e => set('value_max', e.target.value)} />
            </div>
          </div>
          <div className="bbwiz-range-pair">
            <label className="bbwiz-label">Year Built</label>
            <div className="bbwiz-range-inputs">
              <input className="bbwiz-input" type="number" placeholder="From Year" value={form.year_built_min}
                onChange={e => set('year_built_min', e.target.value)} />
              <span className="bbwiz-range-sep">–</span>
              <input className="bbwiz-input" type="number" placeholder="To Year" value={form.year_built_max}
                onChange={e => set('year_built_max', e.target.value)} />
            </div>
          </div>
          <div className="bbwiz-range-pair">
            <label className="bbwiz-label">Minimum Years of Ownership: <strong>{form.min_hold_yrs || 0}</strong></label>
            <input type="range" className="bbwiz-slider" min={0} max={30} step={1}
              value={form.min_hold_yrs || 0}
              onChange={e => set('min_hold_yrs', Number(e.target.value) || '')} />
            <div className="bbwiz-slider-labels"><span>0 yrs</span><span>30+ yrs</span></div>
          </div>
          {showZoning && (
            <div className="bbwiz-range-pair">
              <label className="bbwiz-label">Zoning Codes</label>
              <div className="bbwiz-subtype-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {ZONING.map(z => {
                  const on = form.zoning_codes.includes(z);
                  return (
                    <button key={z} className={`bbwiz-subtype-card${on ? ' is-selected' : ''}`}
                      onClick={() => set('zoning_codes', toggleArr(form.zoning_codes, z))}>
                      {on && <span className="bbwiz-subtype-check"><I.Check size={12}/></span>}
                      {z}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStep6() {
    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Ownership Profile</h2>
        <p className="bbwiz-step-desc">All optional. Leave blank to target all ownership types.</p>
        <div className="bbwiz-field">
          <label className="bbwiz-label">Ownership Type</label>
          <div className="bbwiz-subtype-actions">
            <button className="bbwiz-link" onClick={() => set('owner_types', OWNER_TYPE_OPTIONS.map(o => o.value))}>Select all</button>
            <button className="bbwiz-link" onClick={() => set('owner_types', [])}>Clear all</button>
          </div>
          <div className="bbwiz-subtype-grid">
            {OWNER_TYPE_OPTIONS.map(ot => {
              const on = form.owner_types.includes(ot.value);
              return (
                <button
                  key={ot.value}
                  className={`bbwiz-subtype-card${on ? ' is-selected' : ''}`}
                  onClick={() => set('owner_types', toggleArr(form.owner_types, ot.value))}
                >
                  {on && <span className="bbwiz-subtype-check"><I.Check size={12}/></span>}
                  {ot.label}
                </button>
              );
            })}
          </div>
        </div>
        {[
          { key: 'absentee_only', label: 'Absentee owner only', desc: 'Owner mailing address does not match property address' },
          { key: 'out_of_state_only', label: 'Out-of-state owner only', desc: 'Owner is registered in a different state than the property' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="bbwiz-toggle-row">
            <div className="bbwiz-toggle-info">
              <span className="bbwiz-toggle-label">{label}</span>
              <span className="bbwiz-toggle-desc">{desc}</span>
            </div>
            <button
              className={`bbwiz-toggle${form[key] ? ' is-on' : ''}`}
              role="switch"
              aria-checked={form[key]}
              onClick={() => set(key, !form[key])}
            >
              <span className="bbwiz-toggle-thumb" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderStep7() {
    const SIGNAL_TOOLTIPS = {
      'active-foreclosure': 'Property has a recorded notice of default or foreclosure filing.',
      'tax-delinquent': 'Owner owes back property taxes.',
      'absentee-owner': "Owner's mailing address differs from the property address.",
      'long-term-hold': 'Property has been owned 10+ years with no refinance.',
      'quit-claim-deed': 'Property was transferred via quit claim, often a distress indicator.',
      'non-arms-length': 'Last sale was between related parties, often below market.',
      'investor-buyer': 'Last buyer was an investor entity, not owner-occupant.',
      'arm-mortgage': 'Owner has an adjustable-rate mortgage — rate resets may cause stress.',
      'high-ltv': 'Owner is highly leveraged relative to property value.',
      'free-and-clear': 'No recorded mortgage — owner has equity to negotiate with.',
    };

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Distress Signals</h2>
        <p className="bbwiz-step-desc">All optional. Select signals to filter for motivated sellers.</p>
        <div className="bbwiz-subtype-actions">
          <button className="bbwiz-link" onClick={() => set('distress_signals', DISTRESS_SIGNAL_OPTIONS.map(s => s.value))}>Select all</button>
          <button className="bbwiz-link" onClick={() => set('distress_signals', [])}>Clear all</button>
        </div>
        <div className="bbwiz-subtype-grid">
          {DISTRESS_SIGNAL_OPTIONS.map(sig => {
            const on = form.distress_signals.includes(sig.value);
            return (
              <button
                key={sig.value}
                className={`bbwiz-subtype-card${on ? ' is-selected' : ''}`}
                title={SIGNAL_TOOLTIPS[sig.value]}
                onClick={() => set('distress_signals', toggleArr(form.distress_signals, sig.value))}
              >
                {on && <span className="bbwiz-subtype-check"><I.Check size={12}/></span>}
                {sig.label}
              </button>
            );
          })}
        </div>
        {form.distress_signals.length > 0 && (
          <p className="bbwiz-selection-count">{form.distress_signals.length} signal{form.distress_signals.length > 1 ? 's' : ''} selected</p>
        )}
        {form.distress_signals.length > 1 && (
          <div className="bbwiz-field" style={{ marginTop: 16 }}>
            <label className="bbwiz-label">Match mode</label>
            <div className="bbwiz-segmented">
              {[{ value: 'any', label: 'Match ANY' }, { value: 'all', label: 'Match ALL' }].map(opt => (
                <button
                  key={opt.value}
                  className={`bbwiz-segmented-btn${form.distress_match_mode === opt.value ? ' is-active' : ''}`}
                  onClick={() => set('distress_match_mode', opt.value)}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}
        <div className="bbwiz-toggle-row" style={{ marginTop: 20 }}>
          <div className="bbwiz-toggle-info">
            <span className="bbwiz-toggle-label">Distress signals required</span>
            <span className="bbwiz-toggle-desc">Only deliver deals that match at least one selected signal</span>
          </div>
          <button
            className={`bbwiz-toggle${form.distress_only ? ' is-on' : ''}`}
            role="switch"
            aria-checked={form.distress_only}
            onClick={() => set('distress_only', !form.distress_only)}
          >
            <span className="bbwiz-toggle-thumb" />
          </button>
        </div>
        <div className="bbwiz-field" style={{ marginTop: 16 }}>
          <label className="bbwiz-label">Notes <span className="bbwiz-muted">(optional)</span></label>
          <textarea className="bbwiz-textarea" rows={3} maxLength={200}
            placeholder="Any additional context about what you're targeting…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)} />
          <p className="bbwiz-char-count">{form.notes.length}/200</p>
        </div>
      </div>
    );
  }

  function renderStep8() {
    const t = form.match_threshold;
    const thresholdDesc =
      t <= 65 ? "You'll see every deal that matches at least 6 of 10 criteria. Expect a high-volume feed with some misses." :
      t <= 75 ? "A broad feed with reasonable accuracy. Good for markets with limited inventory." :
      t === 80 ? "Balanced. You'll see most relevant deals without significant noise." :
      t <= 90 ? "A tighter, curated feed. Fewer deals, but they'll fit your criteria more closely." :
                "Only near-perfect matches. Expect very few deals — best for highly specific searches.";

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Match Precision</h2>
        <p className="bbwiz-step-desc">Control the tradeoff between deal volume and match accuracy.</p>
        <div className="bbwiz-field" style={{ marginTop: 24 }}>
          <div className="bbwiz-slider-anchors">
            <span>More Deals</span>
            <span className="bbwiz-threshold-val">{form.match_threshold}%</span>
            <span>Fewer, Better Deals</span>
          </div>
          <input type="range" className="bbwiz-slider bbwiz-threshold-slider"
            min={60} max={100} step={5}
            value={form.match_threshold}
            onChange={e => set('match_threshold', Number(e.target.value))} />
          <div className="bbwiz-slider-labels"><span>60%</span><span>100%</span></div>
          <div className="bbwiz-threshold-desc">{thresholdDesc}</div>
        </div>
      </div>
    );
  }

  function renderStep9() {
    const selectedDays = form.run_schedule?.days || [];
    const allSelected = selectedDays.length === ALL_DAYS.length;

    const DAY_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

    function scheduleSummary() {
      if (selectedDays.length === 0) return null;
      if (allSelected) return 'Runs daily';
      const names = SCHEDULE_DAYS.filter(d => selectedDays.includes(d.abbr)).map(d => d.label);
      return `Runs ${names.join(' / ')}`;
    }

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Run Schedule</h2>
        <p className="bbwiz-step-desc">Choose which days the nightly deal runner should process this buy box. Runs nightly between 1am–4am CT.</p>
        <div className="bbwiz-subtype-actions">
          <button className="bbwiz-link" onClick={() => set('run_schedule', { days: [...ALL_DAYS] })}>Run daily (all 7 days)</button>
          <button className="bbwiz-link" onClick={() => set('run_schedule', { days: [] })}>Clear all</button>
        </div>
        <div className="bbwiz-subtype-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {SCHEDULE_DAYS.map(d => {
            const on = selectedDays.includes(d.abbr);
            return (
              <button
                key={d.abbr}
                className={`bbwiz-subtype-card${on ? ' is-selected' : ''}`}
                title={DAY_FULL[d.abbr]}
                onClick={() => {
                  const days = on
                    ? selectedDays.filter(x => x !== d.abbr)
                    : [...selectedDays, d.abbr];
                  set('run_schedule', { days });
                }}
              >
                {on && <span className="bbwiz-subtype-check"><I.Check size={12}/></span>}
                {d.label}
              </button>
            );
          })}
        </div>
        {selectedDays.length === 0 && (
          <p className="bbwiz-inline-hint" style={{ marginTop: 12 }}>Select at least one day to receive deals.</p>
        )}
        {selectedDays.length > 0 && (
          <p className="bbwiz-selection-count" style={{ marginTop: 8 }}>{scheduleSummary()}</p>
        )}
      </div>
    );
  }

  function renderStep10() {
    const cls = getAssetClass(form.asset_class);
    const canSubmitReview = [1,3,4].every(s => canProceedStep(s, form));

    const sections = [
      { step: 1, label: 'Asset Class', value: cls?.label || <em className="bbwiz-missing">Not set</em> },
      { step: 2, label: 'Sub-Types', value: cls ? (formatUseCodes(form.asset_class, form.asset_use_codes) || 'All types') : <em className="bbwiz-missing">—</em> },
      { step: 3, label: 'Name', value: form.label || <em className="bbwiz-missing">Not set</em> },
      { step: 4, label: 'Geography', value: formatGeo(form) },
      { step: 5, label: 'Property Criteria', value: [
          form.sf_min || form.sf_max ? `SF: ${form.sf_min || '—'} – ${form.sf_max || '—'}` : null,
          form.acres_min || form.acres_max ? `Acres: ${form.acres_min || '—'} – ${form.acres_max || '—'}` : null,
          form.value_min || form.value_max ? `Value: $${form.value_min || '—'} – $${form.value_max || '—'}` : null,
          form.year_built_min || form.year_built_max ? `Built: ${form.year_built_min || '—'} – ${form.year_built_max || '—'}` : null,
          form.min_hold_yrs ? `Min hold: ${form.min_hold_yrs} yrs` : null,
        ].filter(Boolean).join(' · ') || 'No criteria set' },
      { step: 6, label: 'Ownership', value: [
          form.owner_types.length ? form.owner_types.join(', ') : null,
          form.absentee_only ? 'Absentee only' : null,
          form.out_of_state_only ? 'Out-of-state only' : null,
        ].filter(Boolean).join(' · ') || 'All ownership types' },
      { step: 7, label: 'Distress Signals', value: form.distress_signals.length
          ? `${form.distress_signals.length} signal${form.distress_signals.length > 1 ? 's' : ''} (match ${form.distress_match_mode.toUpperCase()})`
          : 'None' },
      { step: 8, label: 'Match Threshold', value: (() => {
          const t = form.match_threshold;
          const label = t <= 65 ? 'High Volume' : t <= 75 ? 'Broad' : t === 80 ? 'Balanced' : t <= 90 ? 'Curated' : 'Precise';
          return `${t}% — ${label}`;
        })() },
      { step: 9, label: 'Schedule', value: formatSchedule(form.run_schedule) },
    ];

    return (
      <div className="bbwiz-step-body">
        <h2 className="bbwiz-step-title">Review and Confirm</h2>
        <p className="bbwiz-step-desc">Review your buy box configuration before activating.</p>
        <div className="bbwiz-review-cards">
          {sections.map(({ step: s, label, value }) => {
            const isRequired = [1, 3, 4].includes(s);
            const isEmpty = isRequired && !canProceedStep(s, form);
            return (
              <div key={s} className={`bbwiz-review-card${isEmpty ? ' is-incomplete' : ''}`}>
                <div className="bbwiz-review-card-header">
                  <span className="bbwiz-review-card-label">{label}</span>
                  <button className="bbwiz-review-edit" onClick={() => { setTouched(false); setStep(s); }}>
                    Edit <I.Edit size={12}/>
                  </button>
                </div>
                <div className="bbwiz-review-card-value">{value}</div>
                {isEmpty && <p className="bbwiz-inline-error">Required — please complete this step.</p>}
              </div>
            );
          })}
        </div>
        {!canSubmitReview && (
          <p className="bbwiz-inline-error" style={{ marginTop: 16 }}>
            Complete all required fields before submitting.
          </p>
        )}
      </div>
    );
  }

  const stepRenderers = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8, renderStep9, renderStep10];

  const canSubmit = step === 10 && [1,3,4].every(s => canProceedStep(s, form));

  return (
    <div className="bbwiz" role="dialog" aria-label="Buy Box Wizard">
      <aside className="bbwiz-sidebar">
        <div className="bbwiz-sidebar-logo">
          <I.Boxes size={20}/>
          <span>{mode === 'edit' ? 'Edit Buy Box' : 'New Buy Box'}</span>
        </div>
        <ol className="bbwiz-step-list">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const isDone = n < step;
            const isActive = n === step;
            return (
              <li key={n} className={`bbwiz-step-item${isDone ? ' is-done' : ''}${isActive ? ' is-active' : ''}`}>
                <span className="bbwiz-step-num">
                  {isDone ? <I.Check size={12}/> : n}
                </span>
                <span className="bbwiz-step-label">{label}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="bbwiz-main">
        <div className="bbwiz-content">
          {stepRenderers[step]?.()}
        </div>
        <footer className="bbwiz-footer">
          <button className="bbwiz-btn-ghost" onClick={step === 1 ? onCancel : handleBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            className="bbwiz-btn-primary"
            onClick={handleNext}
            disabled={submitting || (step === 10 && !canSubmit)}
          >
            {submitting ? 'Saving…' : step === 10
              ? (mode === 'edit' ? 'Save Changes — Takes Effect Tonight' : 'Activate Buy Box — We Start Tonight')
              : 'Continue'}
          </button>
        </footer>
      </main>
    </div>
  );
}
