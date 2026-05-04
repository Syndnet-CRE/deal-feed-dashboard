import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useDeals } from '../contexts/DealsContext';
import { I } from './Icons';
import { buildPayload, activeGeoHasData } from '../lib/wizardHelpers';

const ROLES = ['Investor/Buyer', 'Broker/Agent', 'Developer', 'Asset Manager', 'Lender', 'Consultant/Advisor', 'Other'];

const ASSET_CLASS_OPTS = [
  { value: 'Multifamily',     icon: '🏢' },
  { value: 'Office',          icon: '🏛️' },
  { value: 'Retail',          icon: '🏪' },
  { value: 'Industrial',      icon: '🏭' },
  { value: 'Land',            icon: '🌾' },
  { value: 'Hospitality',     icon: '🏨' },
  { value: 'Special Purpose', icon: '⚙️' },
  { value: 'Healthcare',      icon: '🏥' },
];

const OWNER_TYPES = ['Individual', 'LLC or Entity', 'Trust', 'Corporate'];

const DISTRESS_OPTS = [
  { id: 'long_hold',       label: 'Long-Term Hold With No Improvements', desc: 'Owner held 10+ years with no permit activity.' },
  { id: 'tax_delinquency', label: 'Tax Delinquency',                     desc: 'Property has outstanding tax liens or documented delinquency.' },
  { id: 'no_permits',      label: 'No Permits Filed in 5+ Years',        desc: 'No building or renovation permits pulled in over five years.' },
  { id: 'absentee',        label: 'Absentee Ownership',                  desc: 'Owner mailing address does not match the property address.' },
  { id: 'inactive_entity', label: 'Inactive or Dissolved Entity',        desc: 'Owning entity shows as inactive, dissolved, or in default.' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY',
];

const GEO_MODES = [
  { id: 'state',  label: 'States' },
  { id: 'metro',  label: 'Metro Areas' },
  { id: 'zip',    label: 'Zip Codes' },
  { id: 'radius', label: 'Radius' },
];

function detectGeoMode(d) {
  if (d?.geo_states?.length)  return 'state';
  if (d?.geo_cities?.length)  return 'metro';
  if (d?.geo_zips?.length)    return 'zip';
  if (d?.geo_radius_address)  return 'radius';
  return 'state';
}

function mkInitialForm(subscriber, initialData) {
  const base = {
    first_name: subscriber?.first_name || '',
    last_name:  subscriber?.last_name  || '',
    company:    subscriber?.company    || '',
    phone:      subscriber?.phone      || '',
    role:       subscriber?.role       || '',
    label: '',
    asset_classes: [],
    geoMode: 'state',
    geo_states: [],
    geo_cities: [],
    geo_zips: [],
    geo_radius_address: '',
    geo_radius_miles: 25,
    acres_min: '', acres_max: '',
    value_min: '', value_max: '',
    year_built_min: '', year_built_max: '',
    min_hold_yrs: '',
    owner_types: [],
    absentee_only: false,
    out_of_state_only: false,
    distress_signals: [],
    distress_only: false,
    notes: '',
    zoning_codes: [],
  };

  if (!initialData) return base;

  return {
    ...base,
    label: initialData.label || '',
    asset_classes: initialData.asset_classes || [],
    geoMode: detectGeoMode(initialData),
    geo_states: initialData.geo_states || [],
    geo_cities: initialData.geo_cities || [],
    geo_zips: initialData.geo_zips || [],
    geo_radius_address: initialData.geo_radius_address || '',
    geo_radius_miles: initialData.geo_radius_miles ?? 25,
    acres_min: initialData.acres_min ?? '',
    acres_max: initialData.acres_max ?? '',
    value_min: initialData.value_min ?? '',
    value_max: initialData.value_max ?? '',
    year_built_min: initialData.year_built_min ?? '',
    year_built_max: initialData.year_built_max ?? '',
    min_hold_yrs: initialData.min_hold_yrs ?? '',
    owner_types: initialData.owner_types || [],
    absentee_only: initialData.absentee_only || false,
    out_of_state_only: initialData.out_of_state_only || false,
    distress_signals: initialData.distress_signals || [],
    distress_only: initialData.distress_only || false,
    notes: initialData.notes || '',
    zoning_codes: initialData.zoning_codes || [],
  };
}

function autoLabel(form) {
  const ac = form.asset_classes[0] || 'Mixed Use';
  let geo = '';
  if      (form.geoMode === 'state'  && form.geo_states.length)       geo = form.geo_states.slice(0, 3).join(', ');
  else if (form.geoMode === 'metro'  && form.geo_cities.length)        geo = form.geo_cities[0];
  else if (form.geoMode === 'zip'    && form.geo_zips.length)          geo = form.geo_zips[0] + (form.geo_zips.length > 1 ? ` +${form.geo_zips.length - 1}` : '');
  else if (form.geoMode === 'radius' && form.geo_radius_address)       geo = `${form.geo_radius_miles}mi radius`;
  return geo ? `${ac} — ${geo}` : ac;
}

function geoSummary(form) {
  if (form.geoMode === 'state'  && form.geo_states.length)  return form.geo_states.join(', ');
  if (form.geoMode === 'metro'  && form.geo_cities.length)  return form.geo_cities.join(', ');
  if (form.geoMode === 'zip'    && form.geo_zips.length)    return `${form.geo_zips.length} zip code${form.geo_zips.length > 1 ? 's' : ''}`;
  if (form.geoMode === 'radius' && form.geo_radius_address) return `${form.geo_radius_miles}mi — ${form.geo_radius_address}`;
  return null;
}

function sectionsFilled(form) {
  let n = 0;
  if (form.first_name || form.last_name || form.company || form.phone || form.role) n++;
  if (form.label.trim()) n++;
  if (form.asset_classes.length) n++;
  if (activeGeoHasData(form)) n++;
  if (form.acres_min || form.acres_max || form.value_min || form.value_max ||
      form.year_built_min || form.year_built_max || form.min_hold_yrs) n++;
  if (form.owner_types.length || form.absentee_only || form.out_of_state_only) n++;
  if (form.distress_signals.length) n++;
  return n;
}

function toggleArr(arr, val) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export function ConfigurationOverlay({ onClose, mode = 'create', initialData = null }) {
  const { subscriber } = useAuth();
  const { refetch }    = useDeals();
  const isEdit         = mode === 'edit';

  const [form, setForm]               = useState(() => mkInitialForm(subscriber, initialData));
  const [pendingMode, setPending]     = useState(null);
  const [statesOpen, setStatesOpen]   = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [assetOpen, setAssetOpen]     = useState(false);
  const [zipInput, setZipInput]       = useState('');
  const [metroInput, setMetroInput]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const [previewCount, setPreviewCount]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const assetWrapRef  = useRef(null);
  const statesWrapRef = useRef(null);
  const previewTimer  = useRef(null);

  useEffect(() => {
    if (!assetOpen && !statesOpen) return;
    function onDown(e) {
      if (assetOpen  && assetWrapRef.current  && !assetWrapRef.current.contains(e.target))  setAssetOpen(false);
      if (statesOpen && statesWrapRef.current && !statesWrapRef.current.contains(e.target)) setStatesOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [assetOpen, statesOpen]);

  const previewAssetKey  = form.asset_classes.join(',');
  const previewStatesKey = form.geo_states.join(',');
  const previewCitiesKey = form.geo_cities.join(',');
  const previewZipsKey   = form.geo_zips.join(',');

  useEffect(() => {
    let isMounted = true;
    const hasReqs = previewAssetKey.length > 0 && activeGeoHasData(form);
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      if (!hasReqs) { if (isMounted) setPreviewCount(null); return; }
      if (isMounted) setPreviewLoading(true);
      try {
        const label = form.label.trim() || autoLabel(form);
        const payload = buildPayload({ ...form, label });
        const res = await api.post('/api/dealfeed/buy-boxes/preview', payload);
        if (isMounted) setPreviewCount(res.count ?? res.cnt ?? 0);
      } catch {
        if (isMounted) setPreviewCount(null);
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    }, 400);
    return () => { isMounted = false; clearTimeout(previewTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewAssetKey, form.geoMode, previewStatesKey, previewCitiesKey, previewZipsKey, form.geo_radius_address, form.geo_radius_miles]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const infoFilled = (form.first_name || form.last_name || form.company || form.phone || form.role) ? 1 : 0;
  const filledSections = isEdit ? sectionsFilled(form) - infoFilled : sectionsFilled(form);
  const pct = Math.min(100, Math.round((filledSections / (isEdit ? 6 : 7)) * 100));

  function requestModeSwitch(mode) {
    if (mode === form.geoMode) return;
    if (activeGeoHasData(form)) { setPending(mode); }
    else { set('geoMode', mode); }
  }

  function confirmModeSwitch() {
    setForm(f => ({
      ...f,
      geoMode: pendingMode,
      geo_states: [], geo_cities: [], geo_zips: [],
      geo_radius_address: '', geo_radius_miles: 25,
    }));
    setPending(null);
  }

  async function handleActivate() {
    if (!form.asset_classes.length) { setError('Select at least one asset class to continue.'); return; }
    if (!activeGeoHasData(form))    { setError('Define at least one geography to continue.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const label   = form.label.trim() || autoLabel(form);
      const payload = buildPayload({ ...form, label });

      if (isEdit) {
        if (!initialData?.id) { setError('Invalid buy box. Please close and try again.'); return; }
        await api.patch(`/api/dealfeed/buy-boxes/${initialData.id}`, payload);
      } else {
        const calls = [api.post('/api/dealfeed/onboarding', payload)];
        const info  = {};
        if (form.first_name) info.first_name = form.first_name.trim();
        if (form.last_name)  info.last_name  = form.last_name.trim();
        if (form.company)    info.company    = form.company.trim();
        if (form.phone)      info.phone      = form.phone.trim();
        if (form.role)       info.role       = form.role;
        if (Object.keys(info).length) calls.push(api.patch('/api/dealfeed/auth/me', info).catch(() => {}));
        await Promise.all(calls);
      }

      refetch();
      setSuccess(true);
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err?.message || (isEdit ? 'Save failed. Please try again.' : 'Activation failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  const filteredStates = US_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  function handleZipKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && zipInput.trim()) {
      e.preventDefault();
      const z = zipInput.trim().replace(/,/g, '');
      if (/^\d{5}$/.test(z) && !form.geo_zips.includes(z)) {
        set('geo_zips', [...form.geo_zips, z]);
      }
      setZipInput('');
    }
  }

  if (success) {
    return (
      <div className="co-overlay">
        <div className="co-success">
          <div className="co-success-icon">&#10003;</div>
          <h3>{isEdit ? 'Buy Box Updated' : 'Buy Box Activated'}</h3>
          <p>{isEdit
            ? 'Your changes have been saved. The next nightly run will use your updated criteria.'
            : "Your buy box is live. We're scanning now and you'll receive your first deal report tomorrow morning."
          }</p>
        </div>
      </div>
    );
  }

  return (
    <div className="co-overlay" onClick={onClose}>
      <div className="co-shell" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="co-header">
          <div className="co-header-left">
            <span className="co-brand">Parcyl</span>
            <span className="co-badge">BUY BOX</span>
          </div>
          <div className="co-header-center">
            <div className="co-progress-track">
              <div className="co-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="co-progress-label">{pct}% configured</span>
          </div>
          <button className="co-close" onClick={onClose} aria-label="Close"><I.Close size={18} /></button>
        </div>

        {/* Body */}
        <div className="co-body">

          {/* Your Info — create mode only */}
          {!isEdit && (
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.User size={18} /></span>
              <div>
                <h3>Your Info</h3>
                <p>Help us personalize your experience. All fields are optional.</p>
              </div>
            </div>
            <div className="co-grid-2">
              <label className="co-field">
                <span>First Name</span>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Alex" />
              </label>
              <label className="co-field">
                <span>Last Name</span>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Morgan" />
              </label>
              <label className="co-field">
                <span>Company</span>
                <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Capital" />
              </label>
              <label className="co-field">
                <span>Phone</span>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(512) 555-0100" type="tel" />
              </label>
            </div>
            <div className="co-field" style={{ marginTop: 12 }}>
              <span>Role</span>
              <div className="co-pills">
                {ROLES.map(r => (
                  <button
                    key={r}
                    className={`co-pill${form.role === r ? ' co-pill--on' : ''}`}
                    onClick={() => set('role', form.role === r ? '' : r)}
                    type="button"
                  >{r}</button>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Buy Box Name */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Tag size={18} /></span>
              <div>
                <h3>Buy Box Name</h3>
                <p>Optional. We'll generate a name from your selections if left blank.</p>
              </div>
            </div>
            <label className="co-field">
              <span>Name</span>
              <input
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="e.g. Value-Add MF — Sun Belt"
                maxLength={120}
              />
            </label>
          </div>

          {/* Asset Class */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Building size={18} /></span>
              <div>
                <h3>Asset Class</h3>
                <p>Which property types should match your buy box? Select all that apply.</p>
              </div>
            </div>
            <div ref={assetWrapRef} style={{ position: 'relative' }}>
              <button
                className="co-dropdown-btn"
                onClick={() => setAssetOpen(o => !o)}
                type="button"
              >
                {form.asset_classes.length
                  ? `${form.asset_classes.length} selected`
                  : 'Select asset classes'}
                <span className="co-caret"><I.ChevronDown size={16} /></span>
              </button>
              {assetOpen && (
                <div className="co-dropdown-panel">
                  {ASSET_CLASS_OPTS.map(({ value, icon }) => (
                    <div
                      key={value}
                      className={`co-check-row${form.asset_classes.includes(value) ? ' co-check-row--selected' : ''}`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => set('asset_classes', toggleArr(form.asset_classes, value))}
                    >
                      <span className={`co-checkbox${form.asset_classes.includes(value) ? ' co-checkbox--on' : ''}`} />
                      <span className="co-check-icon">{icon}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div className="co-dropdown-done">
                    <button
                      type="button"
                      className="co-dropdown-done-btn"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setAssetOpen(false)}
                    >Done</button>
                  </div>
                </div>
              )}
            </div>
            {form.asset_classes.length > 0 && (
              <div className="co-chips">
                {form.asset_classes.map(ac => (
                  <span key={ac} className="co-chip">
                    {ac}
                    <button onClick={() => set('asset_classes', form.asset_classes.filter(x => x !== ac))} type="button">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Geography */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Pin size={18} /></span>
              <div>
                <h3>Geography</h3>
                <p>Define the market you want to target. Pick one mode.</p>
              </div>
            </div>

            <div className="co-geo-tabs">
              {GEO_MODES.map(({ id, label }) => (
                <button
                  key={id}
                  className={`co-geo-tab${form.geoMode === id ? ' co-geo-tab--on' : ''}`}
                  onClick={() => requestModeSwitch(id)}
                  type="button"
                >{label}</button>
              ))}
            </div>

            {pendingMode && (
              <div className="co-geo-warn">
                <span>Switching to <strong>{GEO_MODES.find(m => m.id === pendingMode)?.label}</strong> will clear your current geography. Continue?</span>
                <div className="co-geo-warn-actions">
                  <button className="co-geo-warn-confirm" onClick={confirmModeSwitch} type="button">Yes, switch</button>
                  <button className="co-geo-warn-cancel"  onClick={() => setPending(null)} type="button">Cancel</button>
                </div>
              </div>
            )}

            {form.geoMode === 'state' && (
              <div ref={statesWrapRef} style={{ position: 'relative' }}>
                <button className="co-dropdown-btn" onClick={() => setStatesOpen(o => !o)} type="button">
                  {form.geo_states.length
                    ? `${form.geo_states.length} state${form.geo_states.length > 1 ? 's' : ''} selected`
                    : 'Select states'}
                  <span className="co-caret"><I.ChevronDown size={16} /></span>
                </button>
                {statesOpen && (
                  <div className="co-dropdown-panel co-states-panel">
                    <input
                      className="co-states-search"
                      placeholder="Filter states..."
                      value={stateSearch}
                      onChange={e => setStateSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="co-states-grid">
                      {filteredStates.map(s => (
                        <div
                          key={s}
                          className={`co-check-row co-check-row--sm${form.geo_states.includes(s) ? ' co-check-row--selected' : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => set('geo_states', toggleArr(form.geo_states, s))}
                        >
                          <span className={`co-checkbox${form.geo_states.includes(s) ? ' co-checkbox--on' : ''}`} />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="co-dropdown-done">
                      <button
                        type="button"
                        className="co-dropdown-done-btn"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setStatesOpen(false); setStateSearch(''); }}
                      >Done</button>
                    </div>
                  </div>
                )}
                {form.geo_states.length > 0 && (
                  <div className="co-chips">
                    {form.geo_states.map(s => (
                      <span key={s} className="co-chip">
                        {s}
                        <button onClick={() => set('geo_states', form.geo_states.filter(x => x !== s))} type="button">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.geoMode === 'metro' && (
              <div>
                <input
                  className="co-text-input"
                  placeholder="Type a metro area and press Enter..."
                  value={metroInput}
                  onChange={e => setMetroInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && metroInput.trim()) {
                      e.preventDefault();
                      const m = metroInput.trim();
                      if (!form.geo_cities.includes(m)) set('geo_cities', [...form.geo_cities, m]);
                      setMetroInput('');
                    }
                  }}
                />
                {form.geo_cities.length > 0 && (
                  <div className="co-chips">
                    {form.geo_cities.map(c => (
                      <span key={c} className="co-chip">
                        {c}
                        <button onClick={() => set('geo_cities', form.geo_cities.filter(x => x !== c))} type="button">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.geoMode === 'zip' && (
              <div>
                <input
                  className="co-text-input"
                  placeholder="Type a 5-digit zip and press Enter..."
                  value={zipInput}
                  onChange={e => setZipInput(e.target.value)}
                  onKeyDown={handleZipKey}
                  maxLength={5}
                  inputMode="numeric"
                />
                {form.geo_zips.length > 0 && (
                  <div className="co-chips">
                    {form.geo_zips.map(z => (
                      <span key={z} className="co-chip">
                        {z}
                        <button onClick={() => set('geo_zips', form.geo_zips.filter(x => x !== z))} type="button">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.geoMode === 'radius' && (
              <div className="co-radius-row">
                <label className="co-field co-field--grow">
                  <span>Address or city</span>
                  <input
                    value={form.geo_radius_address}
                    onChange={e => set('geo_radius_address', e.target.value)}
                    placeholder="123 Main St, Austin TX"
                  />
                </label>
                <label className="co-field co-field--fixed">
                  <span>Radius &mdash; {form.geo_radius_miles} miles</span>
                  <input
                    type="range"
                    min={1}
                    max={75}
                    value={form.geo_radius_miles}
                    onChange={e => set('geo_radius_miles', Number(e.target.value))}
                    className="co-slider"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Property Criteria */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Sliders size={18} /></span>
              <div>
                <h3>Property Criteria</h3>
                <p>Filter by size, value, age, and hold period. All ranges are optional.</p>
              </div>
            </div>
            <div className="co-criteria-grid">
              <div className="co-range-row">
                <span className="co-range-label">Lot Size</span>
                <input className="co-range-input" placeholder="Min" value={form.acres_min} onChange={e => set('acres_min', e.target.value)} type="number" min="0" />
                <span className="co-range-sep">to</span>
                <input className="co-range-input" placeholder="Max" value={form.acres_max} onChange={e => set('acres_max', e.target.value)} type="number" min="0" />
                <span className="co-range-unit">acres</span>
              </div>
              <div className="co-range-row">
                <span className="co-range-label">Assessed Value</span>
                <input className="co-range-input" placeholder="Min" value={form.value_min} onChange={e => set('value_min', e.target.value)} type="number" min="0" />
                <span className="co-range-sep">to</span>
                <input className="co-range-input" placeholder="Max" value={form.value_max} onChange={e => set('value_max', e.target.value)} type="number" min="0" />
                <span className="co-range-unit">$</span>
              </div>
              <div className="co-range-row">
                <span className="co-range-label">Year Built</span>
                <input className="co-range-input" placeholder="e.g. 1980" value={form.year_built_min} onChange={e => set('year_built_min', e.target.value)} type="number" min="1800" max="2099" />
                <span className="co-range-sep">to</span>
                <input className="co-range-input" placeholder="e.g. 2010" value={form.year_built_max} onChange={e => set('year_built_max', e.target.value)} type="number" min="1800" max="2099" />
              </div>
              <div className="co-range-row">
                <span className="co-range-label">Min Hold Period</span>
                <input className="co-range-input" placeholder="e.g. 5" value={form.min_hold_yrs} onChange={e => set('min_hold_yrs', e.target.value)} type="number" min="0" />
                <span className="co-range-unit">years</span>
              </div>
            </div>
          </div>

          {/* Ownership Profile */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Users size={18} /></span>
              <div>
                <h3>Ownership Profile</h3>
                <p>Target specific ownership structures or absentee situations.</p>
              </div>
            </div>
            <div className="co-card-grid">
              {OWNER_TYPES.map(ot => (
                <button
                  key={ot}
                  className={`co-card-opt${form.owner_types.includes(ot) ? ' co-card-opt--on' : ''}`}
                  onClick={() => set('owner_types', toggleArr(form.owner_types, ot))}
                  type="button"
                >{ot}</button>
              ))}
            </div>
            <div className="co-toggles">
              <div className="co-toggle-row">
                <div>
                  <span className="co-toggle-label">Absentee Owner Only</span>
                  <span className="co-toggle-sub">Owner's mailing address differs from the property address</span>
                </div>
                <button
                  className={`co-toggle${form.absentee_only ? ' co-toggle--on' : ''}`}
                  onClick={() => set('absentee_only', !form.absentee_only)}
                  type="button"
                  role="switch"
                  aria-checked={form.absentee_only}
                />
              </div>
              <div className="co-toggle-row">
                <div>
                  <span className="co-toggle-label">Out-of-State Owner Only</span>
                  <span className="co-toggle-sub">Owner mails from outside the property's state</span>
                </div>
                <button
                  className={`co-toggle${form.out_of_state_only ? ' co-toggle--on' : ''}`}
                  onClick={() => set('out_of_state_only', !form.out_of_state_only)}
                  type="button"
                  role="switch"
                  aria-checked={form.out_of_state_only}
                />
              </div>
            </div>
          </div>

          {/* Distress Signals */}
          <div className="co-section">
            <div className="co-section-head">
              <span className="co-section-icon"><I.Alert size={18} /></span>
              <div>
                <h3>Distress Signals</h3>
                <p>Match only properties that show specific indicators of motivated ownership.</p>
              </div>
            </div>
            <div className="co-distress-grid">
              {DISTRESS_OPTS.map(({ id, label, desc }) => (
                <button
                  key={id}
                  className={`co-distress-card${form.distress_signals.includes(id) ? ' co-distress-card--on' : ''}`}
                  onClick={() => set('distress_signals', toggleArr(form.distress_signals, id))}
                  type="button"
                >
                  <span className="co-distress-label">{label}</span>
                  <span className="co-distress-desc">{desc}</span>
                </button>
              ))}
            </div>
            <div className="co-field" style={{ marginTop: 16 }}>
              <span>Notes <span className="co-char-count">{form.notes.length}/200</span></span>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value.slice(0, 200))}
                placeholder="Any additional distress context or requirements..."
                rows={3}
                className="co-textarea"
              />
            </div>
            <div className="co-toggles" style={{ marginTop: 12 }}>
              <div className="co-toggle-row">
                <div>
                  <span className="co-toggle-label">Distress Required</span>
                  <span className="co-toggle-sub">Only surface deals matching at least one selected signal</span>
                </div>
                <button
                  className={`co-toggle${form.distress_only ? ' co-toggle--on' : ''}`}
                  onClick={() => set('distress_only', !form.distress_only)}
                  type="button"
                  role="switch"
                  aria-checked={form.distress_only}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 120 }} />
        </div>

        {/* Sticky Review Bar */}
        <div className="co-review">
          <div className="co-review-summary">
            {form.asset_classes.length > 0 && (
              <span className="co-review-chip">{form.asset_classes.join(', ')}</span>
            )}
            {geoSummary(form) && (
              <span className="co-review-chip">{geoSummary(form)}</span>
            )}
            {(form.value_min || form.value_max) && (
              <span className="co-review-chip">
                ${form.value_min ? Number(form.value_min).toLocaleString() : '0'}&ndash;${form.value_max ? Number(form.value_max).toLocaleString() : 'max'}
              </span>
            )}
            {form.owner_types.length > 0 && (
              <span className="co-review-chip">{form.owner_types.join(', ')}</span>
            )}
            {form.distress_signals.length > 0 && (
              <span className="co-review-chip">{form.distress_signals.length} distress signal{form.distress_signals.length > 1 ? 's' : ''}</span>
            )}
            {!form.asset_classes.length && !geoSummary(form) && (
              <span className="co-review-empty">Configure asset class and geography to activate</span>
            )}
          </div>
          <div className="co-review-right">
            {previewLoading && <span className="co-review-preview co-review-preview--loading">Matching…</span>}
            {previewCount !== null && !previewLoading && (
              <span className="co-review-preview">~{previewCount} matches</span>
            )}
            {error && <span className="co-review-error">{error}</span>}
            <button
              className="co-activate-btn"
              onClick={handleActivate}
              disabled={submitting}
              type="button"
            >
              {submitting
                ? (isEdit ? 'Saving...' : 'Activating...')
                : (isEdit ? 'Save Changes' : 'Activate Buy Box')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
