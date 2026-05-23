import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, fullPage }) => {
  const containerStyle: React.CSSProperties = fullPage
    ? { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' };

  return (
    <div style={containerStyle}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-indigo)',
        animation: 'spin 1s linear infinite', marginBottom: '12px',
      }} />
      {message && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {message}
        </p>
      )}
    </div>
  );
};
