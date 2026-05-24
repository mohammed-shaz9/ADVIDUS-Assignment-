import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ToastContainer } from './components/common/ToastContainer';

// Global error logger
if (typeof window !== 'undefined') {
  const origOnError = window.onerror;
  window.onerror = (msg, source, line, col, err) => {
    console.error('[Global]', msg, source, line, col, err);
    origOnError?.call(window, msg, source, line, col, err);
  };
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[Unhandled Promise]', e.reason);
  });
}

const MainApp: React.FC = () => {
  const { user, loading, backgroundRefreshing, toasts, removeToast } = useAuth();

  const isAuthPath = window.location.pathname === '/auth' || window.location.pathname === '/login';

  if (loading) {
    return <LoadingSpinner message="Synchronizing Security Keys..." fullPage />;
  }

  // If logged in and on auth path, redirect to dashboard
  if (user && isAuthPath) {
    window.history.replaceState(null, '', '/dashboard');
  }

  return (
    <ErrorBoundary>
      {user ? <DashboardPage /> : <AuthPage />}
      {backgroundRefreshing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          height: '2px', background: 'rgba(108,99,255,0.15)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '30%',
            background: 'linear-gradient(90deg, #6C63FF, #A5B4FC)',
            borderRadius: '2px',
            animation: 'refreshBar 1.2s ease-in-out infinite',
          }} />
        </div>
      )}
      <style>{`
        @keyframes refreshBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
