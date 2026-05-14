import { useMemo, useState, useRef, useEffect } from 'react';

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function MiniCalendar({ countsByDay, selectedDay, onSelectDay, onClose, anchorRef }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const containerRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      const clickedInsideCalendar = containerRef.current?.contains(e.target);
      const clickedAnchor = anchorRef?.current?.contains(e.target);
      if (!clickedInsideCalendar && !clickedAnchor) onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose, anchorRef]);

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const cells = [];
    for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const atCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mini-cal" ref={containerRef}>
      <div className="mini-cal-header">
        <button
          className="mini-cal-nav"
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="mini-cal-month-label">{monthLabel}</span>
        <button
          className="mini-cal-nav"
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          disabled={atCurrentMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mini-cal-dow-row">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="mini-cal-dow">{d}</div>
        ))}
      </div>

      <div className="mini-cal-grid">
        {days.map((date, i) => {
          if (!date) return <div key={i} className="mini-cal-day empty" />;
          const k = dayKey(date);
          const count = countsByDay[k] || 0;
          const isToday = sameDay(date, today);
          const isFuture = date > today && !isToday;
          const isSelected = selectedDay ? sameDay(date, selectedDay) : false;
          return (
            <button
              key={i}
              className={[
                'mini-cal-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isFuture ? 'future' : '',
                count > 0 ? 'has-deals' : '',
              ].filter(Boolean).join(' ')}
              disabled={isFuture}
              onClick={() => {
                onSelectDay(isSelected ? null : date);
                onClose();
              }}
              title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            >
              <span className="mini-cal-day-num">{date.getDate()}</span>
              {count > 0 && <span className="mini-cal-day-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
