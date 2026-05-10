import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useMatch, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDeals, DealsProvider } from './contexts/DealsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ReadStateProvider } from './contexts/ReadStateContext';
import { DealStateProvider } from './contexts/DealStateContext';
import TopHeader from './components/TopHeader';
import LeftPanel from './components/LeftPanel';
import { DealDetail } from './components/DealDetail';
import { ConfirmModal } from './components/ConfirmModal';
import { BuyBoxWizard } from './components/BuyBoxWizard';
import { DashboardView } from './views/DashboardView';
import { BuyBoxesView } from './views/BuyBoxesView';
import { MapView } from './views/MapView';
import { SettingsView } from './views/SettingsView';
import { InviteView } from './views/InviteView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { InviteClaimView } from './views/InviteClaimView';
import { api } from './lib/api';

(() => {
  const t = localStorage.getItem('nightdrop-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

function DealDetailPage({ dealId }) {
  const { deals, loading } = useDeals();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    const found = deals.find(d => String(d.id) === dealId);
    if (!found) navigate('/', { replace: true });
  }, [loading, deals, dealId, navigate]);

  if (loading) return null;
  const deal = deals.find(d => String(d.id) === dealId);
  if (!deal) return null;

  const dealIndex = deals.findIndex(d => String(d.id) === dealId);

  return (
    <div className="dd-page-glass">
      <DealDetail
        deal={deal}
        onClose={() => navigate(-1)}
        deals={deals}
        dealIndex={dealIndex}
        onNavigateDeal={(d) => navigate('/deal/' + d.id)}
      />
    </div>
  );
}

function DealDetailModal({ dealId }) {
  const { deals, loading } = useDeals();
  const navigate = useNavigate();
  const location = useLocation();

  const close = useCallback(() => {
    navigate(location.key === 'default' ? '/' : -1);
  }, [navigate, location.key]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  if (loading) return null;
  const deal = deals.find(d => String(d.id) === dealId);
  if (!deal) return null;

  return (
    <div className="deal-modal-overlay">
      <DealDetail deal={deal} onClose={close}/>
    </div>
  );
}

function PauseBoxConfirm({ buyBox, onClose }) {
  const { patchBuyBox } = useDeals();
  return (
    <ConfirmModal
      kind="pause-box"
      onClose={onClose}
      onConfirm={async () => { await patchBuyBox(buyBox.id, { status: 'paused' }); }}
    />
  );
}

function AppShell() {
  const { subscriber, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dealMatch = useMatch('/deal/:dealId');
  const onboardingMatch = useMatch('/onboarding');
  const [view, setView] = useState('dashboard');
  const [confirmDanger, setConfirmDanger] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingBuyBox, setEditingBuyBox] = useState(null);
  const [pausingBuyBox, setPausingBuyBox] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState(null);

  const isOnDeal = !!dealMatch;
  const isModal  = isOnDeal && !!location.state?.fromMap;
  const noScroll = view === 'map';

  const handleSetView = useCallback((v) => {
    setView(v);
    if (isOnDeal) navigate('/');
  }, [isOnDeal, navigate]);

  const handleOpenDeal = useCallback((deal) => {
    const state = view === 'map' ? { fromMap: true } : undefined;
    navigate('/deal/' + deal.id, state ? { state } : {});
  }, [navigate, view]);

  useEffect(() => {
    if (!loading && !subscriber) navigate('/login');
  }, [subscriber, loading, navigate]);

  // Normalize URL: if subscriber is loaded and we're at the bare "/" or "/login",
  // push to "/dashboard" so the URL bar reflects the actual view.
  useEffect(() => {
    if (loading || !subscriber) return;
    if (location.pathname === '/' || location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, subscriber, location.pathname, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setShowWizard(prev => (prev ? false : prev));
      setConfirmDanger(prev => (prev ? null : prev));
      setEditingBuyBox(prev => (prev ? null : prev));
      setPausingBuyBox(prev => (prev ? null : prev));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!subscriber) return;
    api.get('/api/dealfeed/deals/dashboard/kpis')
      .then(data => setKpis(data))
      .catch(() => {});
  }, [subscriber]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page)', color: '#9DA2B3', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!subscriber) return null;

  return (
    <ReadStateProvider>
    <DealStateProvider>
    <DealsProvider>
      <div className="app has-sidebar">
        <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="app-body">
          <LeftPanel
            view={isOnDeal && !isModal ? null : view}
            setView={handleSetView}
            kpis={kpis}
            onCreateBuyBox={() => setShowWizard(true)}
            unreadCount={kpis?.unread_count || 0}
          />

          <main className={`app-content${noScroll ? ' no-scroll' : ''}`} data-screen-label={view}>
            <Routes>
              <Route path="/*" element={
                <>
                  {isOnDeal && !isModal && (
                    <DealDetailPage dealId={dealMatch.params.dealId}/>
                  )}

                  {(!isOnDeal || isModal) && (
                    <>
                      {view === 'dashboard' && (
                        <DashboardView
                          kpis={kpis}
                          searchQuery={searchQuery}
                          onOpenDeal={handleOpenDeal}
                        />
                      )}
                      {view === 'map'      && <MapView onOpenDeal={handleOpenDeal}/>}
                      {view === 'boxes'    && (
                        <BuyBoxesView
                          onCreate={() => setShowWizard(true)}
                          onEdit={setEditingBuyBox}
                          onPause={setPausingBuyBox}
                        />
                      )}
                      {view === 'calendar' && (
                        <DashboardView
                          kpis={kpis}
                          searchQuery={searchQuery}
                          onOpenDeal={handleOpenDeal}
                        />
                      )}
                      {view === 'settings' && <SettingsView onConfirmDanger={setConfirmDanger}/>}
                      {view === 'invites'  && <InviteView/>}
                      {view === 'admin'    && <AdminView/>}
                    </>
                  )}

                  {isModal && <DealDetailModal dealId={dealMatch.params.dealId}/>}
                </>
              }/>
            </Routes>
          </main>
        </div>

        {confirmDanger && <ConfirmModal kind={confirmDanger} onClose={() => setConfirmDanger(null)}/>}
        {pausingBuyBox && <PauseBoxConfirm buyBox={pausingBuyBox} onClose={() => setPausingBuyBox(null)}/>}
        {(showWizard || onboardingMatch) && (
          <BuyBoxWizard
            mode="create"
            onSuccess={() => { setShowWizard(false); handleSetView('boxes'); }}
            onCancel={() => { setShowWizard(false); if (onboardingMatch) navigate('/dashboard', { replace: true }); }}
          />
        )}
        {editingBuyBox && (
          <BuyBoxWizard
            mode="edit"
            initialData={editingBuyBox}
            onSuccess={() => setEditingBuyBox(null)}
            onCancel={() => setEditingBuyBox(null)}
          />
        )}
      </div>
    </DealsProvider>
    </DealStateProvider>
    </ReadStateProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
    <Routes>
      <Route path="/login" element={<LoginView/>}/>
      <Route path="/forgot-password" element={<ForgotPasswordView/>}/>
      <Route path="/reset-password" element={<ResetPasswordView/>}/>
      <Route path="/invite/:token" element={<InviteClaimView/>}/>
      <Route path="/*" element={<AppShell/>}/>
    </Routes>
    </ToastProvider>
  );
}
