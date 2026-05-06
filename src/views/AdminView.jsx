import { useState, useEffect, useCallback } from 'react';
import { Activity, Play, RefreshCw, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import '../styles/admin.css';

const STATUS_PILL = {
  active:         'pill-green',
  trial:          'pill-amber',
  paused:         'pill-gray',
  cancelled:      'pill-red',
  pending_invite: 'pill-blue',
};

const RUN_PILL = {
  completed: 'pill-green',
  running:   'pill-amber',
  failed:    'pill-red',
};

function fmtDuration(started, completed) {
  if (!started || !completed) return '—';
  const s = Math.floor((new Date(completed) - new Date(started)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Badge({ status, map }) {
  return <span className={`adm-badge ${map[status] || 'pill-gray'}`}>{status || '—'}</span>;
}

function RunsStrip({ runs, loading, onTrigger, triggering, onRefresh }) {
  return (
    <div className="adm-runs-strip">
      <div className="adm-runs-header">
        <Activity size={13} />
        <span className="adm-runs-title">Agent Runs</span>
        <button className="adm-icon-btn" onClick={onRefresh} title="Refresh"><RefreshCw size={12} /></button>
        <button className="adm-trigger-btn" onClick={onTrigger} disabled={triggering}>
          <Play size={11} />
          {triggering ? 'Starting…' : 'Run Now'}
        </button>
      </div>
      <div className="adm-runs-list">
        {loading && <span className="adm-run-empty">Loading…</span>}
        {!loading && runs.length === 0 && <span className="adm-run-empty">No runs yet</span>}
        {runs.slice(0, 8).map(r => (
          <div key={r.id} className="adm-run-row">
            <Badge status={r.status} map={RUN_PILL} />
            <span className="adm-run-date">{fmtDate(r.run_date || r.started_at)}</span>
            <span className="adm-run-stat">{r.deals_generated ?? 0} deals</span>
            <span className="adm-run-stat">{r.subscribers_processed ?? 0} subs</span>
            <span className="adm-run-dur">{fmtDuration(r.started_at, r.completed_at)}</span>
            {Array.isArray(r.errors) && r.errors.length > 0 && (
              <span className="adm-run-err">{r.errors.length} err</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ sub }) {
  const fields = [
    ['Email',          sub.email],
    ['Full name',      sub.full_name || '—'],
    ['First name',     sub.first_name || '—'],
    ['Last name',      sub.last_name || '—'],
    ['Phone',          sub.phone || '—'],
    ['Company',        sub.company || '—'],
    ['Role',           sub.role || '—'],
    ['Status',         <Badge key="st" status={sub.status} map={STATUS_PILL} />],
    ['Trial ends',     fmtDate(sub.trial_ends_at)],
    ['Last login',     fmtDateTime(sub.last_login_at)],
    ['Created',        fmtDateTime(sub.created_at)],
    ['Stripe customer', sub.stripe_customer_id || '—'],
    ['Stripe sub',     sub.stripe_sub_id || '—'],
  ];
  return (
    <div className="adm-profile-grid">
      {fields.map(([label, val]) => (
        <div key={label} className="adm-profile-row">
          <span className="adm-profile-label">{label}</span>
          <span className="adm-profile-val">{val}</span>
        </div>
      ))}
    </div>
  );
}

function BuyBoxesTab({ boxes }) {
  if (!boxes.length) return <div className="adm-empty">No buy boxes configured</div>;
  return (
    <div className="adm-boxes-list">
      {boxes.map(b => {
        const geo = [
          ...(b.geo_states || []),
          ...(b.geo_counties || []),
          ...(b.geo_cities || []),
          b.geo_radius_address ? `${b.geo_radius_miles}mi radius` : null,
        ].filter(Boolean).join(', ') || '—';

        return (
          <div key={b.id} className="adm-box-card">
            <div className="adm-box-header">
              <span className="adm-box-label">{b.label || 'Untitled'}</span>
              <Badge status={b.status} map={STATUS_PILL} />
            </div>
            <div className="adm-box-meta">
              <span>{(b.asset_classes || []).join(', ') || '—'}</span>
              <span className="adm-sep">·</span>
              <span>{geo}</span>
            </div>
            <div className="adm-box-stats">
              <div className="adm-box-stat">
                <span className="adm-stat-val">{b.deals_sent_total ?? 0}</span>
                <span className="adm-stat-lbl">deals sent</span>
              </div>
              <div className="adm-box-stat">
                <span className="adm-stat-val">{b.coverage_score != null ? Number(b.coverage_score).toFixed(0) : '—'}</span>
                <span className="adm-stat-lbl">coverage</span>
              </div>
              <div className="adm-box-stat">
                <span className="adm-stat-val">{b.last_run_at ? fmtDate(b.last_run_at) : 'Never'}</span>
                <span className="adm-stat-lbl">last run</span>
              </div>
            </div>
            {b.coverage_notes && <div className="adm-box-note adm-box-note--coverage">{b.coverage_notes}</div>}
            {b.notes && <div className="adm-box-note adm-box-note--internal">{b.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}

function DealsTab({ deals }) {
  if (!deals.length) return <div className="adm-empty">No deals delivered yet</div>;
  return (
    <div className="adm-deals-wrap">
      <table className="adm-deals-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Asset</th>
            <th>Score</th>
            <th>Feedback</th>
            <th>Status</th>
            <th>Sent</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id}>
              <td className="adm-deal-addr">
                {d.property_address}
                {d.property_city ? `, ${d.property_city}` : ''}
                {d.property_state ? ` ${d.property_state}` : ''}
              </td>
              <td>{d.asset_class || '—'}</td>
              <td className="adm-deal-score">{d.match_score ?? '—'}</td>
              <td>{d.feedback || '—'}</td>
              <td>{d.status || '—'}</td>
              <td>{fmtDate(d.sent_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriberDetail({ subId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (!subId) return;
    let active = true;
    (async () => {
      setLoading(true);
      setData(null);
      setTab('profile');
      try {
        const d = await api.get(`/api/dealfeed/admin/subscribers/${subId}`);
        if (active) setData(d);
      } catch { /* ignore */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [subId]);

  if (!subId) return <div className="adm-detail-placeholder">Select a subscriber to view their profile</div>;
  if (loading) return <div className="adm-detail-placeholder">Loading…</div>;
  if (!data) return <div className="adm-detail-placeholder">Failed to load — check connection</div>;

  const { subscriber: sub, buy_boxes, deals } = data;

  return (
    <div className="adm-detail">
      <div className="adm-detail-head">
        <div>
          <div className="adm-detail-name">{sub.full_name || sub.email}</div>
          <div className="adm-detail-sub">{sub.full_name ? sub.email : ''}{sub.company ? ` · ${sub.company}` : ''}</div>
        </div>
        <Badge status={sub.status} map={STATUS_PILL} />
      </div>
      <div className="adm-detail-tabs">
        {[
          { id: 'profile',   label: 'Profile' },
          { id: 'buy_boxes', label: `Buy Boxes (${buy_boxes.length})` },
          { id: 'deals',     label: `Deals (${deals.length})` },
        ].map(t => (
          <button
            key={t.id}
            className={`adm-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="adm-detail-body">
        {tab === 'profile'   && <ProfileTab sub={sub} />}
        {tab === 'buy_boxes' && <BuyBoxesTab boxes={buy_boxes} />}
        {tab === 'deals'     && <DealsTab deals={deals} />}
      </div>
    </div>
  );
}

export function AdminView() {
  const addToast = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [triggering, setTriggering] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setSubsLoading(true);
    try {
      const d = await api.get('/api/dealfeed/admin/subscribers');
      setSubscribers(d.subscribers || []);
    } catch {
      addToast('Failed to load subscribers', 'error');
    } finally {
      setSubsLoading(false);
    }
  }, [addToast]);

  const fetchRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const d = await api.get('/api/dealfeed/admin/runs');
      setRuns(d.runs || []);
    } finally {
      setRunsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchSubscribers(), fetchRuns()]);
    })();
  }, [fetchSubscribers, fetchRuns]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/api/dealfeed/admin/runs/trigger', {});
      addToast('Deal feed run started', 'success');
      setTimeout(fetchRuns, 4000);
    } catch {
      addToast('Failed to start run', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const filtered = query.trim().length > 0
    ? subscribers.filter(s =>
        (s.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase()) ||
        (s.company || '').toLowerCase().includes(query.toLowerCase())
      )
    : subscribers;

  return (
    <div className="adm-root">
      <RunsStrip
        runs={runs}
        loading={runsLoading}
        onTrigger={handleTrigger}
        triggering={triggering}
        onRefresh={fetchRuns}
      />
      <div className="adm-body">
        <aside className="adm-sidebar">
          <div className="adm-sidebar-top">
            <input
              className="adm-search"
              type="text"
              placeholder="Search subscribers…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <span className="adm-sub-count">{subscribers.length} users</span>
          </div>
          <div className="adm-sub-list">
            {subsLoading && <div className="adm-empty">Loading…</div>}
            {!subsLoading && filtered.length === 0 && <div className="adm-empty">No results</div>}
            {filtered.map(s => (
              <button
                key={s.id}
                className={`adm-sub-card${selectedId === s.id ? ' active' : ''}`}
                onClick={() => setSelectedId(s.id)}
              >
                <div className="adm-sub-top">
                  <span className="adm-sub-name">{s.full_name || s.email}</span>
                  <Badge status={s.status} map={STATUS_PILL} />
                </div>
                <div className="adm-sub-bottom">
                  <span className="adm-sub-email">{s.full_name ? s.email : ''}</span>
                  <span className="adm-sub-stats">{s.deal_count}d · {s.buy_box_count}bb</span>
                </div>
                <ChevronRight size={12} className="adm-sub-arrow" />
              </button>
            ))}
          </div>
        </aside>
        <main className="adm-main">
          <SubscriberDetail subId={selectedId} />
        </main>
      </div>
    </div>
  );
}
