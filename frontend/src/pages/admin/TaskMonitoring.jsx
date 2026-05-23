import React, { useState, useEffect } from 'react';
import { getAdminTasks, deleteAdminTask } from '../../services/api';

const TaskMonitoring = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAdminTasks();
      if (res.data.success) setTasks(res.data.data);
      else setError(res.data.message || 'Failed to load tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this task?')) return;
    try {
      setDeletingId(id);
      const res = await deleteAdminTask(id);
      if (res.data.success) setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => filter === 'All' || t.status === filter);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      {/* Header */}
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Task <span className="gradient-text">Monitoring</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} across all users
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15,23,42,0.4)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            {['All', 'Pending', 'Completed'].map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className="btn btn-sm"
                style={{ background: filter === tab ? 'var(--primary)' : 'transparent', color: filter === tab ? 'white' : 'var(--text-secondary)', boxShadow: filter === tab ? '0 4px 10px var(--primary-glow)' : 'none', padding: '0.35rem 1rem' }}>
                {tab}
              </button>
            ))}
          </div>
          <button onClick={fetchTasks} className="btn btn-secondary btn-sm">↻ Refresh</button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', padding: '1rem', fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading tasks...</div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.4)' }}>
                  {['Title', 'Description', 'Status', 'Created By', 'Date', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '200px' }}>
                      {task.title}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge ${task.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`}>{task.status}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{task.userId?.name || 'Unknown'}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{task.userId?.email}</p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)} disabled={deletingId === task._id} style={{ padding: '0.4rem 0.6rem' }} title="Delete task">
                        {deletingId === task._id ? '...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              {filter === 'All' ? 'No tasks found across the platform.' : `No ${filter} tasks found.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskMonitoring;
