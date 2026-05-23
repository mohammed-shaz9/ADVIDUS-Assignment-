import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSummary } from '../../services/api';
import StatCard from '../../components/StatCard';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getAdminSummary();
        if (res.data.success) {
          setSummary(res.data.data);
        } else {
          setError(res.data.message || 'Failed to load summary');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const quickLinks = [
    { label: 'User Management', path: '/admin/users', icon: '👥', desc: 'Manage users, statuses & roles' },
    { label: 'Task Monitoring', path: '/admin/tasks', icon: '📋', desc: 'View & delete all tasks' },
    { label: 'Activity Logs', path: '/admin/logs', icon: '📜', desc: 'Track login & task events' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      {/* Header */}
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Admin <span className="gradient-text">Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Live overview of platform activity and health.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-sm)', color: 'var(--danger)', padding: '1rem',
          fontSize: '0.9rem', marginBottom: '2rem',
        }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard
          label="Total Users"
          value={loading ? '...' : summary?.totalUsers}
          icon="👤"
          gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
          glowColor="rgba(99,102,241,0.35)"
        />
        <StatCard
          label="Total Tasks"
          value={loading ? '...' : summary?.totalTasks}
          icon="📌"
          gradient="linear-gradient(135deg, #06b6d4, #0284c7)"
          glowColor="rgba(6,182,212,0.35)"
        />
        <StatCard
          label="Completed"
          value={loading ? '...' : summary?.completedTasks}
          icon="✅"
          gradient="linear-gradient(135deg, #10b981, #059669)"
          glowColor="rgba(16,185,129,0.35)"
        />
        <StatCard
          label="Pending"
          value={loading ? '...' : summary?.pendingTasks}
          icon="⏳"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          glowColor="rgba(245,158,11,0.35)"
        />
      </div>

      {/* Quick Navigation */}
      <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: '600' }}>
        Quick Access
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {quickLinks.map((link) => (
          <Link key={link.path} to={link.path} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>{link.icon}</span>
              <div>
                <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{link.label}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
