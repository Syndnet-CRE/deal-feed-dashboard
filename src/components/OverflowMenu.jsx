import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function OverflowMenu({ items, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`overflow-menu ${className}`} ref={ref}>
      <button
        className="overflow-menu-trigger"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="More options"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="overflow-menu-dropdown">
          {items.map((item, i) => (
            <button
              key={i}
              className={`overflow-menu-item ${item.disabled ? 'disabled' : ''}`}
              onClick={e => {
                e.stopPropagation();
                if (!item.disabled && item.onClick) item.onClick();
                setOpen(false);
              }}
              title={item.disabled ? item.disabledTip : undefined}
              disabled={item.disabled}
            >
              {item.icon && <span className="overflow-menu-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
