import { useState, useRef, useEffect } from 'react';
import { I } from './Icons';
import { useAuth } from '../hooks/useAuth';

const TITLES = {
  dashboard: "Dashboard",
  deals: "My Deals",
  map: "Map View",
  boxes: "Buy Boxes",
  settings: "Account Settings"
};

function initials(name) {
  if (!name) return '??';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export function Topbar({ view, onCreateBox }) {
  const { subscriber, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="topbar">
      <div className="crumb">Deal Feed <span style={{ color: "var(--ink-4)", margin: "0 6px" }}>/</span> <b>{TITLES[view]}</b></div>
      <div className="topbar-spacer"/>
      <div className="topbar-search">
        <I.Search size={14}/>
        <input placeholder="Search by address, parcel ID, or owner entity..."/>
        <span className="topbar-kbd">⌘K</span>
      </div>
      <button className="topbar-icon-btn" title="Notifications">
        <I.Bell size={15}/>
        <span className="notif-pip"/>
      </button>
      {view !== "boxes" && (
        <button className="topbar-btn primary" onClick={onCreateBox}><I.Plus size={13}/> New Buy Box</button>
      )}
      <div style={{ position: 'relative' }} ref={menuRef}>
        <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => setMenuOpen(v => !v)}>
          {initials(subscriber?.full_name)}
        </div>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: 'var(--panel)', border: '1px solid var(--hairline)',
            borderRadius: 8, minWidth: 160, zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {subscriber?.email && (
              <div style={{ padding: '10px 14px', fontSize: 11.5, color: '#9DA2B3', borderBottom: '1px solid var(--hairline)' }}>
                {subscriber.email}
              </div>
            )}
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#FF7378', fontSize: 13, textAlign: 'left',
              }}
            >
              <I.External size={13}/> Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
