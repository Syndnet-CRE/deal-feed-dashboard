import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('df_token');
    if (!token) { setLoading(false); return; }
    api.get('/api/dealfeed/auth/me')
      .then(setSubscriber)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.post('/api/dealfeed/auth/login', { email, password });
    setToken(data.token);
    setSubscriber(data.subscriber);
    return data;
  }

  function logout() {
    clearToken();
    setSubscriber(null);
  }

  return (
    <AuthContext.Provider value={{ subscriber, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
