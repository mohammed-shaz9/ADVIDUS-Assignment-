import React, { useState } from 'react';
import { Task, Agent } from '../../types';

interface TaskFormModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  agents: Agent[];
  onSave: (data: { title: string; description: string; assigneeType: string; selectedAgentId: string }) => Promise<void>;
  onClose: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, editingTask, agents, onSave, onClose }) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [assigneeType, setAssigneeType] = useState<string>(editingTask?.assignedTo?.assigneeType || 'human');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    (typeof editingTask?.assignedTo?.agent === 'object' && editingTask?.assignedTo?.agent
      ? (editingTask.assignedTo.agent as { _id: string })._id
      : typeof editingTask?.assignedTo?.agent === 'string'
        ? editingTask.assignedTo.agent
        : '') || ''
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSave({ title: title.trim(), description: description.trim(), assigneeType, selectedAgentId });
    setTitle('');
    setDescription('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingTask ? 'Edit Task' : 'Create Task'}</h3>
          <i className="ti ti-x" onClick={onClose} style={{ cursor: 'pointer' }}></i>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input
                type="text" className="form-input" placeholder="Enter task title"
                value={title} onChange={(e) => setTitle(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input" rows={3} placeholder="Optional description"
                value={description} onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                className="form-input"
                value={assigneeType}
                onChange={(e) => setAssigneeType(e.target.value)}
              >
                <option value="human">Self (Human)</option>
                <option value="agent">AI Agent</option>
              </select>
            </div>
            {assigneeType === 'agent' && (
              <div className="form-group">
                <label className="form-label">Select AI Agent</label>
                <select
                  className="form-input"
                  value={selectedAgentId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAgentId(e.target.value)}
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
