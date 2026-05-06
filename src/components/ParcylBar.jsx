import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { I, Icon } from './Icons';
import { LayoutDashboard, Map as MapIcon, LayoutGrid, Users, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDeals } from '../contexts/DealsContext';

const BASE_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map",       label: "Map",       icon: MapIcon },
  { id: "boxes",     label: "Buy Boxes", icon: LayoutGrid },
];



const SunIcon  = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>} />;
const MoonIcon = (p) => <Icon {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;

function matchesDeal(deal, q) {
  const lq = q.toLowerCase();
  return (
    deal.addr?.toLowerCase().includes(lq) ||
    deal.owner?.toLowerCase().includes(lq) ||
    deal.city?.toLowerCase().includes(lq) ||
    deal.zip?.toLowerCase().includes(lq)
  );
}

export function ParcylBar({ view, setView, theme, onToggleTheme }) {
  const { subscriber } = useAuth();
  const { deals } = useDeals();
  const navigate = useNavigate();
  const email = subscriber?.email || '';
  const initials = (() => {
    const fn = subscriber?.first_name?.trim();
    const ln = subscriber?.last_name?.trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    const full = subscriber?.full_name?.trim();
    if (full) {
      const parts = full.split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase() || '??';
  })();
  const tabs = BASE_TABS;
  const isAdmin = email === 'brady@parcyl.ai';

  const MAX_RESULTS = 8;
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);
  const avatarRef = useRef(null);

  const results = query.length >= 2
    ? deals.filter(d => matchesDeal(d, query)).slice(0, MAX_RESULTS)
    : [];
  const open = query.length >= 2;

  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setQuery('');
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    function onOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function handleKey(e) {
    if (e.key === 'Escape') setQuery('');
  }

  function handleSelect(deal) {
    setQuery('');
    navigate(`/deal/${deal.id}`);
  }

  return (
    <nav className="parcyl-bar">
      <div className="pb-brand">
        <div className="mark">D</div>
        Deal Feed
      </div>
      <div className="pb-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`pb-tab${view === t.id ? ' active' : ''}`}
            onClick={() => setView(t.id)}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="pb-right">
        <div className="pb-search-wrap" ref={wrapRef}>
          <div className="pb-search-input-row">
            <I.Search size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }}/>
            <input
              className="pb-search-input"
              type="text"
              placeholder="Search deals…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              aria-label="Search deals"
            />
            {query && (
              <button className="pb-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
            )}
          </div>
          {open && (
            <div className="pb-search-dropdown">
              {results.length > 0 ? results.map(d => (
                <button key={d.id} className="pb-search-result" onClick={() => handleSelect(d)}>
                  <span className="pb-sr-addr">{d.addr}</span>
                  <span className="pb-sr-meta">{d.city} · {d.score}</span>
                </button>
              )) : (
                <div className="pb-search-empty">No results for "{query}"</div>
              )}
            </div>
          )}
        </div>
        <button className="pb-icon-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
        <div className="pb-divider" />
        <div className="pb-avatar-wrap" ref={avatarRef}>
          <div
            className={`pb-avatar${['settings', 'invites', 'admin'].includes(view) ? ' active' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
          >
            {initials}
          </div>
          {menuOpen && (
            <div className="pb-avatar-menu">
              <div className="pb-avatar-menu-email">{email}</div>
              <button
                className="pb-avatar-menu-item"
                onClick={() => { setView('settings'); setMenuOpen(false); }}
              >
                <SettingsIcon size={13} />
                Settings
              </button>
              {isAdmin && (
                <button
                  className="pb-avatar-menu-item"
                  onClick={() => { setView('invites'); setMenuOpen(false); }}
                >
                  <Users size={13} />
                  Invites
                </button>
              )}
              {isAdmin && (
                <button
                  className="pb-avatar-menu-item"
                  onClick={() => { setView('admin'); setMenuOpen(false); }}
                >
                  <ShieldCheck size={13} />
                  Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
