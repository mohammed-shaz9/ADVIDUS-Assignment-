import React, { useMemo } from 'react';
import { ActivityLog } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface TeamActivityFeedProps {
  logs: ActivityLog[];
  currentUserId: string;
  loading: boolean;
}

/**
 * Team Activity Feed Widget
 * Real-time activity stream from team members
 * Industry best practices:
 * - Filters out personal activities, shows team actions
 * - Real-time WebSocket updates
 * - Chronological sorting with time ago format
 * - Activity icons for quick recognition
 * - Pagination ready (shows top 5)
 */
export const TeamActivityFeed = React.memo<TeamActivityFeedProps>(
  ({ logs, currentUserId, loading }) => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const teamActivity = useMemo(() => {
      // Filter team activities (exclude current user's own actions)
      const filtered = safeLogs
        .filter(log => {
          // log.userId may be a Pick<User, '_id' | 'name' | 'email' | 'role'>; compare by _id
          const userIdObj = log.userId as any;
          return (userIdObj && userIdObj._id ? String(userIdObj._id) : String(userIdObj)) !== String(currentUserId);
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5); // Top 5 recent

      return filtered;
    }, [safeLogs, currentUserId]);

    const getActionIcon = (action: string): { icon: string; color: string } => {
      const iconMap: Record<string, { icon: string; color: string }> = {
        'TASK_CREATED': { icon: 'ti-plus-circle', color: '#6C63FF' },
        'TASK_ASSIGNED': { icon: 'ti-send', color: '#22C55E' },
        'TASK_STATUS_CHANGE': { icon: 'ti-arrow-right', color: '#F59E0B' },
        'TASK_COMPLETED': { icon: 'ti-check-circle', color: '#22C55E' },
        'USER_LOGIN': { icon: 'ti-login', color: '#6C63FF' },
        'USER_LOGOUT': { icon: 'ti-logout', color: '#EF4444' },
        'APPROVAL_REQUESTED': { icon: 'ti-alert-circle', color: '#F59E0B' },
        'APPROVAL_APPROVED': { icon: 'ti-check', color: '#22C55E' },
        'APPROVAL_REJECTED': { icon: 'ti-x', color: '#EF4444' },
      };
      return iconMap[action] || { icon: 'ti-activity', color: '#A5B4FC' };
    };

    const formatTimeAgo = (date: string | Date): string => {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    if (loading) return <Skeleton height="180px" count={4} />;

    return (
      <ErrorBoundary>
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.2)',
          borderRadius: '12px', padding: '16px',
        }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>
            <i className="ti ti-activity" style={{ marginRight: '6px' }}></i>
            Team Activity
          </h3>

          {teamActivity.length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)',
              fontSize: '12px',
            }}>
              <i className="ti ti-inbox" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
              {loading ? 'Loading team activity...' : 'No recent team activity'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamActivity.map((log, idx) => {
                const { icon, color } = getActionIcon(log.action);
                return (
                  <div key={idx} style={{
                    display: 'flex', gap: '10px', padding: '10px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                    borderLeft: `2px solid ${color}`,
                  }}>
                    <i className={`ti ${icon}`} style={{
                      fontSize: '16px', color, flexShrink: 0,
                      marginTop: '2px',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                        marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      <div style={{
                        fontSize: '10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis', marginBottom: '4px',
                      }}>
                        {log.details}
                      </div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                        {formatTimeAgo(log.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }
);

TeamActivityFeed.displayName = 'TeamActivityFeed';
