import { useState } from 'react';
import {
  LayoutDashboard, Map, Layers, Calendar, Settings,
  UserCircle, ChevronLeft, ChevronRight, Plus, BarChart2
} from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';

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

export default function LeftPanel({ view, setView, kpis, onCreateBuyBox, unreadCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const { buyBoxes } = useDeals();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'map',       label: 'Map',       Icon: Map },
    { id: 'boxes',     label: 'Buy Boxes', Icon: Layers },
    { id: 'calendar',  label: 'Calendar',  Icon: Calendar },
  ];

  return (
    <aside className={`left-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="left-panel-inner">

        <button
          className="left-panel-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="left-panel-wordmark">
          {collapsed ? <span className="left-panel-n">N</span> : <span>Nightdrop.ai</span>}
        </div>

        <nav className="left-panel-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`left-panel-nav-item ${view === id ? 'active' : ''}`}
              onClick={() => setView(id)}
              title={collapsed ? label : undefined}
            >
              <span className="left-panel-nav-icon">
                <Icon size={18} />
                {id === 'dashboard' && unreadCount > 0 && (
                  <span className="left-panel-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
              {!collapsed && <span className="left-panel-nav-label">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="left-panel-divider" />

        <div className="left-panel-stats">
          {!collapsed && <div className="left-panel-section-label">Stats</div>}
          {[
            { label: 'New This Week', value: kpis?.new_this_week ?? '—' },
            { label: 'Hot Deals',     value: kpis?.hot_deals ?? '—' },
            { label: 'Response Rate', value: kpis?.response_rate != null && kpis.response_rate > 0 ? `${kpis.response_rate}%` : null },
            { label: 'Awaiting',      value: kpis?.awaiting_response ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="left-panel-stat-row" title={collapsed ? label : undefined}>
              {!collapsed && <span className="left-panel-stat-label">{label}</span>}
              <span className="left-panel-stat-value">
                {value === null ? <span className="muted">No outreach yet</span> : value}
              </span>
            </div>
          ))}
        </div>

        <div className="left-panel-divider" />

        <div className="left-panel-buy-boxes">
          {!collapsed && (
            <div className="left-panel-section-header">
              <span className="left-panel-section-label">Buy Boxes</span>
              <button className="left-panel-icon-btn" onClick={onCreateBuyBox} title="New buy box">
                <Plus size={13} />
              </button>
            </div>
          )}
          {buyBoxes.length === 0 ? (
            !collapsed && <div className="left-panel-empty">No active boxes</div>
          ) : (
            buyBoxes.map(bb => (
              <div key={bb.id} className="left-panel-bb-row" title={collapsed ? bb.label : undefined}>
                <StatusDot status={bb.status} />
                {!collapsed && (
                  <>
                    <span className="left-panel-bb-name">{bb.label}</span>
                    <span className="left-panel-bb-count muted">{bb.deal_count ?? ''}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="left-panel-divider" />

        {!collapsed && (
          <div className="left-panel-run-history">
            <div className="left-panel-section-label">Last 7 Nights</div>
            <MiniBarChart data={kpis?.run_history || []} />
          </div>
        )}

        <div className="left-panel-bottom">
          <button
            className={`left-panel-nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18} />
            {!collapsed && <span className="left-panel-nav-label">Settings</span>}
          </button>
          <button
            className="left-panel-nav-item"
            title={collapsed ? 'Account' : undefined}
          >
            <UserCircle size={18} />
            {!collapsed && <span className="left-panel-nav-label">Account</span>}
          </button>
        </div>

      </div>
    </aside>
  );
}
