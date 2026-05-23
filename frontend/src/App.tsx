import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ToastContainer } from './components/common/ToastContainer';

const MainApp: React.FC = () => {
  const { user, loading, toasts, removeToast } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Synchronizing Security Keys..." fullPage />;
  }

  return (
    <ErrorBoundary>
      {user ? <DashboardPage /> : <AuthPage />}
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
