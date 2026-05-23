import React, { useMemo } from 'react';
import { Task } from '../../types';

interface WeeklyChartProps {
  tasks: Task[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ tasks }) => {
  const breakdown = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const defaultHeights = [45, 70, 85, 35, 60, 90, 55];
    const defaultTypes = ['pending', 'inprogress', 'completed', 'pending', 'inprogress', 'completed', 'completed'];

    return days.map((day, idx) => {
      const tasksOnDay = tasks.filter(t => {
        const d = new Date(t.createdAt).getDay();
        const targetDayIdx = idx === 6 ? 0 : idx + 1;
        return d === targetDayIdx;
      });

      if (tasksOnDay.length === 0) {
        return { day, height: defaultHeights[idx], type: defaultTypes[idx] as string };
      }

      const completed = tasksOnDay.filter(t => t.status === 'completed').length;
      const inProgress = tasksOnDay.filter(t => t.status === 'in_progress').length;
      const pending = tasksOnDay.filter(t => t.status === 'pending').length;
      const total = tasksOnDay.length;

      let height = 0;
      let type = 'pending';

      if (completed >= inProgress && completed >= pending && completed > 0) {
        height = Math.max((completed / total) * 100, 15);
        type = 'completed';
      } else if (inProgress >= pending && inProgress > 0) {
        height = Math.max((inProgress / total) * 100, 15);
        type = 'inprogress';
      } else if (pending > 0) {
        height = Math.max((pending / total) * 100, 15);
        type = 'pending';
      }

      return { day, height, type };
    });
  }, [tasks]);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Task status breakdown</span>
      </div>
      <div className="panel-body">
        <div className="chart-bars">
          {breakdown.map((bar, idx) => (
            <div className="bar-wrap" key={idx}>
              <div className={`bar ${bar.type}`} style={{ height: `${bar.height}%` }}></div>
              <div className="bar-label">{bar.day}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
          <Legend color="rgba(245,158,11,0.9)" bg="rgba(245,158,11,0.6)" label="Pending" />
          <Legend color="rgba(108,99,255,0.9)" bg="rgba(108,99,255,0.7)" label="In progress" />
          <Legend color="rgba(34,197,94,0.9)" bg="rgba(34,197,94,0.6)" label="Completed" />
        </div>
      </div>
    </div>
  );
};

const Legend: React.FC<{ color: string; bg: string; label: string }> = ({ color, bg, label }) => (
  <span style={{ fontSize: '10px', color, display: 'flex', alignItems: 'center', gap: '4px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: bg, display: 'inline-block' }}></span>
    {label}
  </span>
);
