import {
  LayoutDashboard, Map, Layers, Calendar, Settings,
  UserCircle, Plus, Users, Bookmark, Sparkles, Database,
  TrendingUp, Flame, Target, Clock,
  Inbox, Mail, Star,
} from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';
import TonightsRunCard from './feed/TonightsRunCard';
import { PipelineTimeline } from './PipelineTimeline';

const FILTERS = [
  { id: 'all',    label: 'All',    Icon: Inbox },
  { id: 'unread', label: 'Unread', Icon: Mail },
  { id: 'saved',  label: 'Saved',  Icon: Star },
  { id: 'hot',    label: 'Hot',    Icon: Flame },
];

function MetricTile({ Icon, label, value, accent }) {
  return (
    <div className={`metric-tile${accent ? ` accent-${accent}` : ''}`}>
      <div className="metric-tile-icon"><Icon size={14} /></div>
      <div className="metric-tile-value">{value}</div>
      <div className="metric-tile-label">{label}</div>
    </div>
  );
}

function StatusDot({ status }) {
  const colorMap = {
    active: 'var(--nightdrop-green-700)',
    Active: 'var(--nightdrop-green-700)',
    paused: 'var(--warning)',
    Paused: 'var(--warning)',
    pending: 'var(--info)',
    Pending: 'var(--info)',
    'coverage failed': 'var(--danger)',
    'Coverage Failed': 'var(--danger)',
  };
  return (
    <span
      className="left-panel-bb-dot"
      style={{ background: colorMap[status] || 'var(--space)' }}
      title={status}
    />
  );
}

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="left-panel-run-chart">
      {data.map((d, i) => (
        <div key={i} className="left-panel-run-bar-wrap" title={`${d.date}: ${d.count} deals`}>
          <div
            className="left-panel-run-bar"
            style={{ height: `${Math.max(4, Math.round((d.count / max) * 32))}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function LeftPanel({ view, setView, kpis, onCreateBuyBox, unreadCount, feedFilter, setFeedFilter }) {
  const { buyBoxes, deals } = useDeals();

  const filterCounts = {
    all:    deals.length,
    unread: deals.filter(d => !d.is_read).length,
    saved:  deals.filter(d => !!d.saved).length,
    hot:    deals.filter(d => d.feedback === 'hot' || (d.score || d.match_score || 0) >= 8).length,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      Icon: LayoutDashboard },
    { id: 'map',       label: 'Map',            Icon: Map },
    { id: 'boxes',     label: 'Buy Boxes',      Icon: Layers },
    { id: 'calendar',  label: 'Calendar',       Icon: Calendar },
    { id: 'contacts',  label: 'My Contacts',    Icon: Users },
    { id: 'saved',     label: 'My Saved Deals', Icon: Bookmark },
    { id: 'trending',  label: "What's Trending", Icon: Sparkles },
    { id: 'data',      label: 'Data',           Icon: Database },
  ];

  const responseRateValue = kpis?.response_rate != null && kpis.response_rate > 0
    ? `${kpis.response_rate}%`
    : '—';

  return (
    <aside className="left-panel">
      <div className="left-panel-inner">

        <nav className="left-panel-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`left-panel-nav-item ${view === id ? 'active' : ''}`}
              onClick={() => setView(id)}
            >
              <span className="left-panel-nav-icon">
                <Icon size={18} />
              </span>
              <span className="left-panel-nav-label">{label}</span>
              {id === 'dashboard' && unreadCount > 0 && (
                <span className="left-panel-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="left-panel-divider" />

        <div className="left-panel-metric-grid">
          <MetricTile Icon={TrendingUp} label="New This Week" value={kpis?.new_this_week ?? '—'} accent="green" />
          <MetricTile Icon={Flame}      label="Hot Deals"     value={kpis?.hot_deals ?? '—'}      accent="orange" />
          <MetricTile Icon={Target}     label="Response Rate" value={responseRateValue}            accent="blue" />
          <MetricTile Icon={Clock}      label="Awaiting"      value={kpis?.awaiting_response ?? '—'} accent="violet" />
        </div>

        <div className="left-panel-divider" />

        <div className="left-panel-buy-boxes">
          <div className="left-panel-section-header">
            <span className="left-panel-section-label">Buy Boxes</span>
            <button className="left-panel-icon-btn" onClick={onCreateBuyBox} title="New buy box">
              <Plus size={13} />
            </button>
          </div>
          {buyBoxes.length === 0 ? (
            <div className="left-panel-empty">No active boxes</div>
          ) : (
            buyBoxes.map(bb => (
              <div key={bb.id} className="left-panel-bb-row">
                <StatusDot status={bb.status} />
                <span className="left-panel-bb-name">{bb.label}</span>
                <span className="left-panel-bb-count muted">{bb.deal_count ?? ''}</span>
              </div>
            ))
          )}
        </div>

        {kpis?.run_history?.length > 0 && (
          <>
            <div className="left-panel-divider" />
            <div className="left-panel-run-history">
              <div className="left-panel-section-label">Last 7 Nights</div>
              <MiniBarChart data={kpis.run_history} />
            </div>
          </>
        )}

        {view === 'dashboard' && setFeedFilter && (
          <div className="left-panel-narrow-only">
            <div className="left-panel-divider" />
            <div className="left-panel-nextrun">
              <PipelineTimeline mode="countdown" />
            </div>

            <div className="left-panel-divider" />
            <div className="left-panel-buy-boxes">
              <div className="left-panel-section-header">
                <span className="left-panel-section-label">Filter</span>
              </div>
              <div className="left-panel-filter-chips">
                {FILTERS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    className={`feed-filter-chip${feedFilter === id ? ' active' : ''}`}
                    onClick={() => setFeedFilter(id)}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                    <span className="feed-filter-chip-count">{filterCounts[id]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="left-panel-divider" />
            <div className="left-panel-tonights-run">
              <TonightsRunCard kpis={kpis} />
            </div>
          </div>
        )}

        <div className="left-panel-bottom">
          <button
            className={`left-panel-nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <Settings size={18} />
            <span className="left-panel-nav-label">Settings</span>
          </button>
          <button className="left-panel-nav-item">
            <UserCircle size={18} />
            <span className="left-panel-nav-label">Account</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
