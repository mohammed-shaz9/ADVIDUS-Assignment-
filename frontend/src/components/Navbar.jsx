import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      margin: '1.5rem',
      borderRadius: 'var(--radius-md)',
      position: 'sticky',
      top: '1.5rem',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: '800',
          fontSize: '1.25rem',
          color: 'white',
          boxShadow: '0 0 15px var(--primary-glow)',
        }}>
          T
        </div>
        <Link to={user ? "/dashboard" : "/login"} style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          color: 'white',
          background: 'linear-gradient(135deg, #fff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          TaskSpace
        </Link>
      </div>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {user.name}
            </span>
            <span style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
              <span className={`badge ${user.role === 'Admin' ? 'badge-admin' : 'badge-user'}`}>
                {user.role}
              </span>
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary btn-sm" style={{ color: 'white' }}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
