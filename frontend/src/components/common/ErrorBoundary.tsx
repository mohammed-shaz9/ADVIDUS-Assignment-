import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '200px', padding: '40px', color: 'var(--text-muted)', textAlign: 'center',
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '32px', color: '#EF4444', marginBottom: '12px' }}></i>
          <h3 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>Something went wrong</h3>
          <p style={{ fontSize: '13px', maxWidth: '400px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px', padding: '8px 20px', background: '#6C63FF', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
