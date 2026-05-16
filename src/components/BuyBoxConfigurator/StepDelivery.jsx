import { useEffect, useState } from 'react';

const SCHEDULES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function StepDelivery({ form, onChange }) {
  const [maxPerRun, setMaxPerRun] = useState(form.delivery_max_per_run || '5');

  useEffect(() => {
    setMaxPerRun(form.delivery_max_per_run || '5');
  }, [form.delivery_max_per_run]);

  const threshold = form.match_threshold ?? 0.8;
  const schedule = form.run_schedule || 'daily';

  const handleMaxPerRunChange = (e) => {
    const val = e.target.value;
    setMaxPerRun(val);
    if (val) {
      onChange({ delivery_max_per_run: Number(val) });
    }
  };

  return (
    <div className="bb-step">
      <h1 className="bb-step-title">Delivery Settings</h1>
      <p className="bb-step-subtitle">Configure how and when deals are delivered.</p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="bb-label" style={{ marginBottom: 4 }}>Match Threshold</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              className="bb-slider"
              min="0.5"
              max="1"
              step="0.05"
              value={threshold}
              onChange={e => onChange({ match_threshold: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 14, color: 'var(--ink-1)', minWidth: 50 }}>
              {Math.round(threshold * 100)}%
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            Only deliver properties that match at least this percent of your criteria.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="bb-label" style={{ marginBottom: 12 }}>Run Schedule</div>
        <div className="bb-tab-row">
          {SCHEDULES.map(sched => (
            <button
              key={sched.value}
              className={`bb-tab${schedule === sched.value ? ' active' : ''}`}
              onClick={() => onChange({ run_schedule: sched.value })}
            >
              {sched.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bb-field">
        <label className="bb-label">Max Deals Per Run</label>
        <input
          className="bb-input"
          type="number"
          min="1"
          max="50"
          value={maxPerRun}
          onChange={handleMaxPerRunChange}
          placeholder="5"
        />
      </div>
    </div>
  );
}
