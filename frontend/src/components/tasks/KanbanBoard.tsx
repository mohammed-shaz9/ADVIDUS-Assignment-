import React, { useMemo } from 'react';
import { Task } from '../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  draggingTaskId: string | null;
  dragOverColumn: string | null;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, status: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenConsole: (task: Task) => void;
}

const COLUMNS = ['pending', 'in_progress', 'completed'];

export const KanbanBoard = React.memo<KanbanBoardProps>(({
  tasks, draggingTaskId, dragOverColumn,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onEdit, onDelete, onOpenConsole,
}) => {
  // One pass to bucket tasks by status (instead of one filter per column).
  const byStatus = useMemo(() => {
    const buckets: Record<string, Task[]> = { pending: [], in_progress: [], completed: [] };
    if (Array.isArray(tasks)) tasks.forEach(t => buckets[t.status]?.push(t));
    return buckets;
  }, [tasks]);
  return (
    <div className="kanban-board">
      {COLUMNS.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={byStatus[status]}
          dragOverColumn={dragOverColumn}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenConsole={onOpenConsole}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          draggingTaskId={draggingTaskId}
        />
      ))}
    </div>
  );
});
KanbanBoard.displayName = 'KanbanBoard';
