import { useState } from 'react';

const CHANNELS = [
  { value: 'phone',     label: 'Phone' },
  { value: 'email',     label: 'Email' },
  { value: 'text',      label: 'Text' },
  { value: 'in_person', label: 'In Person' },
  { value: 'mail',      label: 'Mail' },
  { value: 'other',     label: 'Other' },
];

const OUTCOMES = [
  { value: 'no_answer',          label: 'No Answer' },
  { value: 'left_voicemail',     label: 'Left Voicemail' },
  { value: 'spoke_briefly',      label: 'Spoke Briefly' },
  { value: 'interested',         label: 'Interested' },
  { value: 'not_interested',     label: 'Not Interested' },
  { value: 'follow_up',          label: 'Follow Up Scheduled' },
  { value: 'meeting_scheduled',  label: 'Meeting Scheduled' },
  { value: 'offer_discussed',    label: 'Offer Discussed' },
  { value: 'other',              label: 'Other' },
];

function todayLocal() {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}

export function ContactLogModal({ onSubmit, onClose, submitting }) {
  const [form, setForm] = useState({
    channel: 'phone',
    outcome: 'spoke_briefly',
    notes: '',
    contacted_at: todayLocal(),
  });

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({
      ...form,
      contacted_at: new Date(form.contacted_at).toISOString(),
    });
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 28px 24px',
          width: 420,
          maxWidth: '94vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Log Contact Attempt</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={form.contacted_at}
              onChange={e => set('contacted_at', e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--ink-1)', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Channel
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CHANNELS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('channel', c.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: '1.5px solid',
                    borderColor: form.channel === c.value ? 'var(--green)' : 'var(--border)',
                    background: form.channel === c.value ? 'rgba(91,204,72,0.12)' : 'transparent',
                    color: form.channel === c.value ? 'var(--green)' : 'var(--ink-2)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Outcome
            </label>
            <select
              value={form.outcome}
              onChange={e => set('outcome', e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--ink-1)', fontSize: 13 }}
            >
              {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="What was discussed? Any follow-up needed?"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--ink-1)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving…' : 'Log Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
