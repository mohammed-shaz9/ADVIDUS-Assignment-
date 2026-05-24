import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) ?? (
          <div style={{
            padding: '12px', background: 'rgba(239,68,68,0.1)',
            border: '0.5px solid rgba(239,68,68,0.3)', borderRadius: '8px',
            color: '#fca5a5', fontSize: '12px',
          }}>
            <i className="ti ti-alert-circle" style={{ marginRight: '6px' }}></i>
            Widget failed to load
          </div>
        )
      );
    }
    return this.props.children;
  }
}
