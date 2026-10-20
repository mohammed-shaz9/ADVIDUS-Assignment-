import React from 'react';
import { User } from '../../types';
import { ErrorState } from '../common/ErrorState';
import { Skeleton } from '../common/Skeleton';

interface UserManagementTableProps {
  users: User[]; // first-page preview
  taskCounts: Record<string, number>; // userId -> total tasks (from analytics top-N)
  currentUserId: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleStatus: (userId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onViewAll: () => void;
}

const avatarColors = [
  { bg: '#6C63FF', color: '#fff' },
  { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' },
  { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
];

interface RowProps {
  user: User;
  taskCount?: number;
  isSelf: boolean;
  onToggleStatus: (userId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onViewAll: () => void;
}

const Row = React.memo<RowProps>(({ user: u, taskCount, isSelf, onToggleStatus, onDeleteUser, onViewAll }) => {
  const colorIdx = u.role === 'admin' ? 0 : (u.name.charCodeAt(0) % (avatarColors.length - 1)) + 1;
  const avatarStyle = avatarColors[colorIdx];
  return (
    <tr>
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
        <button
          type="button" disabled={isSelf}
          aria-label={`${u.status === 'active' ? 'Deactivate' : 'Reactivate'} ${u.name}`}
          onClick={() => onToggleStatus(u._id)}
          style={{ background: 'none', border: 0, padding: 0, cursor: isSelf ? 'default' : 'pointer' }}
        >
          <span className={`status-pill ${u.status === 'active' ? 'active' : 'inactive'}`}>{u.status}</span>
        </button>
      </td>
      <td style={{ color: 'rgba(255,255,255,0.4)' }}>{taskCount ?? '—'}</td>
      <td>
        <div className="action-icons">
          <button type="button" className="icon-btn" aria-label="Open user management" onClick={onViewAll}>
            <i className="ti ti-edit" aria-hidden="true"></i>
          </button>
          <button
            type="button" className="icon-btn" disabled={isSelf} aria-label={`Delete ${u.name}`}
            onClick={() => onDeleteUser(u._id, u.name)}
          >
            <i className="ti ti-trash" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  );
});
Row.displayName = 'UserManagementRow';

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users, taskCounts, currentUserId, loading, error, onRetry, onToggleStatus, onDeleteUser, onViewAll,
}) => {
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">User management</span>
        <span className="panel-action" onClick={onViewAll}>+ Add user</span>
      </div>
      <div className="panel-body">
        {error && safeUsers.length === 0 ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading && safeUsers.length === 0 ? (
          <Skeleton height="36px" count={5} />
        ) : safeUsers.length === 0 ? (
          <div className="empty-state">No users found.</div>
        ) : (
          <div className="table-wrap">
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
                {safeUsers.slice(0, 5).map(u => (
                  <Row
                    key={u._id} user={u} taskCount={taskCounts[u._id]} isSelf={u._id === currentUserId}
                    onToggleStatus={onToggleStatus} onDeleteUser={onDeleteUser} onViewAll={onViewAll}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
