import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { useToast } from '../contexts/ToastContext';
import { toFormState, buildPayload } from '../lib/wizardHelpers';
import {
  ASSET_CLASSES, US_STATES, MAJOR_METROS,
  DISTRESS_SIGNAL_OPTIONS, OWNER_TYPE_OPTIONS, SCHEDULE_DAYS, ALL_DAYS,
} from '../lib/buyBoxTaxonomy';
import { I } from './Icons';
import '../styles/buy-box-edit-modal.css';

function buildSavePayload(f) {
  const p = buildPayload(f);
  return {
    ...p,
    asset_use_codes: f.subtypes?.length > 0 ? f.subtypes : null,
    geo_cities: f.geo.metros?.length > 0 ? f.geo.metros : null,
    run_schedule: { days: f.days?.length > 0 ? f.days : ALL_DAYS },
  };
}

export function BuyBoxEditModal({ box, onClose }) {
  const { patchBuyBox, deleteBuyBox } = useDeals();
  const addToast = useToast();

  const [form, setForm] = useState(() => {
    const base = toFormState(box);
    return {
      ...base,
      subtypes: Array.isArray(box.asset_use_codes) ? [...box.asset_use_codes] : [],
      geo: {
        ...base.geo,
        metros: Array.isArray(box.geo_cities) ? [...box.geo_cities] : [],
      },
      days: box.run_schedule?.days?.length > 0 ? [...box.run_schedule.days] : [...ALL_DAYS],
    };
  });

  const [geoTab, setGeoTab] = useState('states');
  const [zipInput, setZipInput] = useState(() => (box.geo_zips || []).join(', '));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleTop = useCallback((field, val) => {
    setForm(f => {
      const arr = f[field];
      return { ...f, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }, []);

  const toggleGeo = useCallback((geoKey, val) => {
    setForm(f => {
      const arr = f.geo[geoKey];
      return {
        ...f,
        geo: { ...f.geo, [geoKey]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] },
      };
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const zips = zipInput.split(/[\s,]+/).map(z => z.trim()).filter(Boolean);
      const finalForm = { ...form, geo: { ...form.geo, zips } };
      await patchBuyBox(box.id, buildSavePayload(finalForm));
      addToast('Buy box saved.', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Save failed. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBuyBox(box.id);
      addToast('Buy box deleted.', 'success');
      onClose();
    } catch (err) {
      addToast(err.message || 'Delete failed. Try again.', 'error');
    }
  };

  const availableSubtypes = useMemo(() => {
    return form.assets.flatMap(assetId => {
      const cls = ASSET_CLASSES.find(c => c.id === assetId);
      return cls ? cls.subtypes : [];
    });
  }, [form.assets]);

  const GEO_TABS = [['states','States'],['metros','Metros'],['zips','Zip Codes'],['radius','Radius']];

  return (
    <div className="bbem-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bbem-dialog">

        <header className="bbem-header">
          <div className="bbem-header-icon"><I.Sliders size={13} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bbem-title">{box.label || 'Edit Buy Box'}</div>
            <div className="bbem-subtitle">Buy box configuration</div>
          </div>
          <button className="bbem-close" onClick={onClose} aria-label="Close">
            <I.Close size={13} />
          </button>
        </header>

        <div className="bbem-body">

          {/* Name */}
          <div className="bbem-section">
            <label className="bbem-section-label">Name</label>
            <input
              className="bbem-input"
              value={form.name || ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Buy box name"
            />
          </div>

          {/* Geography */}
          <div className="bbem-section">
            <label className="bbem-section-label">Geography</label>
            <div className="bbem-tab-bar">
              {GEO_TABS.map(([id, lbl]) => (
                <button key={id} className={`bbem-tab${geoTab === id ? ' is-active' : ''}`} onClick={() => setGeoTab(id)}>
                  {lbl}
                </button>
              ))}
            </div>

            {geoTab === 'states' && (
              <div className="bbem-state-grid">
                {US_STATES.map(([abbr, name]) => (
                  <button
                    key={abbr} title={name}
                    className={`bbem-state-chip${form.geo.states.includes(abbr) ? ' is-sel' : ''}`}
                    onClick={() => toggleGeo('states', abbr)}
                  >{abbr}</button>
                ))}
              </div>
            )}

            {geoTab === 'metros' && (
              <div className="bbem-metro-list">
                {MAJOR_METROS.map(metro => (
                  <div key={metro} className="bbem-metro-row" onClick={() => toggleGeo('metros', metro)}>
                    <div className={`bbem-metro-check${form.geo.metros.includes(metro) ? ' is-sel' : ''}`} />
                    <span className="bbem-metro-name">{metro}</span>
                  </div>
                ))}
              </div>
            )}

            {geoTab === 'zips' && (
              <textarea
                className="bbem-textarea"
                value={zipInput}
                onChange={e => setZipInput(e.target.value)}
                placeholder="Enter zip codes, comma or space separated: 78701, 90210, 10001"
              />
            )}

            {geoTab === 'radius' && (
              <span className="bbem-empty-hint">Radius targeting coming soon.</span>
            )}
          </div>

          {/* Asset Class */}
          <div className="bbem-section">
            <label className="bbem-section-label">Asset Class</label>
            <div className="bbem-chips">
              {ASSET_CLASSES.map(cls => (
                <button
                  key={cls.id}
                  className={`bbem-chip${form.assets.includes(cls.id) ? ' is-sel' : ''}`}
                  onClick={() => toggleTop('assets', cls.id)}
                >{cls.label}</button>
              ))}
            </div>
          </div>

          {/* Sub-Types */}
          <div className="bbem-section">
            <label className="bbem-section-label">Sub-Types</label>
            {availableSubtypes.length === 0 ? (
              <span className="bbem-empty-hint">Select an asset class to see sub-types.</span>
            ) : (
              <div className="bbem-chips">
                {availableSubtypes.map(st => (
                  <button
                    key={st.code}
                    className={`bbem-chip${form.subtypes.includes(st.code) ? ' is-sel' : ''}`}
                    onClick={() => toggleTop('subtypes', st.code)}
                  >{st.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Criteria */}
          <div className="bbem-section">
            <label className="bbem-section-label">Criteria</label>
            <div className="bbem-range-rows">
              {[
                { key: 'sf',    label: 'Sq ft',     parent: 'phys', unit: 'sf' },
                { key: 'acres', label: 'Acres',      parent: 'phys', unit: 'ac' },
                { key: 'price', label: 'Value ($)',  parent: 'fin',  unit: '$'  },
                { key: 'year',  label: 'Year built', parent: 'phys', unit: ''   },
              ].map(({ key, label, parent, unit }) => {
                const minK = `${key}_min`;
                const maxK = `${key}_max`;
                const src = parent === 'fin' ? form.fin : form.phys;
                const setVal = (k, v) => setForm(f => ({
                  ...f,
                  [parent]: { ...f[parent], [k]: v === '' ? null : Number(v) },
                }));
                return (
                  <div key={key} className="bbem-range-row">
                    <span className="bbem-range-key">{label}</span>
                    <div className="bbem-range-pair">
                      <div className="bbem-range-cell">
                        <span className="bbem-range-hint">Min</span>
                        <input type="number" className="bbem-range-num" value={src[minK] ?? ''} onChange={e => setVal(minK, e.target.value)} />
                        {unit && <span className="bbem-range-unit">{unit}</span>}
                      </div>
                      <span className="bbem-range-sep">–</span>
                      <div className="bbem-range-cell">
                        <span className="bbem-range-hint">Max</span>
                        <input type="number" className="bbem-range-num" value={src[maxK] ?? ''} onChange={e => setVal(maxK, e.target.value)} />
                        {unit && <span className="bbem-range-unit">{unit}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ownership */}
          <div className="bbem-section">
            <label className="bbem-section-label">Ownership</label>
            <div className="bbem-owner-entity">
              <span className="bbem-section-sublabel">Owner type</span>
              <div className="bbem-chips">
                {OWNER_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`bbem-chip${form.owner.entity.includes(opt.value) ? ' is-sel' : ''}`}
                    onClick={() => setForm(f => {
                      const arr = f.owner.entity;
                      const next = arr.includes(opt.value) ? arr.filter(v => v !== opt.value) : [...arr, opt.value];
                      return { ...f, owner: { ...f.owner, entity: next } };
                    })}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="bbem-toggle-rows">
              <div className="bbem-toggle-row">
                <span className="bbem-toggle-label">Absentee owner only</span>
                <button
                  className={`bbem-toggle${form.owner.occupancy === 'absentee' ? ' is-on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, owner: { ...f.owner, occupancy: f.owner.occupancy === 'absentee' ? '' : 'absentee' } }))}
                  aria-label="Toggle absentee owner"
                />
              </div>
              <div className="bbem-toggle-row">
                <span className="bbem-toggle-label">Out-of-state owner only</span>
                <button
                  className={`bbem-toggle${form.owner.out_of_state ? ' is-on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, owner: { ...f.owner, out_of_state: !f.owner.out_of_state } }))}
                  aria-label="Toggle out of state owner"
                />
              </div>
            </div>
            <div className="bbem-range-row" style={{ marginTop: 12 }}>
              <span className="bbem-range-key">Hold (yrs)</span>
              <div className="bbem-range-pair">
                <div className="bbem-range-cell">
                  <span className="bbem-range-hint">Min</span>
                  <input
                    type="number" className="bbem-range-num"
                    value={form.owner.hold_min ?? ''}
                    onChange={e => setForm(f => ({ ...f, owner: { ...f.owner, hold_min: e.target.value === '' ? null : Number(e.target.value) } }))}
                  />
                </div>
                <span className="bbem-range-sep">–</span>
                <div className="bbem-range-cell">
                  <span className="bbem-range-hint">Max</span>
                  <input
                    type="number" className="bbem-range-num"
                    value={form.owner.hold_max ?? ''}
                    onChange={e => setForm(f => ({ ...f, owner: { ...f.owner, hold_max: e.target.value === '' ? null : Number(e.target.value) } }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Distress */}
          <div className="bbem-section">
            <label className="bbem-section-label">Distress Signals</label>
            <div className="bbem-chips">
              {DISTRESS_SIGNAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`bbem-chip${form.signals.includes(opt.value) ? ' is-sel' : ''}`}
                  onClick={() => toggleTop('signals', opt.value)}
                >{opt.label}</button>
              ))}
            </div>
            {form.signals.length > 1 && (
              <div className="bbem-logic-row">
                <span className="bbem-logic-label">Match mode:</span>
                {['or', 'and'].map(mode => (
                  <button
                    key={mode}
                    className={`bbem-logic-btn${form.logic.mode === mode ? ' is-active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, logic: { mode } }))}
                  >{mode.toUpperCase()}</button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bbem-section">
            <label className="bbem-section-label">Schedule</label>
            <div className="bbem-days">
              {SCHEDULE_DAYS.map(({ abbr, label }) => (
                <button
                  key={abbr}
                  className={`bbem-day${form.days.includes(abbr) ? ' is-on' : ''}`}
                  title={abbr}
                  onClick={() => setForm(f => {
                    const arr = f.days;
                    return { ...f, days: arr.includes(abbr) ? arr.filter(d => d !== abbr) : [...arr, abbr] };
                  })}
                >{label}</button>
              ))}
            </div>
            <div className="bbem-max-row">
              <span className="bbem-max-label">Max deals per run</span>
              <input
                type="number" className="bbem-max-input" min="1" max="100"
                value={form.delivery.max_per_run ?? 10}
                onChange={e => setForm(f => ({ ...f, delivery: { ...f.delivery, max_per_run: Number(e.target.value) } }))}
              />
            </div>
          </div>

        </div>

        <footer className="bbem-footer">
          <div className="bbem-footer-left">
            {!confirmDelete ? (
              <button className="bbem-btn bbem-btn-danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            ) : (
              <>
                <span className="bbem-confirm-text">Delete this box?</span>
                <button className="bbem-btn bbem-btn-ghost" onClick={() => setConfirmDelete(false)}>No</button>
                <button className="bbem-btn bbem-btn-danger" onClick={handleDelete}>Yes, delete</button>
              </>
            )}
          </div>
          <div className="bbem-footer-right">
            <button className="bbem-btn bbem-btn-ghost" onClick={onClose}>Cancel</button>
            <button className="bbem-btn bbem-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
