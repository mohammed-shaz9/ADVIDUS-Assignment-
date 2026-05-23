import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { adminApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, addToast } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers();
      if (res.success && res.data) setUsers(res.data);
    } catch {}
    finally { setLoading(false) }
  }, []);

  useEffect(() => { if (user?.role === 'admin') fetchUsers() }, [fetchUsers, user]);

  const roleColors: Record<string, string> = {
    admin: '#3b82f6',
    user: '#8e90a6',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2><i className="ti ti-shield"></i> Identity & Access</h2>
        <p className="text-muted">User roles, permissions, and authentication settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header"><h3>Your Account</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{user?.name?.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{user?.name}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 13 }}>
              <div><span className="text-muted">Role:</span> <span className="badge" style={{ background: roleColors[user?.role || 'user'], color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{user?.role}</span></div>
              <div><span className="text-muted">Status:</span> <span style={{ color: user?.status === 'active' ? 'var(--accent-green)' : 'var(--accent-rose)' }}>{user?.status}</span></div>
              <div><span className="text-muted">Last Login:</span> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Security</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Multi-Factor Auth</span>
                <span className="badge badge-info" style={{ fontSize: 11 }}>Enabled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Session Timeout</span>
                <span style={{ fontWeight: 500 }}>60 min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Password Policy</span>
                <span style={{ fontWeight: 500 }}>Strong</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Last Password Change</span>
                <span className="text-muted" style={{ fontSize: 12 }}>30 days ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Role & Permissions</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Task Management</span>
                <span style={{ color: 'var(--accent-green)' }}>Read/Write</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>User Management</span>
                <span style={{ color: user?.role === 'admin' ? 'var(--accent-green)' : 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Full Access' : 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Analytics</span>
                <span style={{ color: user?.role === 'admin' ? 'var(--accent-green)' : 'var(--accent-green)' }}>View Only</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Approvals</span>
                <span style={{ color: user?.role === 'admin' ? 'var(--accent-green)' : 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Full Access' : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="card">
          <div className="card-header"><h3><i className="ti ti-users"></i> User Directory ({users.length})</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
              </thead>
              <tbody>
                {users.map((u: User) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td><span className="badge" style={{ background: roleColors[u.role], color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{u.role}</span></td>
                    <td><span style={{ color: u.status === 'active' ? 'var(--accent-green)' : 'var(--accent-rose)' }}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
