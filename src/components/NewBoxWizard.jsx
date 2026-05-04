import { useState } from 'react';
import { ASSET_CLASSES } from '../data/mockData';
import { I } from './Icons';
import { api } from '../lib/api';
import { fmt } from '../lib/format';
import { buildPayload, canProceed } from '../lib/wizardHelpers';
import { useDeals } from '../contexts/DealsContext';

const TOTAL_STEPS = STEP_LABELS.length;
const STEP_LABELS = ['Name', 'Geography', 'Asset Classes', 'Property Criteria', 'Ownership', 'Distress Signals', 'Review'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const OWNER_TYPE_OPTIONS = ['Individual', 'LLC', 'LP', 'Trust', 'Corporation', 'REIT', 'Government'];

const DISTRESS_OPTIONS = [
  { value: 'Absentee Owner',     desc: 'Mailing address differs from property address' },
  { value: 'Out-of-State Owner', desc: 'Owner mails from outside the property state' },
  { value: 'No Permits 5yr',     desc: 'No building permits pulled in the past 5 years' },
  { value: 'Entity Owner',       desc: 'Property held in an LLC, LP, or trust' },
  { value: 'Tax Delinquent',     desc: 'Owner has unpaid property tax obligations' },
  { value: 'Lis Pendens',        desc: 'Pending lawsuit recorded against the property' },
  { value: 'Foreclosure',        desc: 'Property is in active foreclosure proceedings' },
  { value: 'Vacant',             desc: 'Unoccupied per utility or field data' },
];

const INITIAL_FORM = {
  label: '',
  notes: '',
  geoMode: 'state',
  geo_states: [],
  geo_cities: [],
  geo_zips: [],
  geo_radius_address: '',
  geo_radius_miles: '',
  asset_classes: [],
  acres_min: '',
  acres_max: '',
  value_min: '',
  value_max: '',
  year_built_min: '',
  year_built_max: '',
  min_hold_yrs: '',
  zoning_codes: [],
  owner_types: [],
  absentee_only: false,
  out_of_state_only: false,
  distress_signals: [],
  distress_only: false,
};

// ── Primitives ─────────────────────────────────────────────────────

function StepProgress({ step }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {STEP_LABELS.map((label, i) => (
        <div
          key={i}
          title={label}
          style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i + 1 <= step ? 'var(--green)' : 'var(--hairline)',
          }}
        />
      ))}
    </div>
  );
}

function CheckCard({ label, desc, selected, onClick }) {
  return (
    <button type="button" className={`check-card${selected ? ' selected' : ''}`} onClick={onClick}>
      <div className="check-card-icon">{selected && <I.Check size={12} />}</div>
      <div className="check-card-label">{label}</div>
      {desc && <div className="check-card-desc">{desc}</div>}
    </button>
  );
}

function ChipList({ items, onRemove }) {
  if (!items || !items.length) return null;
  return (
    <div className="chip-list">
      {items.map(item => (
        <span key={item} className="chip">
          {item}
          <button type="button" className="chip-remove" onClick={() => onRemove(item)}>
            <I.Close size={10} />
          </button>
        </span>
      ))}
    </div>
  );
}

function TagInput({ placeholder, onAdd }) {
  const [val, setVal] = useState('');
  const commit = () => {
    const t = val.trim();
    if (t) { onAdd(t); setVal(''); }
  };
  return (
    <div className="tag-input-wrap">
      <input
        className="input"
        value={val}
        placeholder={placeholder}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
        }}
      />
      <button type="button" className="btn" onClick={commit}>Add</button>
    </div>
  );
}

function MinMaxPair({ label, minKey, maxKey, form, update }) {
  return (
    <div className="range-row" style={{ marginBottom: 14 }}>
      <span className="toggle-row-label">{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          type="number"
          min={0}
          placeholder="Min"
          value={form[minKey]}
          onChange={e => update(minKey, e.target.value)}
        />
        <input
          className="input"
          type="number"
          min={0}
          placeholder="Max"
          value={form[maxKey]}
          onChange={e => update(maxKey, e.target.value)}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="toggle-row">
      <span className="toggle-row-label">{label}</span>
      <button
        type="button"
        className={`toggle-switch${value ? ' on' : ''}`}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={label}
      />
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────

function StepName({ form, update }) {
  return (
    <div>
      <div className="field">
        <label>Buy Box Name *</label>
        <input
          className="input"
          value={form.label}
          onChange={e => update('label', e.target.value)}
          placeholder="e.g. Nashville — IOS"
          maxLength={100}
          autoFocus
        />
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          className="input"
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Investment thesis, deal criteria, internal context…"
          rows={3}
          maxLength={10000}
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
}

const GEO_MODE_TABS = [
  { key: 'state',  label: 'States' },
  { key: 'metro',  label: 'Metro / Cities' },
  { key: 'zip',    label: 'ZIP Codes' },
  { key: 'radius', label: 'Radius' },
];

function StepGeo({ form, update }) {
  const addTo      = (field, val) => { if (!form[field].includes(val)) update(field, [...form[field], val]); };
  const removeFrom = (field, val) => update(field, form[field].filter(x => x !== val));

  return (
    <div>
      <div className="wizard-tabs">
        {GEO_MODE_TABS.map(m => (
          <button
            key={m.key}
            type="button"
            className={`wizard-tab${form.geoMode === m.key ? ' active' : ''}`}
            onClick={() => update('geoMode', m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {form.geoMode === 'state' && (
        <div>
          <div className="field">
            <label>Select States</label>
            <select
              className="select"
              value=""
              onChange={e => { if (e.target.value) addTo('geo_states', e.target.value); }}
            >
              <option value="">Add a state…</option>
              {US_STATES.filter(s => !form.geo_states.includes(s)).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <ChipList items={form.geo_states} onRemove={v => removeFrom('geo_states', v)} />
        </div>
      )}

      {form.geoMode === 'metro' && (
        <div>
          <div className="field">
            <label>Metro Areas or Cities</label>
            <TagInput
              placeholder="e.g. Nashville–Davidson, TN"
              onAdd={v => addTo('geo_cities', v)}
            />
          </div>
          <ChipList items={form.geo_cities} onRemove={v => removeFrom('geo_cities', v)} />
        </div>
      )}

      {form.geoMode === 'zip' && (
        <div>
          <div className="field">
            <label>ZIP Codes</label>
            <TagInput
              placeholder="5-digit ZIP — press Enter or comma"
              onAdd={v => {
                const z = v.replace(/\D/g, '').slice(0, 5);
                if (z.length === 5) addTo('geo_zips', z);
              }}
            />
          </div>
          <ChipList items={form.geo_zips} onRemove={v => removeFrom('geo_zips', v)} />
        </div>
      )}

      {form.geoMode === 'radius' && (
        <div>
          <div className="field">
            <label>Center Address</label>
            <input
              className="input"
              value={form.geo_radius_address}
              onChange={e => update('geo_radius_address', e.target.value)}
              placeholder="e.g. 1000 N Main St, Nashville TN 37201"
              maxLength={500}
            />
          </div>
          <div className="field">
            <label>Radius (miles)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={500}
              value={form.geo_radius_miles}
              onChange={e => update('geo_radius_miles', e.target.value)}
              placeholder="e.g. 35"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StepAssetClasses({ form, update }) {
  const toggle = cls => {
    const next = form.asset_classes.includes(cls)
      ? form.asset_classes.filter(c => c !== cls)
      : [...form.asset_classes, cls];
    update('asset_classes', next);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {ASSET_CLASSES.map(cls => (
        <CheckCard
          key={cls}
          label={cls}
          selected={form.asset_classes.includes(cls)}
          onClick={() => toggle(cls)}
        />
      ))}
    </div>
  );
}

function StepCriteria({ form, update }) {
  return (
    <div>
      <MinMaxPair label="Acres"      minKey="acres_min"      maxKey="acres_max"      form={form} update={update} />
      <MinMaxPair label="Value ($)"  minKey="value_min"      maxKey="value_max"      form={form} update={update} />
      <MinMaxPair label="Year Built" minKey="year_built_min" maxKey="year_built_max" form={form} update={update} />
      <div className="range-row" style={{ marginBottom: 14 }}>
        <span className="toggle-row-label">Min Hold Period (years)</span>
        <input
          className="input"
          type="number"
          min={1}
          max={30}
          value={form.min_hold_yrs}
          onChange={e => update('min_hold_yrs', e.target.value)}
          placeholder="e.g. 5"
          style={{ maxWidth: 120 }}
        />
      </div>
      <div className="field">
        <label>Zoning Codes (optional)</label>
        <TagInput
          placeholder="e.g. M-1, I-2 — press Enter or comma"
          onAdd={v => {
            if (!form.zoning_codes.includes(v)) update('zoning_codes', [...form.zoning_codes, v]);
          }}
        />
        <ChipList
          items={form.zoning_codes}
          onRemove={v => update('zoning_codes', form.zoning_codes.filter(z => z !== v))}
        />
      </div>
    </div>
  );
}

function StepOwnership({ form, update }) {
  const toggle = type => {
    const next = form.owner_types.includes(type)
      ? form.owner_types.filter(t => t !== type)
      : [...form.owner_types, type];
    update('owner_types', next);
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {OWNER_TYPE_OPTIONS.map(type => (
          <CheckCard
            key={type}
            label={type}
            selected={form.owner_types.includes(type)}
            onClick={() => toggle(type)}
          />
        ))}
      </div>
      <ToggleRow label="Absentee Owners Only"     value={form.absentee_only}     onChange={v => update('absentee_only', v)} />
      <ToggleRow label="Out-of-State Owners Only" value={form.out_of_state_only} onChange={v => update('out_of_state_only', v)} />
    </div>
  );
}

function StepDistress({ form, update }) {
  const toggle = val => {
    const next = form.distress_signals.includes(val)
      ? form.distress_signals.filter(s => s !== val)
      : [...form.distress_signals, val];
    update('distress_signals', next);
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {DISTRESS_OPTIONS.map(opt => (
          <CheckCard
            key={opt.value}
            label={opt.value}
            desc={opt.desc}
            selected={form.distress_signals.includes(opt.value)}
            onClick={() => toggle(opt.value)}
          />
        ))}
      </div>
      <ToggleRow
        label="Distress Signal Required"
        value={form.distress_only}
        onChange={v => update('distress_only', v)}
      />
    </div>
  );
}

function fmtGeo(form) {
  const { geoMode, geo_states, geo_cities, geo_zips, geo_radius_address, geo_radius_miles } = form;
  if (geoMode === 'state')  return geo_states.join(', ')  || '—';
  if (geoMode === 'metro')  return geo_cities.join(', ')  || '—';
  if (geoMode === 'zip')    return geo_zips.join(', ')    || '—';
  if (geoMode === 'radius') {
    const addr = geo_radius_address || '—';
    return geo_radius_miles ? `${addr} within ${geo_radius_miles} mi` : addr;
  }
  return '—';
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value}</span>
    </div>
  );
}

function StepReview({ form, submitError }) {
  const geoModeLabel = { state: 'States', metro: 'Metro / Cities', zip: 'ZIP Codes', radius: 'Radius' }[form.geoMode];
  return (
    <div>
      <div className="review-section">
        <div className="review-section-title">Basics</div>
        <ReviewRow label="Name"  value={fmt(form.label)} />
        <ReviewRow label="Notes" value={fmt(form.notes)} />
      </div>
      <div className="review-section">
        <div className="review-section-title">Geography ({geoModeLabel})</div>
        <ReviewRow label="Coverage" value={fmtGeo(form)} />
      </div>
      <div className="review-section">
        <div className="review-section-title">Asset Classes</div>
        <ReviewRow label="Classes" value={form.asset_classes.join(', ') || '—'} />
      </div>
      <div className="review-section">
        <div className="review-section-title">Property Criteria</div>
        <ReviewRow label="Acres"      value={form.acres_min !== ''      || form.acres_max !== ''      ? `${fmt(form.acres_min)} – ${fmt(form.acres_max)}`           : '—'} />
        <ReviewRow label="Value"      value={form.value_min !== ''      || form.value_max !== ''      ? `${fmt(form.value_min)} – ${fmt(form.value_max)}`             : '—'} />
        <ReviewRow label="Year Built" value={form.year_built_min !== '' || form.year_built_max !== '' ? `${fmt(form.year_built_min)} – ${fmt(form.year_built_max)}` : '—'} />
        <ReviewRow label="Min Hold"   value={form.min_hold_yrs ? `${form.min_hold_yrs} yr` : '—'} />
        <ReviewRow label="Zoning"     value={form.zoning_codes.join(', ') || '—'} />
      </div>
      <div className="review-section">
        <div className="review-section-title">Ownership</div>
        <ReviewRow label="Owner Types"       value={form.owner_types.join(', ') || 'Any'} />
        <ReviewRow label="Absentee Only"     value={form.absentee_only     ? 'Yes' : 'No'} />
        <ReviewRow label="Out-of-State Only" value={form.out_of_state_only ? 'Yes' : 'No'} />
      </div>
      <div className="review-section">
        <div className="review-section-title">Distress Signals</div>
        <ReviewRow label="Signals"           value={form.distress_signals.join(', ') || 'Any'} />
        <ReviewRow label="Distress Required" value={form.distress_only ? 'Yes' : 'No'} />
      </div>
      {submitError && (
        <p style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 12 }}>{submitError}</p>
      )}
    </div>
  );
}

function ConfirmationState({ label, onClose }) {
  return (
    <div className="wizard-confirm">
      <div className="wizard-confirm-icon"><I.Check size={28} /></div>
      <h4>Buy Box Activated</h4>
      <p><b>{label}</b> is live. Your first match run will execute tonight at 02:00 EDT.</p>
      <button type="button" className="btn primary" onClick={onClose} style={{ marginTop: 8 }}>Done</button>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────

export function NewBoxWizard({ onClose }) {
  const { refetch } = useDeals();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const canGoNext = canProceed(step, form);

  const activate = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/api/dealfeed/onboarding', buildPayload(form));
      await refetch();
      setSubmitted(true);
    } catch {
      setSubmitError('Failed to create buy box. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{submitted ? 'Buy Box Created' : 'New Buy Box'}</h3>
            {!submitted && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                Step {step} of {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
              </div>
            )}
          </div>
          <button type="button" className="drawer-close" onClick={onClose}>
            <I.Close size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: 320 }}>
          {submitted ? (
            <ConfirmationState label={form.label} onClose={onClose} />
          ) : (
            <>
              <StepProgress step={step} />
              {step === 1 && <StepName         form={form} update={update} />}
              {step === 2 && <StepGeo          form={form} update={update} />}
              {step === 3 && <StepAssetClasses form={form} update={update} />}
              {step === 4 && <StepCriteria     form={form} update={update} />}
              {step === 5 && <StepOwnership    form={form} update={update} />}
              {step === 6 && <StepDistress     form={form} update={update} />}
              {step === 7 && <StepReview       form={form} submitError={submitError} />}
            </>
          )}
        </div>

        {!submitted && (
          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            {step > 1 && (
              <button type="button" className="btn" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            {step < TOTAL_STEPS && (
              <button
                type="button"
                className="btn primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canGoNext}
              >
                Next
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button
                type="button"
                className="btn primary"
                onClick={activate}
                disabled={submitting}
              >
                {submitting ? 'Activating…' : <><I.Check size={13} /> Activate Buy Box</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
