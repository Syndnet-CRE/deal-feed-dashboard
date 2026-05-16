import { useMemo } from 'react';

export default function StepReview({ form, onChange, onSubmit, submitting }) {
  const label = form.label || '';

  const summaryGroups = useMemo(() => {
    const groups = [];

    // Target group
    if (form.asset_class) {
      const targetGroup = [];
      if (form.asset_class) {
        targetGroup.push({ key: 'Asset Class', val: form.asset_class });
      }
      if (form.selected_sub_slugs && form.selected_sub_slugs.length > 0) {
        targetGroup.push({ key: 'Sub-Types', val: form.selected_sub_slugs.join(', ') });
      }
      if (targetGroup.length > 0) {
        groups.push({ title: 'Target', rows: targetGroup });
      }
    }

    // Geography group
    const geoGroup = [];
    if (form.geo_states && form.geo_states.length > 0) {
      geoGroup.push({ key: 'States', val: form.geo_states.join(', ') });
    }
    if (form.geo_counties && form.geo_counties.length > 0) {
      geoGroup.push({ key: 'Counties', val: `${form.geo_counties.length} selected` });
    }
    if (form.geo_cities && form.geo_cities.length > 0) {
      geoGroup.push({ key: 'Metros', val: form.geo_cities.length === 1 ? form.geo_cities[0] : `${form.geo_cities.length} selected` });
    }
    if (form.geo_zips && form.geo_zips.length > 0) {
      geoGroup.push({ key: 'Zips', val: form.geo_zips.join(', ') });
    }
    if (geoGroup.length > 0) {
      groups.push({ title: 'Geography', rows: geoGroup });
    }

    // Property specs
    const propGroup = [];
    if (form.sf_min || form.sf_max) {
      propGroup.push({ key: 'Sqft', val: `${form.sf_min || 'any'} – ${form.sf_max || 'any'}` });
    }
    if (form.acres_min || form.acres_max) {
      propGroup.push({ key: 'Acres', val: `${form.acres_min || 'any'} – ${form.acres_max || 'any'}` });
    }
    if (form.year_built_min || form.year_built_max) {
      propGroup.push({ key: 'Year Built', val: `${form.year_built_min || 'any'} – ${form.year_built_max || 'any'}` });
    }
    if (form.stories_min) {
      propGroup.push({ key: 'Min Stories', val: form.stories_min });
    }
    if (form.units_min || form.units_max) {
      propGroup.push({ key: 'Units', val: `${form.units_min || 'any'} – ${form.units_max || 'any'}` });
    }
    if (form.value_min || form.value_max) {
      propGroup.push({ key: 'Value', val: `${form.value_min ? '$' + form.value_min : 'any'} – ${form.value_max ? '$' + form.value_max : 'any'}` });
    }
    if (propGroup.length > 0) {
      groups.push({ title: 'Property', rows: propGroup });
    }

    // Financial
    const finGroup = [];
    if (form.min_equity_pct) {
      finGroup.push({ key: 'Min Equity', val: `${Math.round(form.min_equity_pct * 100)}%` });
    }
    if (form.assessed_below_market) {
      finGroup.push({ key: 'Assessment', val: 'Below Market' });
    }
    if (finGroup.length > 0) {
      groups.push({ title: 'Financial', rows: finGroup });
    }

    // Ownership
    const ownerGroup = [];
    if (form.owner_types && form.owner_types.length > 0) {
      const labels = {
        individual: 'Individual',
        llc: 'LLC / Corp',
        trust: 'Trust',
        estate: 'Estate',
      };
      ownerGroup.push({
        key: 'Entity Type',
        val: form.owner_types.map(t => labels[t] || t).join(', '),
      });
    }
    if (form.absentee_only) {
      ownerGroup.push({ key: 'Occupancy', val: 'Absentee Only' });
    }
    if (form.out_of_state_only) {
      ownerGroup.push({ key: 'Location', val: 'Out-of-State' });
    }
    if (form.min_hold_yrs) {
      ownerGroup.push({ key: 'Min Hold', val: `${form.min_hold_yrs} years` });
    }
    if (ownerGroup.length > 0) {
      groups.push({ title: 'Ownership', rows: ownerGroup });
    }

    // Distress
    if (form.distress_signals && form.distress_signals.length > 0) {
      const distressGroup = [];
      distressGroup.push({
        key: 'Signals',
        val: `${form.distress_signals.length} selected`,
      });
      distressGroup.push({
        key: 'Match Mode',
        val: (form.distress_match_mode || 'or').toUpperCase(),
      });
      groups.push({ title: 'Distress', rows: distressGroup });
    }

    // Risk
    const riskGroup = [];
    if ((form.climate_risk_max ?? 10) < 10) {
      riskGroup.push({ key: 'Climate Risk', val: `≤ ${form.climate_risk_max}` });
    }
    if (form.flood_exclude) {
      riskGroup.push({ key: 'Flood Risk', val: 'Excluded' });
    }
    if ((form.wildfire_risk_max ?? 10) < 10) {
      riskGroup.push({ key: 'Wildfire Risk', val: `≤ ${form.wildfire_risk_max}` });
    }
    if ((form.heat_risk_max ?? 10) < 10) {
      riskGroup.push({ key: 'Heat Risk', val: `≤ ${form.heat_risk_max}` });
    }
    if (riskGroup.length > 0) {
      groups.push({ title: 'Risk', rows: riskGroup });
    }

    // Delivery
    const deliveryGroup = [];
    deliveryGroup.push({
      key: 'Threshold',
      val: `${Math.round((form.match_threshold ?? 0.8) * 100)}%`,
    });
    deliveryGroup.push({
      key: 'Schedule',
      val: form.run_schedule || 'Daily',
    });
    deliveryGroup.push({
      key: 'Max Per Run',
      val: (form.delivery_max_per_run || 5).toString(),
    });
    groups.push({ title: 'Delivery', rows: deliveryGroup });

    return groups;
  }, [form]);

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Review & Activate</h1>
      <p className="bb-step-subtitle">Name your buy box and confirm your settings.</p>

      <div className="bb-field" style={{ marginBottom: 24 }}>
        <label className="bb-label">Buy Box Name (required)</label>
        <input
          className="bb-input"
          type="text"
          value={label}
          onChange={e => onChange({ label: e.target.value })}
          placeholder="e.g. Austin Self Storage 50+ Units"
          autoFocus
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        {summaryGroups.map((group, idx) => (
          <div key={idx} className="bb-review-section">
            <div className="bb-review-section-title">{group.title}</div>
            {group.rows.map((row, rowIdx) => (
              <div key={rowIdx} className="bb-review-row">
                <span className="bb-review-key">{row.key}</span>
                <span className="bb-review-val">{row.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bb-nav">
        <div />
        <button
          className="bb-btn-next"
          onClick={onSubmit}
          disabled={!label.trim() || submitting}
        >
          {submitting ? 'Activating...' : 'Activate Buy Box'}
        </button>
      </div>
    </div>
  );
}
