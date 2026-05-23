import React from 'react';
import { Task } from '../../types';

interface AgentConsoleModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onRerun: () => void;
}

export const AgentConsoleModal: React.FC<AgentConsoleModalProps> = ({ isOpen, task, onClose, onRerun }) => {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="ti ti-terminal" style={{ marginRight: '8px' }}></i>AI Agent Console — {task.title}</h3>
          <i className="ti ti-x" onClick={onClose} style={{ cursor: 'pointer' }}></i>
        </div>
        <div className="modal-body">
          <div className="console-view">
            {task.executionLogs && task.executionLogs.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Execution Logs
                </h4>
                {task.executionLogs.map((log, idx) => (
                  <div key={idx} className="console-line" style={{
                    display: 'flex', gap: '10px', padding: '6px 0',
                    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                    fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: '70px' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{
                      color: log.status === 'success' ? '#22C55E' :
                             log.status === 'error' ? '#EF4444' :
                             log.status === 'warning' ? '#F59E0B' : '#6C63FF',
                      minWidth: '120px',
                    }}>
                      [{log.step}]
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{log.description}</span>
                  </div>
                ))}
              </div>
            )}

            {task.result && (
              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Output Result
                </h4>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px',
                  fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.85)',
                  maxHeight: '300px', overflow: 'auto',
                }}>
                  {task.result}
                </pre>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn-primary" onClick={onRerun}>
            <i className="ti ti-refresh" style={{ marginRight: '6px' }}></i>Re-execute Task
          </button>
        </div>
      </div>
    </div>
  );
};
