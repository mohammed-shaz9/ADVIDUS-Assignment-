import React, { useState, useCallback } from 'react';
import { User } from '../../types';
import { adminApi } from '../../services/api';
import { usePagedList } from '../../hooks/usePagedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSocketRefetch } from '../../hooks/useSocketRefetch';
import { Pager } from '../common/Pager';
import { ErrorState } from '../common/ErrorState';
import { Skeleton } from '../common/Skeleton';

interface UserTableProps {
  currentUserId: string;
  onToggleStatus: (id: string) => Promise<unknown>;
  onDelete: (id: string, name: string) => Promise<unknown>;
}

const PAGE_SIZE = 25;
const USER_EVENTS = ['user.status_changed'];

interface UserRowProps {
  user: User;
  isSelf: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

const UserRow = React.memo<UserRowProps>(({ user: u, isSelf, onToggle, onDelete }) => (
  <tr>
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
        <button
          type="button" className="icon-btn" disabled={isSelf}
          aria-label={`${u.status === 'active' ? 'Deactivate' : 'Reactivate'} ${u.name}`}
          title={u.status === 'active' ? 'Deactivate' : 'Reactivate'}
          onClick={() => onToggle(u._id)}
        >
          <i className={u.status === 'active' ? 'ti ti-user-off' : 'ti ti-user-check'} aria-hidden="true"></i>
        </button>
        {!isSelf && (
          <button
            type="button" className="icon-btn" aria-label={`Erase ${u.name}`} title="Erase user"
            onClick={() => onDelete(u._id, u.name)}
          >
            <i className="ti ti-trash delete" aria-hidden="true"></i>
          </button>
        )}
      </div>
    </td>
  </tr>
));
UserRow.displayName = 'UserRow';

export const UserTable: React.FC<UserTableProps> = ({ currentUserId, onToggleStatus, onDelete }) => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const q = useDebouncedValue(search.trim(), 300);

  const { data, loading, error, page, setPage, reload } = usePagedList<User>(
    (p, signal) => adminApi.getUsers({
      page: p, limit: PAGE_SIZE, q,
      role: role as 'all' | 'admin' | 'user',
      status: status as 'all' | 'active' | 'inactive',
    }, signal),
    `${q}|${role}|${status}`,
  );
  useSocketRefetch(USER_EVENTS, reload);

  const handleToggle = useCallback((id: string) => { onToggleStatus(id).then(reload); }, [onToggleStatus, reload]);
  const handleDelete = useCallback((id: string, name: string) => { onDelete(id, name).then(reload); }, [onDelete, reload]);

  const items = data?.items ?? [];

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">User directory management</span>
        <div className="toolbar">
          <input
            type="search" className="form-input search-input" placeholder="Search name or email..."
            aria-label="Search users by name or email"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input filter-select" aria-label="Filter users by role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select className="form-input filter-select" aria-label="Filter users by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="panel-body">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <Skeleton height="36px" count={8} />
        ) : (
          <>
            <div className="table-wrap" aria-busy={loading}>
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
                  {items.map(u => (
                    <UserRow key={u._id} user={u} isSelf={u._id === currentUserId} onToggle={handleToggle} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && <div className="empty-state">No system users found.</div>}
            {data && <Pager page={page} totalPages={data.totalPages} total={data.total} loading={loading} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
};
