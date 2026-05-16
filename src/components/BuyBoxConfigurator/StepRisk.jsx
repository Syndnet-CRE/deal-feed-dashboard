export default function StepRisk({ form, onChange }) {
  const climateMax = form.climate_risk_max ?? 10;
  const wildFireMax = form.wildfire_risk_max ?? 10;
  const heatMax = form.heat_risk_max ?? 10;

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Risk Filters</h1>
      <p className="bb-step-subtitle">Limit exposure to climate and environmental risk.</p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="bb-label" style={{ marginBottom: 4 }}>Climate Risk Max</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              className="bb-slider"
              min="0"
              max="10"
              step="1"
              value={climateMax}
              onChange={e => onChange({ climate_risk_max: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 14, color: 'var(--ink-1)', minWidth: 40 }}>{climateMax}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            {climateMax === 10 ? 'Any risk level' : `Score ≤ ${climateMax}`}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="bb-toggle-row">
          <div>
            <div className="bb-toggle-label">Exclude Flood Risk Properties</div>
            <div className="bb-toggle-desc">Skip properties in FEMA high-flood zones</div>
          </div>
          <input
            type="checkbox"
            checked={form.flood_exclude || false}
            onChange={e => onChange({ flood_exclude: e.target.checked })}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="bb-label" style={{ marginBottom: 4 }}>Wildfire Risk Max</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              className="bb-slider"
              min="0"
              max="10"
              step="1"
              value={wildFireMax}
              onChange={e => onChange({ wildfire_risk_max: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 14, color: 'var(--ink-1)', minWidth: 40 }}>{wildFireMax}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            {wildFireMax === 10 ? 'Any risk level' : `Score ≤ ${wildFireMax}`}
          </div>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 12 }}>
          <div className="bb-label" style={{ marginBottom: 4 }}>Heat Risk Max</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              className="bb-slider"
              min="0"
              max="10"
              step="1"
              value={heatMax}
              onChange={e => onChange({ heat_risk_max: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 14, color: 'var(--ink-1)', minWidth: 40 }}>{heatMax}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            {heatMax === 10 ? 'Any risk level' : `Score ≤ ${heatMax}`}
          </div>
        </div>
      </div>
    </div>
  );
}
