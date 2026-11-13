import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ui';
import { ConfigMissing } from './components/ConfigMissing';
import { isConfigured } from './lib/supabase';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isConfigured ? (
      <ErrorBoundary>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ErrorBoundary>
    ) : (
      <ConfigMissing />
    )}
  </StrictMode>,
);
