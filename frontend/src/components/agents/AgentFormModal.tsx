import React, { useState } from 'react';

interface AgentFormModalProps {
  isOpen: boolean;
  onSave: (data: { name: string; role: string; systemPrompt: string; modelName: string }) => Promise<void>;
  onClose: () => void;
}

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'gemini-1.5-pro', 'claude-3.5-sonnet', 'claude-3-haiku'];

export const AgentFormModal: React.FC<AgentFormModalProps> = ({ isOpen, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelName, setModelName] = useState('gpt-4o');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !systemPrompt.trim()) return;
    await onSave({ name: name.trim(), role: role.trim(), systemPrompt: systemPrompt.trim(), modelName });
    setName('');
    setRole('');
    setSystemPrompt('');
    setModelName('gpt-4o');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Register AI Agent</h3>
          <i className="ti ti-x" onClick={onClose} style={{ cursor: 'pointer' }}></i>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Agent Name</label>
              <input type="text" className="form-input" placeholder="e.g. Sentinel Debugger" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role / Specialty</label>
              <input type="text" className="form-input" placeholder="e.g. Code Debugger" value={role} onChange={(e) => setRole(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">System Prompt</label>
              <textarea className="form-input" rows={4} placeholder="Define the agent's purpose and behavior..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} required style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select className="form-input" value={modelName} onChange={(e) => setModelName(e.target.value)}>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Register Agent</button>
          </div>
        </form>
      </div>
    </div>
  );
};
