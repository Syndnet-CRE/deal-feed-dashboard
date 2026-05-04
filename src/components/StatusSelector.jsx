import { useState, useRef, useEffect } from 'react';

const STATUS_CONFIG = {
  new:          { label: 'New',          color: 'var(--ink-3)' },
  researched:   { label: 'Researched',   color: 'var(--warning)' },
  contacted:    { label: 'Contacted',    color: '#60A5FA' },
  negotiating:  { label: 'Negotiating',  color: 'var(--green)' },
  offer_made:   { label: 'Offer Made',   color: '#A78BFA' },
  dead:         { label: 'Dead',         color: 'var(--danger)' },
};

const STATUSES = Object.keys(STATUS_CONFIG);

export function StatusSelector({ status = 'new', onChangeStatus, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 13 : 11;
  const padding  = size === 'sm' ? '2px 7px' : size === 'lg' ? '5px 12px' : '3px 9px';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="status-pill"
        onClick={() => onChangeStatus && setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize,
          padding,
          borderRadius: 20,
          border: `1.5px solid ${cfg.color}`,
          background: `${cfg.color}18`,
          color: cfg.color,
          fontWeight: 600,
          cursor: onChangeStatus ? 'pointer' : 'default',
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        {cfg.label}
        {onChangeStatus && <span style={{ fontSize: fontSize - 1, opacity: 0.6 }}>▾</span>}
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 200,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 148,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          {STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                role="option"
                aria-selected={s === status}
                onClick={() => { onChangeStatus(s); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 14px',
                  background: s === status ? 'var(--surface-3)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: c.color,
                  fontSize: 12,
                  fontWeight: s === status ? 700 : 500,
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
