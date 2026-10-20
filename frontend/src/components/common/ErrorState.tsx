import React from 'react';

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="empty-state" role="alert">
    <p>{message}</p>
    <button type="button" className="btn-primary btn-sm" onClick={onRetry}>Retry</button>
  </div>
);
