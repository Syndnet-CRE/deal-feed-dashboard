import { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, RotateCcw, X } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import '../styles/accounts.css';

function fmtDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function inviteState(sub) {
  if (sub.status === 'active' && !sub.invited_at) return 'direct';
  if (sub.status === 'active') return 'accepted';
  if (!sub.invited_at) return 'not_sent';
  if (sub.token_status === 'pending') return 'sent';
  return 'expired';
}

const INVITE_BADGE = {
  accepted: { label: 'Accepted', cls: 'green' },
  sent:     { label: 'Sent',     cls: 'blue'  },
  expired:  { label: 'Expired',  cls: 'amber' },
  not_sent: { label: 'Not sent', cls: 'gray'  },
  direct:   { label: 'Direct',   cls: 'green' },
};

const STATUS_BADGE = {
  active:         { label: 'Active',   cls: 'green' },
  trial:          { label: 'Trial',    cls: 'amber' },
  pending_invite: { label: 'Pending',  cls: 'blue'  },
  paused:         { label: 'Paused',   cls: 'gray'  },
  cancelled:      { label: 'Cancelled',cls: 'red'   },
};

function Badge({ map, value }) {
  const { label, cls } = map[value] || { label: value || '—', cls: 'gray' };
  return <span className={`acc-badge ${cls}`}>{label}</span>;
}

function InvitePanel({ onSent, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState(null);

  async function send() {
    const clean = email.toLowerCase().trim();
    if (!clean || !clean.includes('@')) { setMsg({ ok: false, text: 'Valid email required' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      await api.post('/api/dealfeed/admin/subscribers/invite', { email: clean, full_name: name.trim() || null });
      setMsg({ ok: true, text: `Invite sent to ${clean}` });
      setEmail('');
      setName('');
      onSent();
    } catch (err) {
      setMsg({ ok: false, text: err?.message || 'Failed to send invite' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acc-invite-panel">
      <div className="acc-field">
        <label>Email</label>
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          autoFocus
        />
      </div>
      <div className="acc-field">
        <label>Name (optional)</label>
        <input
          type="text"
          placeholder="First Last"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
      </div>
      <button className="acc-panel-send" onClick={send} disabled={busy || !email.trim()}>
        {busy ? 'Sending…' : 'Send Invite'}
      </button>
      <button className="acc-panel-cancel" onClick={onClose}><X size={14} /></button>
      {msg && <span className={`acc-panel-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</span>}
    </div>
  );
}

function ActionsCell({ sub, state, onAction, busy }) {
  if (state === 'accepted' || state === 'direct') {
    return (
      <div className="acc-actions">
        <button className="acc-action-btn revoke" disabled={busy} onClick={() => onAction('revoke', sub)}>
          Revoke
        </button>
      </div>
    );
  }
  if (state === 'not_sent') {
    return (
      <div className="acc-actions">
        <button className="acc-action-btn send" disabled={busy} onClick={() => onAction('send', sub)}>
          <Mail size={11} /> Send
        </button>
      </div>
    );
  }
  return (
    <div className="acc-actions">
      <button className="acc-action-btn resend" disabled={busy} onClick={() => onAction('resend', sub)}>
        <RotateCcw size={11} /> Resend
      </button>
    </div>
  );
}

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'active',  label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'expired', label: 'Expired' },
];

export function AccountsView() {
  const addToast = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [query, setQuery]             = useState('');
  const [showInvite, setShowInvite]   = useState(false);
  const [busyIds, setBusyIds]         = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get('/api/dealfeed/admin/subscribers');
      setSubscribers(d.subscribers || []);
    } catch {
      addToast('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(action, sub) {
    setBusyIds(s => new Set([...s, sub.id]));
    try {
      if (action === 'revoke') {
        if (!window.confirm(`Revoke access for ${sub.full_name || sub.email}?`)) return;
        await api.delete(`/api/dealfeed/admin/subscribers/${sub.id}`);
        addToast(`Access revoked for ${sub.email}`, 'success');
      } else {
        await api.post(`/api/dealfeed/admin/subscribers/${sub.id}/resend-invite`, {});
        addToast(`Invite sent to ${sub.email}`, 'success');
      }
      await load();
    } catch {
      addToast('Action failed', 'error');
    } finally {
      setBusyIds(s => { const n = new Set(s); n.delete(sub.id); return n; });
    }
  }

  const withState = subscribers.map(s => ({ ...s, _state: inviteState(s) }));

  const counts = {
    all:     withState.length,
    active:  withState.filter(s => s._state === 'accepted' || s._state === 'direct').length,
    pending: withState.filter(s => s._state === 'not_sent' || s._state === 'sent').length,
    expired: withState.filter(s => s._state === 'expired').length,
  };

  const filtered = withState.filter(s => {
    if (filter === 'active'  && s._state !== 'accepted' && s._state !== 'direct') return false;
    if (filter === 'pending' && s._state !== 'not_sent' && s._state !== 'sent')   return false;
    if (filter === 'expired' && s._state !== 'expired')                            return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (s.full_name || '').toLowerCase().includes(q) ||
             s.email.toLowerCase().includes(q) ||
             (s.company || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="acc-root">
      <div className="acc-header">
        <span className="acc-title">Accounts</span>
        <input
          className="acc-search"
          type="text"
          placeholder="Search name, email, company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="acc-invite-btn" onClick={() => setShowInvite(v => !v)}>
          <Plus size={13} /> Invite
        </button>
      </div>

      <div className="acc-stats">
        {FILTERS.map(f => (
          <div key={f.id} className={`acc-stat${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
            <span className="acc-stat-num">{counts[f.id]}</span>
            <span className="acc-stat-lbl">{f.label}</span>
          </div>
        ))}
      </div>

      {showInvite && <InvitePanel onSent={load} onClose={() => setShowInvite(false)} />}

      <div className="acc-table-wrap">
        {loading ? (
          <div className="acc-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="acc-empty">No accounts match this filter.</div>
        ) : (
          <table className="acc-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Company</th>
                <th>Status</th>
                <th>Invite State</th>
                <th>Invited</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Boxes</th>
                <th>Deals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div className="acc-name">{sub.full_name || sub.email}</div>
                    {sub.full_name && <div className="acc-email">{sub.email}</div>}
                  </td>
                  <td><span className="acc-muted">{sub.company || '—'}</span></td>
                  <td><Badge map={STATUS_BADGE} value={sub.status} /></td>
                  <td><Badge map={INVITE_BADGE} value={sub._state} /></td>
                  <td className="acc-muted acc-num">{fmtDate(sub.invited_at) || '—'}</td>
                  <td className="acc-muted acc-num">{sub._state === 'accepted' ? fmtDate(sub.updated_at) : '—'}</td>
                  <td className="acc-muted acc-num">{fmtDateTime(sub.last_login_at) || '—'}</td>
                  <td className="acc-muted acc-num">{sub.buy_box_count ?? 0}</td>
                  <td className="acc-muted acc-num">{sub.deal_count ?? 0}</td>
                  <td>
                    <ActionsCell sub={sub} state={sub._state} onAction={handleAction} busy={busyIds.has(sub.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
