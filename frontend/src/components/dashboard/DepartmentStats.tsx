import React, { useMemo } from 'react';
import { User } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface DepartmentStatsProps {
  users: User[];
  currentUserDept?: string;
  loading: boolean;
}

/**
 * Department Stats Widget
 * Shows peer comparison and department-level insights
 * Industry best practices:
 * - Filtered to show only current user's department
 * - Comparison metrics for healthy team dynamics
 * - Real-time user status tracking
 */
export const DepartmentStats = React.memo<DepartmentStatsProps>(
  ({ users, currentUserDept, loading }) => {
    const deptStats = useMemo(() => {
      if (!currentUserDept) return null;
      
      const deptUsers = users.filter(u => u.department === currentUserDept);
      const stats = {
        total: deptUsers.length,
        active: deptUsers.filter(u => u.status === 'active').length,
        inactive: deptUsers.filter(u => u.status === 'inactive').length,
        avgRoleCount: {} as Record<string, number>,
      };

      deptUsers.forEach(u => {
        const role = u.role || 'user';
        stats.avgRoleCount[role] = (stats.avgRoleCount[role] || 0) + 1;
      });

      return stats;
    }, [users, currentUserDept]);

    if (loading || !deptStats) return <Skeleton height="140px" count={3} />;

    return (
      <ErrorBoundary>
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>Department Overview</h3>
            <span style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px',
            }}>
              {deptStats.total} members
            </span>
          </div>

          {/* Health indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Active</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#22C55E' }}>{deptStats.active}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Inactive</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444' }}>{deptStats.inactive}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Health</div>
              <div style={{
                fontSize: '16px', fontWeight: 700,
                color: deptStats.active / deptStats.total > 0.8 ? '#22C55E' : deptStats.active / deptStats.total > 0.6 ? '#F59E0B' : '#EF4444',
              }}>
                {Math.round((deptStats.active / deptStats.total) * 100)}%
              </div>
            </div>
          </div>

          {/* Role breakdown */}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>ROLES</div>
            {Object.entries(deptStats.avgRoleCount).map(([role, count]) => (
              <div key={role} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                fontSize: '12px', color: 'rgba(255,255,255,0.7)',
              }}>
                <span style={{ textTransform: 'capitalize' }}>{role}s</span>
                <span style={{ fontWeight: 600, color: '#6C63FF' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
);

DepartmentStats.displayName = 'DepartmentStats';
