import { Ic } from './buybox-icons'

const SIGNALS = [
  { id: 'foreclosure', icon: 'gavel', title: 'In active foreclosure', count: 84_200, desc: 'Notice of default, lis pendens, or scheduled auction within the next 180 days.' },
  { id: 'ltv', icon: 'ltv', title: 'High LTV (80%+)', count: 412_800, desc: 'Outstanding loan balance exceeds 80% of current estimated value.' },
  { id: 'arm', icon: 'arm', title: 'ARM or variable rate', count: 226_400, desc: 'Mortgage is adjustable-rate or has a balloon payment within 24 months.' },
  { id: 'equity', icon: 'equity', title: 'Equity threshold met', count: 1_184_700, desc: 'Owner equity falls between your minimum and maximum equity bands.' },
  { id: 'longhold', icon: 'clock', title: 'Long hold, no refi', count: 318_900, desc: 'Owned 10+ years with no mortgage activity in the last 7 years.' },
]


export function BuyBoxPage4({ form, setForm }) {
  const signals = form.signals || []
  const logic = form.logic || 'OR'

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
          <span>Distress signals</span>
        </div>
        <h1 className="page-title">What does motivated look like?</h1>
        <p className="page-sub">Pick the distress signals that should qualify a property.</p>
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

    </div>
  )
}
