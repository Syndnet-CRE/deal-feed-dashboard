import { I } from './Icons';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: I.Dashboard },
  { id: "deals", label: "My Deals", icon: I.Deals },
  { id: "map", label: "Map View", icon: I.Map },
  { id: "boxes", label: "Buy Boxes", icon: I.Boxes },
  { id: "settings", label: "Account Settings", icon: I.Settings },
];

export function Sidebar({ view, setView }) {
  const { subscriber } = useAuth();
  const email = subscriber?.email || "subscriber@example.com";

  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="sidebar-brand">
        <div className="wordmark">
          <span className="mark">D</span>
          Deal Feed
        </div>
        <div className="sub-email">{email}</div>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map(it => (
          <button key={it.id} className={`nav-item ${view === it.id ? "active" : ""}`} onClick={() => setView(it.id)}>
            <it.icon size={17}/>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="sub-status">
          <span className="badge-active"><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#1DAF29", marginRight: 5, verticalAlign: "middle" }}/>Active</span>
          <span style={{ color: "#9DA2B3", fontSize: 11, fontWeight: 500 }}>Operator</span>
        </div>
        <a href="#" className="billing-link">Manage billing →</a>
      </div>
    </aside>
  );
}
