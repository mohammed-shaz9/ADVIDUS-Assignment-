import React, { useState, useCallback } from 'react';
import { Task } from '../../types';
import { adminApi } from '../../services/api';
import { usePagedList } from '../../hooks/usePagedList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSocketRefetch } from '../../hooks/useSocketRefetch';
import { Pager } from '../common/Pager';
import { ErrorState } from '../common/ErrorState';
import { Skeleton } from '../common/Skeleton';

interface TaskMonitorTableProps {
  onOpenConsole: (task: Task) => void;
  onForceDelete: (taskId: string) => Promise<unknown>;
}

const PAGE_SIZE = 25;
const TASK_EVENTS = ['task.created', 'task.updated', 'task.deleted'];

interface TaskRowProps {
  task: Task;
  onOpenConsole: (task: Task) => void;
  onForceDelete: (taskId: string) => void;
}

const TaskRow = React.memo<TaskRowProps>(({ task: t, onOpenConsole, onForceDelete }) => (
  <tr>
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
          <button type="button" className="icon-btn" aria-label={`View terminal output for ${t.title}`} title="Terminal outputs" onClick={() => onOpenConsole(t)}>
            <i className="ti ti-terminal" aria-hidden="true"></i>
          </button>
        )}
        <button type="button" className="icon-btn" aria-label={`Force erase task ${t.title}`} title="Force erase task" onClick={() => onForceDelete(t._id)}>
          <i className="ti ti-trash delete" aria-hidden="true"></i>
        </button>
      </div>
    </td>
  </tr>
));
TaskRow.displayName = 'TaskRow';

export const TaskMonitorTable: React.FC<TaskMonitorTableProps> = ({ onOpenConsole, onForceDelete }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const q = useDebouncedValue(search.trim(), 300);

  const { data, loading, error, page, setPage, reload } = usePagedList<Task>(
    (p, signal) => adminApi.getTasks({ page: p, limit: PAGE_SIZE, q, status: status as 'all' | Task['status'] }, signal),
    `${q}|${status}`,
  );
  useSocketRefetch(TASK_EVENTS, reload);

  const handleDelete = useCallback((id: string) => { onForceDelete(id).then(reload); }, [onForceDelete, reload]);

  const items = data?.items ?? [];

  return (
    <div className="panel" style={{ marginTop: '12px' }}>
      <div className="panel-header">
        <span className="panel-title">System Task Governance</span>
        <div className="toolbar">
          <input
            type="search" className="form-input search-input" placeholder="Search global tasks..."
            aria-label="Search all tasks"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input filter-select" aria-label="Filter tasks by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All States</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
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
                    <th>Task Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Assigned Agent/User</th>
                    <th>Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <TaskRow key={t._id} task={t} onOpenConsole={onOpenConsole} onForceDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && <div className="empty-state">No tasks found.</div>}
            {data && <Pager page={page} totalPages={data.totalPages} total={data.total} loading={loading} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
};
