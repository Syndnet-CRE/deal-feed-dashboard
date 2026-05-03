import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DealsProvider } from './contexts/DealsContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ConfirmModal } from './components/ConfirmModal';
import { NewBoxWizard } from './components/NewBoxWizard';
import { DealDrawer } from './components/DealDrawer';
import { DashboardView } from './views/DashboardView';
import { MyDealsView } from './views/MyDealsView';
import { BuyBoxesView } from './views/BuyBoxesView';
import { MapView } from './views/MapView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';

function ProtectedLayout() {
  const { subscriber, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("dashboard");
  const [openDeal, setOpenDeal] = useState(null);
  const [confirmDanger, setConfirmDanger] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

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
    <div className="app">
      <Sidebar view={view} setView={setView}/>
      <div className="main">
        <Topbar view={view} onCreateBox={() => setShowWizard(true)}/>
        <div className={`content ${noScroll ? "no-scroll" : ""}`} data-screen-label={view}>
          {view === "dashboard" && <DashboardView onOpenDeal={setOpenDeal} selectedId={openDeal && openDeal.id}/>}
          {view === "deals" && <MyDealsView onOpenDeal={setOpenDeal} selectedId={openDeal && openDeal.id}/>}
          {view === "map" && <MapView onOpenDeal={setOpenDeal}/>}
          {view === "boxes" && <BuyBoxesView onCreate={() => setShowWizard(true)}/>}
          {view === "settings" && <SettingsView onConfirmDanger={setConfirmDanger}/>}
          {openDeal && <DealDrawer deal={openDeal} onClose={() => setOpenDeal(null)}/>}
        </div>
      </div>
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
