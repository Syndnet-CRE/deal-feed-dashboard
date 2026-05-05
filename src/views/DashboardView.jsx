import { useState, useMemo } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { useDealState } from '../contexts/DealStateContext';
import { I } from '../components/Icons';
import { DealCard } from '../components/DealComponents';
import { DealMap } from '../components/DealMap';
import { PipelineTimeline } from '../components/PipelineTimeline';
import { CalendarModal } from '../components/CalendarModal';
import { fmtRelativeTime } from '../lib/format';

const TZ = 'America/Chicago';
const SESSION_NOW = Date.now();

function ctTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function getDealDateStr(deal) {
  if (deal.sent_at) return deal.sent_at.slice(0, 10);
  if (deal.days != null) {
    const d = new Date(Date.now() - deal.days * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function buildWeekDays() {
  const todayStr = ctTodayStr();
  const [y, m, d] = todayStr.split('-').map(Number);
  const today = new Date(y, m - 1, d);
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((name, i) => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + mondayOffset + i);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    return { name, ds };
  });
}

function StatCard({ label, num, trend, sub }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="num">{num}</div>
      <div className={`trend ${trend || 'flat'}`}>
        {trend === 'up' && <I.Trend size={12}/>}
        <span>{sub}</span>
      </div>
    </div>
  );
}

export function DashboardView({ onOpenDeal, onNavigateBoxes, onSetView, selectedId }) {
  const { deals, buyBoxes, contacts, loading } = useDeals();
  const { getDealState } = useDealState();
  const [showCalendar, setShowCalendar] = useState(false);

  const today = useMemo(() => ctTodayStr(), []);
  const weekDays = useMemo(() => buildWeekDays(), []);

  const [activeTab, setActiveTab] = useState(() => {
    const todayDay = buildWeekDays().find(w => w.ds === ctTodayStr());
    return todayDay ? todayDay.name : 'Mon';
  });

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

  const archivedDeals = useMemo(
    () => deals.filter(d => getDealState(d.id) === 'archived'),
    [deals, getDealState]
  );

  const tabDeals = useMemo(() => {
    if (activeTab === 'pipeline') return archivedDeals;
    const day = weekDays.find(w => w.name === activeTab);
    return day ? (dealsByDate[day.ds] || []) : [];
  }, [activeTab, archivedDeals, weekDays, dealsByDate]);

  const newThisWeek = deals.filter(d => d.days != null && d.days <= 7).length;
  const contactedCount = deals.filter(d => (contacts[d.id] || []).length > 0).length;
  const responseRate = deals.length > 0 ? Math.round(contactedCount / deals.length * 100) : 0;
  const hotDeals = deals.filter(d => d.feedback === 'hot' && getDealState(d.id) !== 'dead').length;

  const awaitingCount = useMemo(() => {
    return deals.filter(d => {
      const dc = contacts[d.id] || [];
      if (dc.length === 0) return false;
      return Math.floor((SESSION_NOW - new Date(dc[0].contacted_at).getTime()) / 86400000) >= 7;
    }).length;
  }, [deals, contacts]);

  const mapDeals = useMemo(() => (
    [...deals].filter(d => d.lat && d.lng).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 15)
  ), [deals]);

  const activityFeed = useMemo(() => {
    const entries = [];
    for (const [dealId, dealContacts] of Object.entries(contacts)) {
      const deal = deals.find(d => String(d.id) === dealId);
      if (!deal) continue;
      for (const c of dealContacts) entries.push({ ...c, dealId, dealAddr: deal.addr });
    }
    return entries.sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at)).slice(0, 5);
  }, [contacts, deals]);

  const isReady = buyBoxes.some(b => b.status === 'Active');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">
            {loading ? 'Loading…' : `${deals.length} total deals across all buy boxes`}
          </div>
        </div>
        <div className="spaced">
          <span className={`pill ${isReady ? 'green' : 'amber'}`}>
            <span className="pip"/>
            {isReady ? 'Ready for Midnight Run' : 'No Active Buy Boxes'}
          </span>
          <button className="btn icon" onClick={() => setShowCalendar(true)} aria-label="Deal calendar">
            <I.Calendar size={14}/>
          </button>
        </div>
      </div>

      <PipelineTimeline/>

      <div className="stat-grid stat-grid-5">
        <StatCard label="New This Week"     num={loading ? '…' : newThisWeek}          trend="up"   sub="deals delivered ≤ 7 days"/>
        <StatCard label="Contacted"         num={loading ? '…' : contactedCount}        trend="flat" sub="deals with contact log"/>
        <StatCard label="Response Rate"     num={loading ? '…' : `${responseRate}%`}    trend="flat" sub="contacted vs. total"/>
        <StatCard label="Hot Deals"         num={loading ? '…' : hotDeals}              trend="up"   sub="marked hot, not dead"/>
        <StatCard label="Awaiting Response" num={loading ? '…' : awaitingCount}         trend="flat" sub="contacted, no reply 7+ days"/>
      </div>

      {activityFeed.length > 0 && (
        <div className="panel-card" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Recent Activity</div>
              <div className="panel-sub">Your last contact log entries</div>
            </div>
          </div>
          <div>
            {activityFeed.map((entry, i) => {
              const rel = fmtRelativeTime(entry.contacted_at);
              return (
                <button
                  key={i}
                  onClick={() => onOpenDeal({ id: entry.dealId })}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                    padding: '10px 16px', width: '100%',
                    borderTop: i === 0 ? 'none' : '1px solid var(--hairline-soft)',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>{entry.dealAddr}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="tag" style={{ fontSize: 10 }}>{entry.channel}</span>
                      {entry.outcome}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>
                    {rel ? rel.label : '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <div className="panel-title">Deals</div>
              <div className="panel-sub">Click any deal to open detail</div>
            </div>
          </div>

          <div className="week-tabs">
            {weekDays.map(w => (
              <button
                key={w.name}
                className={`week-tab${activeTab === w.name ? ' active' : ''}${w.ds === today ? ' today' : ''}`}
                onClick={() => setActiveTab(w.name)}
              >
                {w.name}
                {(dealsByDate[w.ds] || []).length > 0 && (
                  <span className="week-tab-badge">{(dealsByDate[w.ds] || []).length}</span>
                )}
              </button>
            ))}
            <div className="week-tab-sep"/>
            <button
              className={`week-tab${activeTab === 'pipeline' ? ' active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              Pipeline
              {archivedDeals.length > 0 && <span className="week-tab-badge">{archivedDeals.length}</span>}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 24, color: 'var(--ink-4)', fontSize: 13 }}>Loading deals…</div>
          ) : tabDeals.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>
                {activeTab === 'pipeline'
                  ? 'No archived deals. Use the action menu on a deal card to archive.'
                  : 'No deals delivered this day.'}
              </div>
              {activeTab !== 'pipeline' && onNavigateBoxes && (
                <button className="btn sm" onClick={onNavigateBoxes}><I.Boxes size={12}/> View Buy Boxes</button>
              )}
            </div>
          ) : (
            <div>
              {tabDeals.map(d => (
                <DealCard key={d.id} deal={d} selected={selectedId === d.id} onClick={() => onOpenDeal(d)}/>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card" style={{ position: 'sticky', top: 0 }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Deal Map · Top Matches</div>
              <div className="panel-sub">{mapDeals.length} deals mapped by score</div>
            </div>
            <button className="btn sm" onClick={() => onSetView('map')}><I.External size={11}/> Open Map</button>
          </div>
          <div style={{ height: 280, borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            {!loading && (
              <DealMap deals={mapDeals} selectedId={selectedId} withPopup={true} onClickDeal={onOpenDeal} mapStyle="dark"/>
            )}
          </div>
        </div>
      </div>

      {showCalendar && (
        <CalendarModal deals={deals} onClose={() => setShowCalendar(false)} onOpenDeal={onOpenDeal}/>
      )}
    </div>
  );
}
