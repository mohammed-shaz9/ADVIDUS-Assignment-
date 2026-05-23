import React from 'react';
import { ActivityLog } from '../../types';

interface ActivityLogTableProps {
  logs: ActivityLog[];
  search: string;
  actionFilter: string;
  onSearchChange: (v: string) => void;
  onActionFilterChange: (v: string) => void;
}

const getIconClass = (action: string) => {
  switch (action) {
    case 'LOGIN': case 'REGISTER': return 'ti ti-login';
    case 'TASK_CREATED': return 'ti ti-plus';
    case 'TASK_UPDATED': return 'ti ti-edit';
    case 'TASK_DELETED': return 'ti ti-trash';
    case 'AGENT_CREATED': return 'ti ti-cpu';
    case 'AGENT_DELETED': return 'ti ti-cpu-off';
    case 'USER_STATUS_UPDATED': return 'ti ti-user-check';
    case 'USER_DELETED': return 'ti ti-user-x';
    default: return 'ti ti-activity';
  }
};

const actions = ['LOGIN', 'REGISTER', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'USER_STATUS_UPDATED', 'USER_DELETED', 'AGENT_CREATED', 'AGENT_DELETED'];

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  logs, search, actionFilter, onSearchChange, onActionFilterChange,
}) => {
  const filtered = logs.filter(log => {
    const matchSearch =
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.userId && log.userId.name.toLowerCase().includes(search.toLowerCase())) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">Security Audit Streams</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text" className="form-input" placeholder="Search logs..."
            value={search} onChange={(e) => onSearchChange(e.target.value)}
            style={{ height: '30px', width: '180px', padding: '4px 10px', fontSize: '11px' }}
          />
          <select
            className="form-input"
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            style={{ height: '30px', width: '130px', padding: '2px 8px', fontSize: '11px', background: 'var(--bg-secondary)', color: '#fff' }}
          >
            <option value="all">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
      <div className="panel-body">
        <table className="user-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(log => (
              <tr key={log._id}>
                <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>{log.userId?.name || 'System'}</td>
                <td>
                  <span className="action-badge">
                    <i className={getIconClass(log.action)} style={{ marginRight: '4px', fontSize: '12px' }}></i>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.details}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
