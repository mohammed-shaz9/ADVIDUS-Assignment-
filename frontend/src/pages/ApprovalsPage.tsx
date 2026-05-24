import React, { useEffect, useState } from 'react';
import { approvalApi } from '../services/api';
import { Approval } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApprovals(); }, []);

  const loadApprovals = async () => {
    try {
      const res = await approvalApi.getMyApprovals();
      setApprovals(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDecide = async (id: string, decision: 'approved' | 'rejected') => {
    // Optimistic update — reflect change immediately
    setApprovals(prev => prev.map(a =>
      a._id === id ? { ...a, status: decision, decidedAt: new Date().toISOString() } : a
    ));
    try {
      await approvalApi.decide(id, decision);
      loadApprovals(); // background refresh
    } catch (e) {
      console.error(e);
      loadApprovals(); // revert on failure
    }
  };

  if (loading) return <LoadingSpinner message="Loading approvals..." />;

  const pending = approvals.filter(a => a.status === 'pending');
  const history = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Approval Requests</h2>
        {pending.length > 0 && <span className="badge badge-pending" style={{ fontSize: 11, padding: '4px 12px' }}>{pending.length} pending</span>}
      </div>

      {pending.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Awaiting Your Decision ({pending.length})</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Task</th><th>Level</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {pending.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 500 }}>{(a.task as any)?.title || 'Unknown Task'}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>Level {a.level}</span>
                    </td>
                    <td><span className="badge badge-pending">Pending</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-success" onClick={() => handleDecide(a._id, 'approved')} style={{ marginRight: 6 }}>Approve</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDecide(a._id, 'rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Decision History ({history.length})</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Task</th><th>Level</th><th>Decision</th><th>Comment</th></tr></thead>
              <tbody>
                {history.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 500 }}>{(a.task as any)?.title || 'Unknown Task'}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>Level {a.level}</span>
                    </td>
                    <td><span className={`badge ${a.status === 'approved' ? 'badge-active' : 'badge-inactive'}`}>{a.status}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {approvals.length === 0 && !loading && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No approval requests found.</div></div>
      )}
    </div>
  );
};
