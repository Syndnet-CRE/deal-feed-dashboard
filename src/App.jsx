import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DealsProvider } from './contexts/DealsContext';
import { ParcylBar } from './components/ParcylBar';
import { PropertyDetail } from './components/PropertyDetail';
import { ConfirmModal } from './components/ConfirmModal';
import { NewBoxWizard } from './components/NewBoxWizard';
import { DashboardView } from './views/DashboardView';
import { MyDealsView } from './views/MyDealsView';
import { BuyBoxesView } from './views/BuyBoxesView';
import { MapView } from './views/MapView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';

const _initTheme = (() => {
  const t = localStorage.getItem('parcyl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function ProtectedLayout() {
  const { subscriber, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("dashboard");
  const [openDeal, setOpenDeal] = useState(null);
  const [confirmDanger, setConfirmDanger] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('parcyl-theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('parcyl-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    if (!loading && !subscriber) navigate('/login');
  }, [subscriber, loading, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (openDeal) setOpenDeal(null);
        else if (showWizard) setShowWizard(false);
        else if (confirmDanger) setConfirmDanger(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDeal, showWizard, confirmDanger]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", color: "#9DA2B3", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!subscriber) return null;

  const noScroll = view === "deals" || view === "map";

  return (
    <DealsProvider>
    <div className="app has-topbar">
      <ParcylBar view={view} setView={setView} theme={theme} onToggleTheme={toggleTheme} />
      {openDeal ? (
        <PropertyDetail deal={openDeal} onClose={() => setOpenDeal(null)}/>
      ) : (
        <div className={`content${noScroll ? " no-scroll" : ""}`} data-screen-label={view}>
          {view === "dashboard" && <DashboardView onOpenDeal={setOpenDeal} selectedId={openDeal?.id}/>}
          {view === "deals" && <MyDealsView onOpenDeal={setOpenDeal} selectedId={openDeal?.id}/>}
          {view === "map" && <MapView onOpenDeal={setOpenDeal}/>}
          {view === "boxes" && <BuyBoxesView onCreate={() => setShowWizard(true)}/>}
          {view === "settings" && <SettingsView onConfirmDanger={setConfirmDanger}/>}
        </div>
      )}
      {confirmDanger && <ConfirmModal kind={confirmDanger} onClose={() => setConfirmDanger(null)}/>}
      {showWizard && <NewBoxWizard onClose={() => setShowWizard(false)}/>}
    </div>
    </DealsProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView/>}/>
      <Route path="/*" element={<ProtectedLayout/>}/>
    </Routes>
  );
}
