import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  circle?: boolean;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  count = 1,
  circle = false,
  style,
}) => {
  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite',
    borderRadius: circle ? '50%' : '4px',
    width,
    height,
    marginBottom: '8px',
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={baseStyle} />
      ))}
    </>
  );
};
