import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Map, Layers, Calendar, Settings,
  UserCircle, ChevronLeft, ChevronRight, Plus,
  TrendingUp, Flame, Target, Clock, Timer
} from 'lucide-react';
import { useDeals } from '../contexts/DealsContext';

const TZ = 'America/Chicago';

function getCTSecondsUntil2am() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
  const nowSecs = get('hour') * 3600 + get('minute') * 60 + get('second');
  const target = 2 * 3600;
  return nowSecs < target ? target - nowSecs : 86400 - nowSecs + target;
}

function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }

function useNextRunCountdown() {
  const [secs, setSecs] = useState(() => getCTSecondsUntil2am());

  useEffect(() => {
    const id = setInterval(() => setSecs(getCTSecondsUntil2am()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { hh: pad(h), mm: pad(m), ss: pad(s) };
}

function CountdownTile({ collapsed }) {
  const { hh, mm, ss } = useNextRunCountdown();

  if (collapsed) {
    return (
      <div className="left-panel-countdown-tile collapsed" title={`Next run in ${hh}:${mm}:${ss}`}>
        <Timer size={16} />
      </div>
    );
  }

  return (
    <div className="left-panel-countdown-tile">
      <div className="left-panel-countdown-label">
        <Timer size={11} />
        <span>Next Run In</span>
      </div>
      <div className="left-panel-countdown-clock">
        <span className="cd-num">{hh}</span>
        <span className="cd-sep">:</span>
        <span className="cd-num">{mm}</span>
        <span className="cd-sep">:</span>
        <span className="cd-num">{ss}</span>
      </div>
      <div className="left-panel-countdown-foot">2:00 AM CT</div>
    </div>
  );
}

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

export default function LeftPanel({ view, setView, kpis, onCreateBuyBox, unreadCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const { buyBoxes } = useDeals();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'map',       label: 'Map',       Icon: Map },
    { id: 'boxes',     label: 'Buy Boxes', Icon: Layers },
    { id: 'calendar',  label: 'Calendar',  Icon: Calendar },
  ];

  const responseRateValue = kpis?.response_rate != null && kpis.response_rate > 0
    ? `${kpis.response_rate}%`
    : '—';

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

        <div className="left-panel-countdown-wrap">
          <CountdownTile collapsed={collapsed} />
        </div>

        {!collapsed && (
          <>
            <div className="left-panel-divider" />

            <div className="left-panel-metric-grid">
              <MetricTile
                Icon={TrendingUp}
                label="New This Week"
                value={kpis?.new_this_week ?? '—'}
                accent="green"
              />
              <MetricTile
                Icon={Flame}
                label="Hot Deals"
                value={kpis?.hot_deals ?? '—'}
                accent="orange"
              />
              <MetricTile
                Icon={Target}
                label="Response Rate"
                value={responseRateValue}
                accent="blue"
              />
              <MetricTile
                Icon={Clock}
                label="Awaiting"
                value={kpis?.awaiting_response ?? '—'}
                accent="violet"
              />
            </div>
          </>
        )}

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

        {!collapsed && kpis?.run_history?.length > 0 && (
          <>
            <div className="left-panel-divider" />
            <div className="left-panel-run-history">
              <div className="left-panel-section-label">Last 7 Nights</div>
              <MiniBarChart data={kpis.run_history} />
            </div>
          </>
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
