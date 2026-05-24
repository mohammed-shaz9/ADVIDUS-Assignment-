import React from 'react';
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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks, draggingTaskId, dragOverColumn,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onEdit, onDelete, onOpenConsole,
}) => {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  return (
    <div className="kanban-board">
      {COLUMNS.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={safeTasks.filter(t => t.status === status)}
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
};
