import React from 'react';
import { Task, AssignedTo } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenConsole: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task, onEdit, onDelete, onOpenConsole, onDragStart, onDragEnd, isDragging,
}) => {
  return (
    <div
      className={`task-card draggable ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <h4 className="task-card-title">{task.title}</h4>
          {task.assignedTo?.assigneeType === 'agent' ? (
            <span style={{
              fontSize: '10px', color: 'var(--accent-purple)',
              background: 'rgba(108,99,255,0.12)', border: '0.5px solid rgba(108,99,255,0.2)',
              padding: '1px 6px', borderRadius: '4px', width: 'fit-content',
            }}>
              🤖 {typeof task.assignedTo.agent === 'object' && task.assignedTo.agent !== null && 'name' in task.assignedTo.agent
                ? (task.assignedTo.agent as { name: string }).name
                : 'AI Autopilot'}
            </span>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👤 Self Assigned</span>
          )}
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="task-card-desc">{task.description || 'No description added.'}</p>
      <div className="task-card-footer">
        <span className="task-owner-info" style={{
          color: task.status === 'in_progress' ? 'var(--accent-purple)' :
                 task.status === 'completed' ? 'var(--accent-emerald)' : 'var(--text-muted)',
        }}>
          {task.status === 'in_progress' ? 'Executing...' : task.status.replace('_', ' ')}
        </span>
        <div className="task-actions">
          {task.assignedTo?.assigneeType === 'agent' && task.status === 'completed' && (
            <button
              className="icon-btn" onClick={() => onOpenConsole(task)}
              style={{ width: '24px', height: '24px', color: 'var(--accent-purple)' }}
            >
              <i className="ti ti-terminal" style={{ fontSize: '12px' }}></i>
            </button>
          )}
          <button className="icon-btn" onClick={() => onEdit(task)} style={{ width: '24px', height: '24px' }}>
            <i className="ti ti-chevron-right" style={{ fontSize: '12px' }}></i>
          </button>
          <button
            className="icon-btn" onClick={() => onDelete(task._id)}
            style={{ width: '24px', height: '24px', color: 'var(--accent-rose)' }}
          >
            <i className="ti ti-trash" style={{ fontSize: '12px' }}></i>
          </button>
        </div>
      </div>
    </div>
  );
};
