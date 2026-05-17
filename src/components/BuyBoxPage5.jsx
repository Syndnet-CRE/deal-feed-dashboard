function Toggle({ checked, onChange }) {
  return (
    <div
      className={`toggle${checked ? ' on' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={onChange}
    />
  )
}

export function BuyBoxPage5({ form, setForm, assetClass }) {
  const floodExclude = form.risk?.flood || false
  const underimprovedLand = form.underimproved_land || false
  const isLandClass = form.assets?.includes('land') || assetClass === 'land'

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">05/07</span>
          <span className="sep" />
          <span>Location rules</span>
        </div>
        <h1 className="page-title">Where should we exclude?</h1>
        <p className="page-sub">Apply geographic and land use filters to refine your target universe.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Location rules
          </div>
          <span className="section-meta">Toggle as needed</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-card)', padding: '4px 24px' }}>
          <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>Exclude floodplain properties</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>Filters out parcels in FEMA-designated flood zones</div>
            </div>
            <Toggle
              checked={floodExclude}
              onChange={() =>
                setForm({
                  ...form,
                  risk: { ...form.risk, flood: !floodExclude },
                })
              }
            />
          </div>

          {isLandClass && (
            <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-sub)' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>Underimproved land only</div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>Land parcels where improvement value is less than 30% of land value</div>
              </div>
              <Toggle
                checked={underimprovedLand}
                onChange={() =>
                  setForm({
                    ...form,
                    underimproved_land: !underimprovedLand,
                  })
                }
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
