import React, { useState, useEffect } from 'react';
import { getActivityLogs } from '../../services/api';

const ACTION_STYLES = {
  LOGIN:        { bg: 'rgba(6,182,212,0.15)',   color: '#06b6d4',  border: 'rgba(6,182,212,0.3)',   icon: '🔐' },
  TASK_CREATED: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  TASK_UPDATED: { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1',  border: 'rgba(99,102,241,0.3)',  icon: '✏️' },
  TASK_DELETED: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444',  border: 'rgba(239,68,68,0.3)',   icon: '🗑️' },
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getActivityLogs();
      if (res.data.success) setLogs(res.data.data);
      else setError(res.data.message || 'Failed to load logs');
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading activity logs');
    } finally {
      setLoading(false);
    }
  };

  const actions = ['All', 'LOGIN', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED'];
  const filteredLogs = logs.filter((l) => filter === 'All' || l.action === filter);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      {/* Header */}
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Activity <span className="gradient-text">Logs</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={fetchLogs} className="btn btn-secondary btn-sm">↻ Refresh</button>
        </div>
      </div>

      {/* Action filter tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {actions.map((action) => (
          <button key={action} onClick={() => setFilter(action)} className="btn btn-sm"
            style={{
              background: filter === action ? 'var(--primary)' : 'rgba(15,23,42,0.5)',
              color: filter === action ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${filter === action ? 'var(--primary)' : 'var(--glass-border)'}`,
              boxShadow: filter === action ? '0 4px 10px var(--primary-glow)' : 'none',
              fontSize: '0.8rem',
            }}>
            {action === 'All' ? 'All Events' : action.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', padding: '1rem', fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
          No {filter === 'All' ? '' : filter.replace('_', ' ').toLowerCase() + ' '}events recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredLogs.map((log) => {
            const style = ACTION_STYLES[log.action] || {};
            return (
              <div key={log._id} className="glass-card animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.5rem', borderLeft: `4px solid ${style.color}` }}>
                {/* Icon */}
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{style.icon}</span>

                {/* Action badge */}
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                  background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                  fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.06em', flexShrink: 0,
                }}>
                  {log.action.replace('_', ' ')}
                </span>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.15rem' }}>
                    {log.userId?.name || 'Unknown User'}
                    <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                      ({log.userId?.email})
                    </span>
                  </p>
                  {log.details && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(log.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
