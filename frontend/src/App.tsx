import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ToastContainer } from './components/common/ToastContainer';

const MainApp: React.FC = () => {
  const { user, loading, backgroundRefreshing, toasts, removeToast } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Synchronizing Security Keys..." fullPage />;
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
