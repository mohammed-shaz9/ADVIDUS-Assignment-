import React from 'react';
import { Task } from '../../types';

interface TaskMonitorTableProps {
  tasks: Task[];
  search: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onOpenConsole: (task: Task) => void;
  onForceDelete: (taskId: string) => void;
}

export const TaskMonitorTable: React.FC<TaskMonitorTableProps> = ({
  tasks, search, statusFilter, onSearchChange, onStatusFilterChange, onOpenConsole, onForceDelete,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filtered = safeTasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      t.title.toLowerCase().includes(q) ||
      (t.owner && typeof t.owner === 'object' && 'name' in t.owner && (t.owner as { name: string }).name.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="panel" style={{ marginTop: '12px' }}>
      <div className="panel-header">
        <span className="panel-title">System Task Governance</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text" className="form-input" placeholder="Search global tasks..."
            value={search} onChange={(e) => onSearchChange(e.target.value)}
            style={{ height: '30px', width: '180px', padding: '4px 10px', fontSize: '11px' }}
          />
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{ height: '30px', width: '110px', padding: '2px 8px', fontSize: '11px', background: 'var(--bg-secondary)', color: '#fff' }}
          >
            <option value="all">All States</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="panel-body">
        <table className="user-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Assigned Agent/User</th>
              <th>Governance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(t => (
              <tr key={t._id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{t.description || 'N/A'}</td>
                <td>
                  <span className={`status-pill ${t.status === 'completed' ? 'active' : t.status === 'in_progress' ? 'inprogress' : 'inactive'}`}
                    style={{
                      backgroundColor: t.status === 'completed' ? 'rgba(34,197,94,0.12)' : t.status === 'in_progress' ? 'rgba(108,99,255,0.15)' : 'rgba(245,158,11,0.12)',
                      color: t.status === 'completed' ? '#22C55E' : t.status === 'in_progress' ? '#6C63FF' : '#F59E0B',
                    }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {t.assignedTo?.assigneeType === 'agent'
                    ? `🤖 ${typeof t.assignedTo.agent === 'object' && t.assignedTo.agent ? (t.assignedTo.agent as { name: string }).name : 'Agent'}`
                    : `👤 ${typeof t.owner === 'object' && t.owner ? (t.owner as { name: string }).name : 'User'}`}
                </td>
                <td>
                  <div className="action-icons">
                    {t.assignedTo?.assigneeType === 'agent' && t.status === 'completed' && (
                      <i className="ti ti-terminal" title="Terminal outputs" onClick={() => onOpenConsole(t)}></i>
                    )}
                    <i className="ti ti-trash delete" title="Force erase task" onClick={() => onForceDelete(t._id)}></i>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No tasks registered in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
