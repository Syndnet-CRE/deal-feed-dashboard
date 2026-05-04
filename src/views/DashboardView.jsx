import { useMemo } from 'react';
import { useDeals } from '../contexts/DealsContext';
import { I } from '../components/Icons';
import { DealCard } from '../components/DealComponents';
import { DealMap } from '../components/DealMap';
import { fmtRelativeTime } from '../lib/format';

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
  const { deals, contacts, loading } = useDeals();

  const recentDeals = deals.slice(0, 8);

  const newThisWeek = deals.filter(d => d.days != null && d.days <= 7).length;
  const contactedCount = deals.filter(d => (contacts[d.id] || []).length > 0).length;
  const hotMatchCount = deals.filter(d => (d.score || 0) >= 80).length;
  const awaitingCount = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return deals.filter(d => {
      if (d.status !== 'Contacted') return false;
      const dc = contacts[d.id] || [];
      if (dc.length === 0) return true;
      return Math.floor((now - new Date(dc[0].contacted_at).getTime()) / 86400000) >= 7;
    }).length;
  }, [deals, contacts]);

  const mapDeals = useMemo(() => (
    [...deals]
      .filter(d => d.lat && d.lng)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 15)
  ), [deals]);

  const activityFeed = useMemo(() => {
    const entries = [];
    for (const [dealId, dealContacts] of Object.entries(contacts)) {
      const deal = deals.find(d => String(d.id) === dealId);
      if (!deal) continue;
      for (const c of dealContacts) {
        entries.push({ ...c, dealId, dealAddr: deal.addr });
      }
    }
    return entries
      .sort((a, b) => new Date(b.contacted_at) - new Date(a.contacted_at))
      .slice(0, 5);
  }, [contacts, deals]);

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
          <span className="pill green"><span className="pip"/>Run Healthy</span>
          <button className="btn"><I.Calendar size={13}/> This Week</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="New This Week"
          num={loading ? '…' : newThisWeek}
          trend="up"
          sub="deals delivered ≤ 7 days"
        />
        <StatCard
          label="Contacted"
          num={loading ? '…' : contactedCount}
          trend="flat"
          sub="deals with contact log"
        />
        <StatCard
          label="Hot Matches"
          num={loading ? '…' : hotMatchCount}
          trend="up"
          sub="distress score ≥ 80"
        />
        <StatCard
          label="Awaiting Response"
          num={loading ? '…' : awaitingCount}
          trend="flat"
          sub="contacted, no reply 7+ days"
        />
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
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    gap: 8, padding: '10px 16px', width: '100%',
                    borderTop: i === 0 ? 'none' : '1px solid var(--hairline-soft)',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>
                      {entry.dealAddr}
                    </div>
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
              <div className="panel-title">Recent Deals</div>
              <div className="panel-sub">Most recent across all buy boxes · click to open detail</div>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--ink-4)', fontSize: 13 }}>Loading deals…</div>
          ) : recentDeals.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>
                No deals delivered yet. Your first nightly run will populate this.
              </div>
              {onNavigateBoxes && (
                <button className="btn sm" onClick={onNavigateBoxes}><I.Boxes size={12}/> View Buy Boxes</button>
              )}
            </div>
          ) : (
            <div>
              {recentDeals.map(d => (
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
              <DealMap
                deals={mapDeals}
                selectedId={selectedId}
                withPopup={true}
                onClickDeal={onOpenDeal}
                mapStyle="dark"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
