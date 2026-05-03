import { I, Icon } from './Icons';
import { useAuth } from '../hooks/useAuth';

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: I.Dashboard },
  { id: "deals",     label: "My Deals",  icon: I.Deals },
  { id: "map",       label: "Map",       icon: I.Map },
  { id: "boxes",     label: "Buy Boxes", icon: I.Boxes },
  { id: "settings",  label: "Settings",  icon: I.Settings },
];

const SunIcon  = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>} />;
const MoonIcon = (p) => <Icon {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;

export function ParcylBar({ view, setView, theme, onToggleTheme }) {
  const { subscriber } = useAuth();
  const email = subscriber?.email || '';
  const initials = email.slice(0, 2).toUpperCase() || 'DR';

  return (
    <nav className="parcyl-bar">
      <div className="pb-brand">
        <div className="mark">D</div>
        Deal Feed
      </div>
      <div className="pb-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`pb-tab${view === t.id ? ' active' : ''}`}
            onClick={() => setView(t.id)}
          >
            <t.icon size={14} style={{ marginRight: 5 }} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="pb-right">
        <button className="pb-icon-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
        <div className="pb-divider" />
        <div className="pb-avatar">{initials}</div>
      </div>
    </nav>
  );
}
