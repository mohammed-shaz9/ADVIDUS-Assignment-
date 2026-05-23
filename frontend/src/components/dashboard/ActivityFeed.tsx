import React from 'react';
import { ActivityLog } from '../../types';

interface ActivityFeedProps {
  logs: ActivityLog[];
  onViewAll: () => void;
}

const getIconClass = (action: string) => {
  switch (action) {
    case 'LOGIN': return 'ti ti-login';
    case 'TASK_CREATED': return 'ti ti-plus';
    case 'TASK_UPDATED': return 'ti ti-edit';
    case 'TASK_DELETED': return 'ti ti-trash';
    case 'AGENT_CREATED': return 'ti ti-cpu';
    default: return 'ti ti-activity';
  }
};

const getBadgeStyle = (action: string): string => {
  switch (action) {
    case 'LOGIN': case 'REGISTER': return 'login';
    case 'TASK_CREATED': return 'create';
    case 'TASK_UPDATED': return 'update';
    case 'TASK_DELETED': case 'AGENT_DELETED': return 'delete';
    default: return 'update';
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onViewAll }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">Activity feed</span>
      <span className="panel-action" onClick={onViewAll}>View audit logs</span>
    </div>
    <div className="panel-body">
      <div className="activity-list">
        {logs.length > 0 ? (
          logs.slice(0, 4).map(log => (
            <div className="activity-item" key={log._id}>
              <div className={`act-dot ${getBadgeStyle(log.action)}`}>
                <i className={getIconClass(log.action)} aria-hidden="true"></i>
              </div>
              <div className="act-info">
                <div className="act-text">
                  <strong>{log.userId?.name || 'System Gateway'}</strong> {log.details}
                </div>
                <div className="act-time">{new Date(log.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No recent activities logged.
          </div>
        )}
      </div>
    </div>
  </div>
);
