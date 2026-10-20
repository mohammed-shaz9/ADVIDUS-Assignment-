import React, { useState } from 'react';
import { ActivityLog } from '../../types';
import { adminApi } from '../../services/api';
import { usePagedList } from '../../hooks/usePagedList';
import { useSocketRefetch } from '../../hooks/useSocketRefetch';
import { Pager } from '../common/Pager';
import { ErrorState } from '../common/ErrorState';
import { Skeleton } from '../common/Skeleton';

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
const PAGE_SIZE = 25;
const LOG_EVENTS = ['activity.created'];

const LogRow = React.memo<{ log: ActivityLog }>(({ log }) => (
  <tr>
    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
      {new Date(log.createdAt).toLocaleString()}
    </td>
    <td>{log.userId?.name || 'System'}</td>
    <td>
      <span className="action-badge">
        <i className={getIconClass(log.action)} style={{ marginRight: '4px', fontSize: '12px' }} aria-hidden="true"></i>
        {log.action.replace(/_/g, ' ')}
      </span>
    </td>
    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.details}</td>
  </tr>
));
LogRow.displayName = 'LogRow';

export const ActivityLogTable: React.FC = () => {
  const [action, setAction] = useState('all');

  const { data, loading, error, page, setPage, reload } = usePagedList<ActivityLog>(
    (p, signal) => adminApi.getLogs({ page: p, limit: PAGE_SIZE, action }, signal),
    action,
  );
  useSocketRefetch(LOG_EVENTS, reload);

  const items = data?.items ?? [];

  return (
    <div className="panel animate-slide-up">
      <div className="panel-header">
        <span className="panel-title">Security Audit Streams</span>
        <div className="toolbar">
          <select className="form-input filter-select" aria-label="Filter logs by action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
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
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(log => <LogRow key={log._id} log={log} />)}
                </tbody>
              </table>
            </div>
            {items.length === 0 && <div className="empty-state">No activity logs found.</div>}
            {data && <Pager page={page} totalPages={data.totalPages} total={data.total} loading={loading} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
};
