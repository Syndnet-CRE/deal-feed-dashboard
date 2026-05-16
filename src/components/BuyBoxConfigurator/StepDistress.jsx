import { DISTRESS_SIGNAL_OPTIONS as DISTRESS_SIGNALS } from '../../lib/buyBoxTaxonomy';

export default function StepDistress({ form, onChange }) {
  const toggleSignal = (value) => {
    const current = form.distress_signals || [];
    const updated = current.includes(value)
      ? current.filter(s => s !== value)
      : [...current, value];
    onChange({ distress_signals: updated });
  };

  const signals = form.distress_signals || [];
  const matchMode = form.distress_match_mode || 'or';

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Distress Signals</h1>
      <p className="bb-step-subtitle">Match properties showing signs of distress.</p>

      <div style={{ marginBottom: 24 }}>
        <div className="bb-label" style={{ marginBottom: 12 }}>Signals</div>
        <div className="bb-signal-grid">
          {DISTRESS_SIGNALS.map(signal => (
            <button
              key={signal.value}
              className={`bb-signal-chip${signals.includes(signal.value) ? ' selected' : ''}`}
              onClick={() => toggleSignal(signal.value)}
            >
              {signal.label}
            </button>
          ))}
        </div>
      </div>

      {signals.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="bb-label" style={{ marginBottom: 12 }}>Match Mode</div>
          <div className="bb-tab-row" style={{ maxWidth: 220 }}>
            <button
              className={`bb-tab${matchMode === 'or' ? ' active' : ''}`}
              onClick={() => onChange({ distress_match_mode: 'or' })}
            >
              Match ANY
            </button>
            <button
              className={`bb-tab${matchMode === 'and' ? ' active' : ''}`}
              onClick={() => onChange({ distress_match_mode: 'and' })}
            >
              Match ALL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
