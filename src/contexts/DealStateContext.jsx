import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

const DealStateCtx = createContext(null);
const VALID = ['active', 'dead', 'loi', 'archived'];

export function DealStateProvider({ children }) {
  const { subscriber } = useAuth();
  const subId = subscriber?.id ?? '';

  const [dealStates, setDealStates] = useState(() => {
    if (!subId) return {};
    const prefix = `dealfeed.dealstate.${subId}:`;
    const map = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix)) {
        map[key.slice(prefix.length)] = localStorage.getItem(key);
      }
    }
    return map;
  });

  const getDealState = useCallback((dealId) => dealStates[String(dealId)] || 'active', [dealStates]);

  const setDealState = useCallback((dealId, state) => {
    if (!subId || !VALID.includes(state)) return;
    localStorage.setItem(`dealfeed.dealstate.${subId}:${dealId}`, state);
    setDealStates(prev => ({ ...prev, [String(dealId)]: state }));
  }, [subId]);

  return (
    <DealStateCtx.Provider value={{ getDealState, setDealState }}>
      {children}
    </DealStateCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDealState() {
  const ctx = useContext(DealStateCtx);
  if (!ctx) throw new Error('useDealState must be used within DealStateProvider');
  return ctx;
}
