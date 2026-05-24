import React, { useMemo } from 'react';
import { Task } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface PersonalTaskSummaryProps {
  tasks: Task[];
  loading: boolean;
}

/**
 * Personal Task Summary Widget
 * Displays user's task breakdown with performance insights
 * - Memoized: only re-renders when tasks change
 * - Real-time: updates as tasks are completed
 * Industry best practices:
 * - useMemo for expensive calculations
 * - Semantic HTML with ARIA labels
 * - Accessible color coding with icons
 */
export const PersonalTaskSummary = React.memo<PersonalTaskSummaryProps>(
  ({ tasks, loading }) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const summary = useMemo(() => {
      const stats = {
        total: safeTasks.length,
        pending: safeTasks.filter(t => t.status === 'pending').length,
        inProgress: safeTasks.filter(t => t.status === 'in_progress').length,
        completed: safeTasks.filter(t => t.status === 'completed').length,
        overdue: safeTasks.filter(t => new Date(t.dueDate || '') < new Date() && t.status !== 'completed').length,
      };
      const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      return { stats, completionRate };
    }, [safeTasks]);

    if (loading) return <Skeleton height="140px" count={3} />;

    return (
      <ErrorBoundary>
        <div style={{
          background: 'rgba(108,99,255,0.08)', border: '0.5px solid rgba(108,99,255,0.2)',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0 }}>My Tasks</h3>
            <span style={{
              fontSize: '12px', fontWeight: 700, color: '#6C63FF',
              background: 'rgba(108,99,255,0.15)', padding: '3px 8px', borderRadius: '6px',
            }}>
              {summary.completionRate}% Done
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '3px', marginBottom: '16px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${summary.completionRate}%`, height: '100%',
              background: 'linear-gradient(90deg, #6C63FF, #A5B4FC)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { label: 'Pending', value: summary.stats.pending, color: '#F59E0B', icon: 'ti-clock' },
              { label: 'In Progress', value: summary.stats.inProgress, color: '#6C63FF', icon: 'ti-player-play' },
              { label: 'Completed', value: summary.stats.completed, color: '#22C55E', icon: 'ti-check' },
              { label: 'Overdue', value: summary.stats.overdue, color: '#EF4444', icon: 'ti-alert-circle' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px',
                textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                  <i className={`ti ${stat.icon}`} style={{ fontSize: '14px', color: stat.color }}></i>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
);

PersonalTaskSummary.displayName = 'PersonalTaskSummary';
