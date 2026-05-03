import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const DealsCtx = createContext(null);

function normalizeBuyBox(b) {
  const geo = [
    ...(b.geo_cities || []),
    ...(b.geo_states || []),
    ...(b.geo_counties || []),
  ].filter(Boolean).join(', ');

  let lastRun = '—';
  if (b.last_run_at) {
    const d = new Date(b.last_run_at);
    lastRun = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' — '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  }

  return {
    id: b.id,
    name: b.label,
    status: b.status || 'Active',
    geo: geo || '—',
    classes: b.asset_classes || [],
    hold: b.min_hold_yrs ? `${b.min_hold_yrs} yr` : '—',
    created: b.created_at
      ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    deals: b.deals_sent_total || 0,
    lastRun,
  };
}

export function DealsProvider({ children }) {
  const [deals, setDeals] = useState([]);
  const [buyBoxes, setBuyBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealsRes, boxesRes] = await Promise.all([
        api.get('/api/dealfeed/deals'),
        api.get('/api/dealfeed/buy-boxes'),
      ]);
      setDeals(dealsRes.deals || []);
      setBuyBoxes((boxesRes.buy_boxes || []).map(normalizeBuyBox));
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const postFeedback = useCallback(async (dealId, fb) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, fb } : d));
    try {
      await api.post(`/api/dealfeed/deals/${dealId}/feedback`, { feedback: fb });
    } catch (err) {
      console.error('[postFeedback]', err.message);
    }
  }, []);

  return (
    <DealsCtx.Provider value={{ deals, buyBoxes, loading, error, refetch: fetchAll, postFeedback }}>
      {children}
    </DealsCtx.Provider>
  );
}

export function useDeals() {
  const ctx = useContext(DealsCtx);
  if (!ctx) throw new Error('useDeals must be used within DealsProvider');
  return ctx;
}
