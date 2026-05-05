import { useState, useMemo } from 'react';
import { I } from './Icons';

const TZ = 'America/Chicago';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDealDateStr(deal) {
  if (deal.sent_at) return deal.sent_at.slice(0, 10);
  if (deal.days != null) {
    const d = new Date(Date.now() - deal.days * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function ctTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function pad2(n) { return String(n).padStart(2, '0'); }

export function CalendarModal({ deals, onClose, onOpenDeal }) {
  const now = new Date();
  const [mode, setMode] = useState('calendar');
  const [archiveDate, setArchiveDate] = useState(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = ctTodayStr();

  const dealsByDate = useMemo(() => {
    const map = {};
    for (const d of deals) {
      const ds = getDealDateStr(d);
      if (!ds) continue;
      if (!map[ds]) map[ds] = [];
      map[ds].push(d);
    }
    return map;
  }, [deals]);

  const memberSinceDate = useMemo(() => {
    const dates = Object.keys(dealsByDate).sort();
    return dates.length > 0 ? dates[0] : null;
  }, [dealsByDate]);

  const calendarCells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${pad2(month + 1)}-${pad2(d)}`;
      cells.push({ day: d, ds, count: (dealsByDate[ds] || []).length, isToday: ds === today, isMemberSince: ds === memberSinceDate });
    }
    return cells;
  }, [year, month, dealsByDate, today, memberSinceDate]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const openArchive = (ds) => {
    if (!(dealsByDate[ds] || []).length) return;
    setArchiveDate(ds);
    setMode('archive');
  };

  if (mode === 'archive' && archiveDate) {
    const archiveDeals = dealsByDate[archiveDate] || [];
    return (
      <div className="cal-overlay" onClick={onClose}>
        <div className="cal-modal" onClick={e => e.stopPropagation()}>
          <div className="cal-header">
            <button className="cal-back-btn" onClick={() => setMode('calendar')}>
              <I.Chevron size={14} style={{ transform: 'rotate(180deg)' }}/> Back
            </button>
            <div className="cal-title">{archiveDate}</div>
            <button className="cal-close-btn" onClick={onClose}><I.Close size={14}/></button>
          </div>
          <div className="cal-archive-list">
            {archiveDeals.map(d => (
              <button key={d.id} className="cal-archive-row" onClick={() => { onOpenDeal(d); onClose(); }}>
                <div className="cal-archive-addr">{d.addr}</div>
                <div className="cal-archive-meta">{d.city} · Score {d.score}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth}><I.Chevron size={14} style={{ transform: 'rotate(180deg)' }}/></button>
          <div className="cal-title">{MONTHS[month]} {year}</div>
          <button className="cal-nav-btn" onClick={nextMonth}><I.Chevron size={14}/></button>
          <button className="cal-close-btn" onClick={onClose}><I.Close size={14}/></button>
        </div>
        {memberSinceDate && (
          <div className="cal-member-since">Member since <strong>{memberSinceDate}</strong></div>
        )}
        <div className="cal-grid-head">
          {DOWS.map(d => <div key={d} className="cal-dow">{d}</div>)}
        </div>
        <div className="cal-grid">
          {calendarCells.map((cell, i) =>
            !cell ? <div key={`b${i}`} className="cal-cell cal-blank"/> : (
              <button
                key={cell.ds}
                className={`cal-cell${cell.isToday ? ' cal-today' : ''}${cell.count > 0 ? ' cal-has-deals' : ''}`}
                onClick={() => openArchive(cell.ds)}
                disabled={cell.count === 0}
              >
                <span className="cal-day-num">{cell.day}</span>
                {cell.count > 0 && <span className="cal-day-badge">{cell.count}</span>}
                {cell.isMemberSince && <span className="cal-member-dot" title="First deal"/>}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
