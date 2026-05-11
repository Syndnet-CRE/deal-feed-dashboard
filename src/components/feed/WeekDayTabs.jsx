import { useMemo } from 'react';

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

function weekOfMonth(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + first.getDay()) / 7);
}

function getWeekDays() {
  const today = startOfDay(new Date());
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function WeekDayTabs({ deals, selectedDay, onSelectDay }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(), []);

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long' });
  const weekNum = weekOfMonth(today);

  const countsByDay = useMemo(() => {
    const map = {};
    (deals || []).forEach(deal => {
      if (!deal.sentAt) return;
      const k = dayKey(new Date(deal.sentAt));
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [deals]);

  function handleClick(date) {
    if (selectedDay && sameDay(selectedDay, date)) {
      onSelectDay(null);
    } else {
      onSelectDay(date);
    }
  }

  return (
    <div className="week-day-tabs">
      <div className="week-day-tabs-label">
        <span className="week-day-tabs-month">{monthLabel}</span>
        <span className="week-day-tabs-sep">·</span>
        <span className="week-day-tabs-week">Week {weekNum}</span>
      </div>
      <div className="week-day-tabs-list">
        {weekDays.map((date, i) => {
          const isToday = sameDay(date, today);
          const isSelected = selectedDay ? sameDay(date, selectedDay) : false;
          const isFuture = date > today && !isToday;
          const count = countsByDay[dayKey(date)] || 0;

          return (
            <button
              key={i}
              className={[
                'week-day-tab',
                isSelected ? 'selected' : '',
                isToday ? 'today' : '',
                isFuture ? 'future' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !isFuture && handleClick(date)}
              disabled={isFuture}
              title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            >
              <span className="week-day-tab-abbr">{DAY_ABBR[i]}</span>
              {count > 0 ? (
                <span className="week-day-tab-count">{count}</span>
              ) : (
                <span className="week-day-tab-empty" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
