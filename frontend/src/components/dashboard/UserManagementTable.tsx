import React from 'react';
import { User, Task } from '../../types';

interface UserManagementTableProps {
  users: User[];
  tasks: Task[];
  currentUserId: string;
  onToggleStatus: (userId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onViewAll: () => void;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users, tasks, currentUserId, onToggleStatus, onDeleteUser, onViewAll,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const avatarColors = [
    { bg: '#6C63FF', color: '#fff' },
    { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' },
    { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
    { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  ];

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">User management</span>
        <span className="panel-action" onClick={onViewAll}>+ Add user</span>
      </div>
      <div className="panel-body">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Tasks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.slice(0, 5).map(u => {
              const userTaskCount = safeTasks.filter(t =>
                (t.owner && typeof t.owner === 'object' && '_id' in t.owner && t.owner._id === u._id)
              ).length;
              const colorIdx = u.role === 'admin' ? 0 : (u.name.charCodeAt(0) % (avatarColors.length - 1)) + 1;
              const avatarStyle = avatarColors[colorIdx];

              return (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: avatarStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 600, color: avatarStyle.color,
                      }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`role-pill ${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${u.status === 'active' ? 'active' : 'inactive'}`}
                      onClick={() => { if (u._id !== currentUserId) onToggleStatus(u._id); }}
                      style={{ cursor: u._id !== currentUserId ? 'pointer' : 'default' }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)' }}>{userTaskCount}</td>
                  <td>
                    <div className="action-icons">
                      <i className="ti ti-edit" aria-hidden="true" onClick={onViewAll} style={{ cursor: 'pointer' }}></i>
                      <i
                        className="ti ti-trash" aria-hidden="true"
                        onClick={() => { if (u._id !== currentUserId) onDeleteUser(u._id, u.name); }}
                        style={{ opacity: u._id === currentUserId ? 0.3 : 1, cursor: 'pointer' }}
                      ></i>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
