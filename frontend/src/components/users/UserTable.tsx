import React from 'react';
import { User } from '../../types';

interface UserTableProps {
  users: User[];
  currentUserId: string;
  search: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users, currentUserId, search, statusFilter,
  onSearchChange, onStatusFilterChange, onToggleStatus, onDelete,
}) => {
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">User directory management</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text" className="form-input" placeholder="Filter name or email..."
            value={search} onChange={(e) => onSearchChange(e.target.value)}
            style={{ height: '30px', width: '180px', padding: '4px 10px', fontSize: '11px' }}
          />
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{ height: '30px', width: '100px', padding: '2px 8px', fontSize: '11px', background: 'var(--bg-secondary)', color: '#fff' }}
          >
            <option value="all">All States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="panel-body">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action Control</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: u.role === 'admin' ? '#6C63FF' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: 600, color: '#fff',
                    }}>{u.name.slice(0, 2).toUpperCase()}</div>
                    {u.name}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className={`role-pill ${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role}</span></td>
                <td><span className={`status-pill ${u.status === 'active' ? 'active' : 'inactive'}`}>{u.status}</span></td>
                <td>
                  <div className="action-icons">
                    <i
                      className={u.status === 'active' ? 'ti ti-user-off' : 'ti ti-user-check'}
                      title={u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      onClick={() => onToggleStatus(u._id)}
                      style={{ opacity: u._id === currentUserId ? 0.3 : 1, pointerEvents: u._id === currentUserId ? 'none' : 'auto' }}
                    ></i>
                    {u._id !== currentUserId && (
                      <i className="ti ti-trash delete" title="Erase user" onClick={() => onDelete(u._id, u.name)}></i>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No system users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
