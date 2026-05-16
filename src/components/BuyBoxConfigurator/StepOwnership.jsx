import { OWNER_TYPE_OPTIONS as OWNER_TYPES } from '../../lib/buyBoxTaxonomy';

export default function StepOwnership({ form, onChange }) {
  const toggleOwnerType = (value) => {
    const current = form.owner_types || [];
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    onChange({ owner_types: updated });
  };

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Ownership Profile</h1>
      <p className="bb-step-subtitle">Filter by who owns the property.</p>

      <div style={{ marginBottom: 24 }}>
        <div className="bb-section-head">Entity Type</div>
        <div className="bb-subclass-grid">
          {OWNER_TYPES.map(opt => (
            <button
              key={opt.value}
              className={`bb-subclass-chip${(form.owner_types || []).includes(opt.value) ? ' selected' : ''}`}
              onClick={() => toggleOwnerType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="bb-section-head">Occupancy &amp; Tenure</div>

        <div className="bb-toggle-row">
          <div>
            <div className="bb-toggle-label">Absentee Only</div>
            <div className="bb-toggle-desc">Owner does not live at the property</div>
          </div>
          <input
            type="checkbox"
            checked={form.absentee_only || false}
            onChange={e => onChange({ absentee_only: e.target.checked })}
          />
        </div>

        <div className="bb-toggle-row">
          <div>
            <div className="bb-toggle-label">Out-of-State Only</div>
            <div className="bb-toggle-desc">Owner's mailing address is in a different state</div>
          </div>
          <input
            type="checkbox"
            checked={form.out_of_state_only || false}
            onChange={e => onChange({ out_of_state_only: e.target.checked })}
          />
        </div>
      </div>

      <div className="bb-field">
        <label className="bb-label">Min Hold Years</label>
        <input
          className="bb-input"
          type="number"
          min="0"
          value={form.min_hold_yrs || ''}
          onChange={e => onChange({ min_hold_yrs: e.target.value })}
          placeholder="10"
        />
      </div>
    </div>
  );
}
