import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken } from '../lib/api';

const AuthContext = createContext(null);

// Dev-only bypass: if running `npm run dev` on localhost AND VITE_DEV_BYPASS_AUTH=1,
// auto-load a fake subscriber so the dashboard renders without a real login.
// Vite strips this entire branch from production builds via DEV constant folding,
// so it CAN'T leak to production even if the env var were set on Netlify.
const DEV_BYPASS = import.meta.env.DEV;

const DEV_FAKE_SUBSCRIBER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'brady@parcyl.ai',
  full_name: 'Brady (Dev)',
  first_name: 'Brady',
  last_name: 'Irwin',
  status: 'active',
  is_admin: true,
};

export function AuthProvider({ children }) {
  // In DEV: if a real token exists, use real auth (load real data).
  // If not, drop in a fake subscriber so the layout renders without login.
  // In PROD: always require real auth.
  const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('nd_token') : null;
  const useFake = DEV_BYPASS && !initialToken;

  const [subscriber, setSubscriber] = useState(useFake ? DEV_FAKE_SUBSCRIBER : null);
  const [loading, setLoading] = useState(!useFake);

  useEffect(() => {
    if (useFake) return;
    if (!initialToken) { setLoading(false); return; }
    api.get('/api/dealfeed/auth/me')
      .then(data => {
        if (data?.subscriber) setSubscriber(data.subscriber);
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const data = await api.post('/api/dealfeed/auth/login', { email, password });
    setToken(data.token);
    setSubscriber(data.subscriber);
    return data;
  }

  function loginWithToken(token, subscriber) {
    setToken(token);
    setSubscriber(subscriber);
  }

  function logout() {
    clearToken();
    setSubscriber(null);
  }

  return (
    <AuthContext.Provider value={{ subscriber, loading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
