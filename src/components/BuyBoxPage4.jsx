import { useRef } from 'react'
import { Ic } from './buybox-icons'

const SIGNALS = [
  { id: 'foreclosure', icon: 'gavel', title: 'In active foreclosure', count: 84_200, desc: 'Notice of default, lis pendens, or scheduled auction within the next 180 days.' },
  { id: 'ltv', icon: 'ltv', title: 'High LTV (80%+)', count: 412_800, desc: 'Outstanding loan balance exceeds 80% of current estimated value.' },
  { id: 'arm', icon: 'arm', title: 'ARM or variable rate', count: 226_400, desc: 'Mortgage is adjustable-rate or has a balloon payment within 24 months.' },
  { id: 'equity', icon: 'equity', title: 'Equity threshold met', count: 1_184_700, desc: 'Owner equity falls between your minimum and maximum equity bands.' },
  { id: 'longhold', icon: 'clock', title: 'Long hold, no refi', count: 318_900, desc: 'Owned 10+ years with no mortgage activity in the last 7 years.' },
]

function Slider({ value, min, max, onChange, format = v => v, ticks }) {
  const pct = ((value - min) / (max - min)) * 100
  const ref = useRef(null)

  const drag = e => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()

    const move = ev => {
      const px = (ev.clientX || (ev.touches && ev.touches[0].clientX) || 0) - rect.left
      const p = Math.max(0, Math.min(1, px / rect.width))
      onChange(Math.round(min + p * (max - min)))
    }

    move(e)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <>
      <div className="slider" ref={ref} onMouseDown={drag}>
        <div className="slider-fill" style={{ width: pct + '%' }} />
        <div className="slider-thumb" style={{ left: pct + '%' }} />
      </div>
      {ticks && (
        <div className="slider-tick-row">
          {ticks.map(t => (
            <span key={t} className="slider-tick">
              {t}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export function BuyBoxPage4({ form, setForm }) {
  const signals = form.signals || []
  const logic = form.logic || 'OR'
  const risk = form.risk || { climate: 5, flood: false, wildfire: 5, wildfireOpen: false, heat: 5, heatOpen: false }

  const toggle = id => {
    setForm({
      ...form,
      signals: signals.includes(id) ? signals.filter(x => x !== id) : [...signals, id],
    })
  }

  return (
    <div className="page-fade">
      <header className="page-head">
        <div className="page-eyebrow">
          <span className="mono-step mono">04/06</span>
          <span className="sep" />
          <span>Distress & risk</span>
        </div>
        <h1 className="page-title">What does motivated look like?</h1>
        <p className="page-sub">Pick the distress signals that should qualify a property, then dial in how much climate risk you're willing to underwrite.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">A</span> Distress signals
          </div>
          <span className="section-meta">
            {signals.length} of {SIGNALS.length} active
          </span>
        </div>

        <div className="signal-grid">
          {SIGNALS.map(s => {
            const on = signals.includes(s.id)
            const Icon = Ic[s.icon]
            return (
              <button
                key={s.id}
                className={`signal${on ? ' on' : ''}`}
                onClick={() => toggle(s.id)}
              >
                <span className="signal-toggle" />
                <div className="signal-body">
                  <div className="signal-head">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon width="14" height="14" />
                      <span className="signal-title">{s.title}</span>
                    </span>
                    <span className="signal-count">{(s.count / 1000).toFixed(1)}K in geo</span>
                  </div>
                  <div className="signal-desc">{s.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="logic-row">
          <div className="logic-row-text">
            Match logic - properties must satisfy <strong>{logic === 'AND' ? 'every active signal' : 'any one active signal'}</strong>.
          </div>
          <div className="seg">
            <button className={`seg-item${logic === 'AND' ? ' active' : ''}`} onClick={() => setForm({ ...form, logic: 'AND' })}>
              AND
            </button>
            <button className={`seg-item${logic === 'OR' ? ' active' : ''}`} onClick={() => setForm({ ...form, logic: 'OR' })}>
              OR
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-title">
            <span className="section-title-num">B</span> Risk tolerance
          </div>
          <span className="section-meta">Climate & natural hazard</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-sub)', borderRadius: 'var(--r-card)', padding: '20px 24px' }}>
          <div className="slider-row">
            <div className="slider-head">
              <span className="slider-name">
                Maximum climate risk score <span className="hint">First Street composite, 1-10</span>
              </span>
              <span className="slider-value">{risk.climate} / 10</span>
            </div>
            <Slider value={risk.climate} min={1} max={10} onChange={v => setForm({ ...form, risk: { ...risk, climate: v } })} ticks={['1 Low', '3', '5', '7', '10 Severe']} />
          </div>

          <div className="toggle-row">
            <div className="toggle-row-text">
              Exclude floodplain properties
              <span className="hint">FEMA AE / VE zones and 100-year floodplain overlap</span>
            </div>
            <div
              className={`toggle${risk.flood ? ' on' : ''}`}
              onClick={() => setForm({ ...form, risk: { ...risk, flood: !risk.flood } })}
            />
          </div>

          <div className={`expand${risk.wildfireOpen ? ' open' : ''}`} style={{ borderTop: '1px solid var(--border-sub)' }}>
            <div
              className="expand-head"
              style={{ cursor: 'pointer' }}
              onClick={() => setForm({ ...form, risk: { ...risk, wildfireOpen: !risk.wildfireOpen } })}
            >
              <span>Wildfire risk threshold</span>
              <span className="row" style={{ gap: 8 }}>
                <span className="slider-value" style={{ fontSize: 12 }}>
                  ≤ {risk.wildfire} / 10
                </span>
                <span className="chev">
                  <Ic.chev width="12" height="12" />
                </span>
              </span>
            </div>
            {risk.wildfireOpen && (
              <div className="expand-body">
                <Slider value={risk.wildfire} min={1} max={10} onChange={v => setForm({ ...form, risk: { ...risk, wildfire: v } })} ticks={['1', '3', '5', '7', '10']} />
              </div>
            )}
          </div>

          <div className={`expand${risk.heatOpen ? ' open' : ''}`} style={{ borderTop: '1px solid var(--border-sub)' }}>
            <div
              className="expand-head"
              style={{ cursor: 'pointer' }}
              onClick={() => setForm({ ...form, risk: { ...risk, heatOpen: !risk.heatOpen } })}
            >
              <span>Extreme heat threshold</span>
              <span className="row" style={{ gap: 8 }}>
                <span className="slider-value" style={{ fontSize: 12 }}>
                  ≤ {risk.heat} / 10
                </span>
                <span className="chev">
                  <Ic.chev width="12" height="12" />
                </span>
              </span>
            </div>
            {risk.heatOpen && (
              <div className="expand-body">
                <Slider value={risk.heat} min={1} max={10} onChange={v => setForm({ ...form, risk: { ...risk, heat: v } })} ticks={['1', '3', '5', '7', '10']} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
