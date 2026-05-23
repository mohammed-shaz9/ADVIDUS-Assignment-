import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#6366f1',
        fontSize: '1.25rem',
        fontWeight: '600',
      }}>
        Verifying access...
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // Logged in but not Admin → redirect to user dashboard
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
