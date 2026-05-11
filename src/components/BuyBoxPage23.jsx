function RangeInputs({ minV, maxV, onMin, onMax, unit, step = 1 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
      <div style={{ background: 'var(--surface-sub)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-input)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Min</span>
        <input
          type="number"
          step={step}
          value={minV}
          onChange={e => onMin(e.target.value)}
          style={{ flex: 1, background: 'none', border: 0, outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 14, textAlign: 'right' }}
        />
        <span style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
      </div>
      <span style={{ color: 'var(--fg-mute)', fontFamily: 'var(--font-mono)' }}>—</span>
      <div style={{ background: 'var(--surface-sub)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-input)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Max</span>
        <input
          type="number"
          step={step}
          value={maxV}
          onChange={e => onMax(e.target.value)}
          style={{ flex: 1, background: 'none', border: 0, outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 14, textAlign: 'right' }}
        />
        <span style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
      </div>
    </div>
  )
}

function RangeRow({ label, hint, children }) {
  return (
    <div style={{ padding: '18px 0', borderBottom: '1px solid var(--border-sub)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--font-mono)' }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div
      className={`toggle${checked ? ' on' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={onChange}
    />
  )
}

export function BuyBoxPage2({ form, setForm }) {
  const phys = form.phys || { sf_min: '', sf_max: '', acres_min: '', acres_max: '', year_min: '', year_max: '', stories_min: '', stories_max: '', units_min: '', units_max: '' }
  const fin = form.fin || { price_min: '', price_max: '', equity_preset: '', assessed_below_market: false }

  const setRange = (key, type, v) => {
    setForm({
      ...form,
      phys: { ...phys, [`${key}_${type}`]: v },
    })
  }

  const setFinRange = (key, type, v) => {
    setForm({
      ...form,
      fin: { ...fin, [`${key}_${type}`]: v },
    })
  }

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">02 / 06</span>
          <span className="sep" />
          <span>Property profile</span>
        </div>
        <h1 className="page-title">Spec the asset.</h1>
        <p className="page-sub">Physical envelope and financial floor. Leave anything blank to leave it unbounded.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Physical
          </div>
          <span className="section-meta">Ranges are inclusive</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-card)', padding: '4px 24px' }}>
          <RangeRow label="Building size" hint="square feet">
            <RangeInputs minV={phys.sf_min} maxV={phys.sf_max} onMin={v => setRange('sf', 'min', v)} onMax={v => setRange('sf', 'max', v)} unit="sqft" step={100} />
          </RangeRow>
          <RangeRow label="Lot size" hint="acres">
            <RangeInputs minV={phys.acres_min} maxV={phys.acres_max} onMin={v => setRange('acres', 'min', v)} onMax={v => setRange('acres', 'max', v)} unit="ac" step={0.1} />
          </RangeRow>
          <RangeRow label="Year built" hint="construction year">
            <RangeInputs minV={phys.year_min} maxV={phys.year_max} onMin={v => setRange('year', 'min', v)} onMax={v => setRange('year', 'max', v)} unit="yr" />
          </RangeRow>
          <RangeRow label="Stories" hint="select all that apply">
            <div className="preset-row">
              {['1', '2', '3', '4–6', '7+'].map(s => (
                <button
                  key={s}
                  className={`preset-chip${phys.stories_min === s ? ' on' : ''}`}
                  onClick={() => setRange('stories', 'min', phys.stories_min === s ? '' : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </RangeRow>
          <div style={{ padding: '18px 0' }}>
            <RangeRow label="Units" hint="for multifamily only">
              <RangeInputs minV={phys.units_min} maxV={phys.units_max} onMin={v => setRange('units', 'min', v)} onMax={v => setRange('units', 'max', v)} unit="units" />
            </RangeRow>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">B</span> Financial
          </div>
          <span className="section-meta">Public records + V1 valuation</span>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-card)', padding: '4px 24px' }}>
          <RangeRow label="Last sale price" hint="USD">
            <RangeInputs minV={fin.price_min} maxV={fin.price_max} onMin={v => setFinRange('price', 'min', v)} onMax={v => setFinRange('price', 'max', v)} unit="$" step={50000} />
          </RangeRow>
          <RangeRow label="Minimum owner equity" hint="percent of current value">
            <div className="preset-row">
              {['25%', '40%', '50%', '60%', '75%'].map(s => (
                <button
                  key={s}
                  className={`preset-chip${fin.equity_preset === s ? ' on' : ''}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      fin: { ...fin, equity_preset: fin.equity_preset === s ? '' : s },
                    })
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </RangeRow>
          <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>Assessed value below market value</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>Tax assessors value &lt; V1 estimated market value (under-assessed)</div>
            </div>
            <Toggle
              checked={fin.assessed_below_market}
              onChange={() =>
                setForm({
                  ...form,
                  fin: { ...fin, assessed_below_market: !fin.assessed_below_market },
                })
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export function BuyBoxPage3({ form, setForm }) {
  const owner = form.owner || { entity: '', occupancy: '', hold_min: '', hold_max: '', out_of_state: false }

  const Field = ({ label, options, value, onChange }) => (
    <div style={{ padding: '18px 0', borderBottom: '1px solid var(--border-sub)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 10 }}>{label}</div>
      <div className="preset-row">
        {options.map(o => (
          <button
            key={o.v}
            className={`preset-chip${value === o.v ? ' on' : ''}`}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">03 / 06</span>
          <span className="sep" />
          <span>Owner profile</span>
        </div>
        <h1 className="page-title">Who owns it?</h1>
        <p className="page-sub">The owner profile filters the universe to the people most likely to engage with you — long holders, absentee landlords, out-of-state heirs.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Ownership
          </div>
          <span className="section-meta">Public record + parcel inference</span>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-card)', padding: '4px 24px' }}>
          <Field
            label="Entity type"
            value={owner.entity}
            onChange={v => setForm({ ...form, owner: { ...owner, entity: v } })}
            options={[
              { v: 'any', label: 'Any' },
              { v: 'individual', label: 'Individual' },
              { v: 'llc', label: 'LLC / corp' },
              { v: 'trust', label: 'Trust' },
            ]}
          />
          <Field
            label="Occupancy"
            value={owner.occupancy}
            onChange={v => setForm({ ...form, owner: { ...owner, occupancy: v } })}
            options={[
              { v: 'any', label: 'Any' },
              { v: 'owner', label: 'Owner-occupied' },
              { v: 'absentee', label: 'Absentee' },
              { v: 'rented', label: 'Renting out' },
            ]}
          />
          <Field
            label="Hold period"
            value={owner.hold_min}
            onChange={v => setForm({ ...form, owner: { ...owner, hold_min: v } })}
            options={[
              { v: '', label: 'Any' },
              { v: '3', label: '3+ years' },
              { v: '5', label: '5+ years' },
              { v: '10', label: '10+ years' },
              { v: '20', label: '20+ years' },
            ]}
          />
          <div style={{ padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>Out-of-state owners only</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>Mailing address is in a different state than the property</div>
            </div>
            <Toggle
              checked={owner.out_of_state}
              onChange={() => setForm({ ...form, owner: { ...owner, out_of_state: !owner.out_of_state } })}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
