import React from 'react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  dragOverColumn: string | null;
  onDragOver: (e: React.DragEvent, status: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenConsole: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  draggingTaskId: string | null;
}

const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
  pending: { icon: 'ti ti-clock', color: 'var(--accent-amber)', label: 'pending' },
  in_progress: { icon: 'ti ti-loader animate-spin', color: 'var(--accent-purple)', label: 'in progress' },
  completed: { icon: 'ti ti-circle-check', color: 'var(--accent-emerald)', label: 'completed' },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status, tasks, dragOverColumn, onDragOver, onDragLeave, onDrop,
  onEdit, onDelete, onOpenConsole, onDragStart, onDragEnd, draggingTaskId,
}) => {
  const config = statusConfig[status] || { icon: 'ti ti-circle', color: 'var(--text-muted)', label: status };

  return (
    <div
      className={`kanban-column ${dragOverColumn === status ? 'drag-over' : ''}`}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title" style={{ color: config.color }}>
          <i className={config.icon} style={{ marginRight: '6px' }}></i>
          <span>{config.label}</span>
        </div>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="kanban-tasks-list">
        {tasks.length > 0 ? (
          tasks.map(t => (
            <TaskCard
              key={t._id}
              task={t}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenConsole={onOpenConsole}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingTaskId === t._id}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)',
            fontSize: '11px', border: '1px dashed var(--border-color)', borderRadius: '8px',
          }}>
            No tasks. Drag items here.
          </div>
        )}
      </div>
    </div>
  );
};
