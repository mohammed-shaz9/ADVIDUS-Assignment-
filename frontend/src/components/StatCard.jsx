import React from 'react';

const StatCard = ({ label, value, icon, gradient, glowColor }) => {
  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-normal)',
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-sm)',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
          boxShadow: `0 0 20px ${glowColor || 'rgba(99,102,241,0.3)'}`,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
