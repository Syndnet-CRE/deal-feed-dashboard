import { useMemo, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import MiniCalendar from './MiniCalendar';

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

function getRollingWeek() {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function useDaySeenState(subId) {
  const prefix = `dealfeed.day-seen.${subId}:`;

  const [seenDays, setSeenDays] = useState(() => {
    if (!subId) return new Set();
    return new Set(
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .map(k => k.slice(prefix.length))
    );
  });

  const markDaySeen = useCallback((key) => {
    if (!subId) return;
    const lsKey = `${prefix}${key}`;
    if (localStorage.getItem(lsKey) === 'true') return;
    localStorage.setItem(lsKey, 'true');
    setSeenDays(prev => new Set([...prev, key]));
  }, [subId, prefix]);

  return { seenDays, markDaySeen };
}

export default function WeekDayTabs({ deals, selectedDay, onSelectDay }) {
  const { subscriber } = useAuth() || {};
  const subId = subscriber?.id ?? '';
  const { seenDays, markDaySeen } = useDaySeenState(subId);

  const today = useMemo(() => startOfDay(new Date()), []);
  const weekDays = useMemo(() => getRollingWeek(), []);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const labelRef = useRef(null);

  const rangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const sm = start.toLocaleDateString('en-US', { month: 'short' });
    const em = end.toLocaleDateString('en-US', { month: 'short' });
    return sm === em
      ? `${sm} ${start.getDate()} – ${end.getDate()}`
      : `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
  }, [weekDays]);

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
    const k = dayKey(date);
    markDaySeen(k);
    if (selectedDay && sameDay(selectedDay, date)) {
      onSelectDay(null);
    } else {
      onSelectDay(date);
    }
  }

  return (
    <div className="week-day-tabs">
      <div className="week-day-tabs-label" ref={labelRef}>
        <span
          className="week-day-tabs-month"
          onClick={() => setCalendarOpen(v => !v)}
          title="Open calendar"
        >
          {rangeLabel}
        </span>
        {calendarOpen && (
          <MiniCalendar
            countsByDay={countsByDay}
            selectedDay={selectedDay}
            onSelectDay={(date) => {
              if (date) markDaySeen(dayKey(date));
              onSelectDay(date);
            }}
            onClose={() => setCalendarOpen(false)}
            anchorRef={labelRef}
          />
        )}
      </div>

      <div className="week-day-tabs-list">
        {weekDays.map((date, i) => {
          const isToday = sameDay(date, today);
          const isSelected = selectedDay ? sameDay(date, selectedDay) : false;
          const isFuture = date > today && !isToday;
          const k = dayKey(date);
          const count = countsByDay[k] || 0;
          const seen = seenDays.has(k);

          const badgeClass = count > 0
            ? seen ? 'week-day-tab-count seen' : 'week-day-tab-count unread'
            : null;

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
              <span className="week-day-tab-abbr">{DAY_ABBR[date.getDay()]}</span>
              {count > 0 ? (
                <span className={badgeClass}>{count}</span>
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
