import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDeals, DealsProvider } from './contexts/DealsContext';
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

(() => {
  const t = localStorage.getItem('parcyl-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function DealDetailRoute() {
  const { dealId } = useParams();
  const { deals, loading } = useDeals();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  if (loading) return null;

  const deal = deals.find(d => String(d.id) === dealId);
  if (!deal) {
    navigate('/', { replace: true });
    return null;
  }
  return <PropertyDetail deal={deal} onClose={() => navigate(-1)}/>;
}

function AppShell() {
  const { subscriber, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('dashboard');
  const [confirmDanger, setConfirmDanger] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('parcyl-theme') || 'dark');

  const isOnDeal = location.pathname.startsWith('/deal/');

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('parcyl-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  const handleSetView = useCallback((v) => {
    setView(v);
    if (isOnDeal) navigate('/');
  }, [isOnDeal, navigate]);

  const handleOpenDeal = useCallback((deal) => {
    navigate('/deal/' + deal.id);
  }, [navigate]);

  useEffect(() => {
    if (!loading && !subscriber) navigate('/login');
  }, [subscriber, loading, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showWizard) setShowWizard(false);
        else if (confirmDanger) setConfirmDanger(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showWizard, confirmDanger]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: '#9DA2B3', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!subscriber) return null;

  const noScroll = view === 'deals' || view === 'map';

  return (
    <DealsProvider>
      <div className="app has-topbar">
        <ParcylBar
          view={isOnDeal ? null : view}
          setView={handleSetView}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <Routes>
          <Route path="/deal/:dealId" element={<DealDetailRoute/>}/>
          <Route path="/*" element={
            <div className={`content${noScroll ? ' no-scroll' : ''}`} data-screen-label={view}>
              {view === 'dashboard' && <DashboardView onOpenDeal={handleOpenDeal}/>}
              {view === 'deals'     && <MyDealsView   onOpenDeal={handleOpenDeal}/>}
              {view === 'map'       && <MapView        onOpenDeal={handleOpenDeal}/>}
              {view === 'boxes'     && <BuyBoxesView   onCreate={() => setShowWizard(true)}/>}
              {view === 'settings'  && <SettingsView   onConfirmDanger={setConfirmDanger}/>}
            </div>
          }/>
        </Routes>
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
      <Route path="/*" element={<AppShell/>}/>
    </Routes>
  );
}
