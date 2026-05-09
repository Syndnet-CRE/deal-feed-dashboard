import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

// Token migration: df_token → nd_token (one-time, idempotent)
const _old = localStorage.getItem('df_token');
if (_old !== null && localStorage.getItem('nd_token') === null) {
  localStorage.setItem('nd_token', _old);
  localStorage.removeItem('df_token');
} else if (_old !== null) {
  localStorage.removeItem('df_token');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App/>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
