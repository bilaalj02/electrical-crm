import { Component } from 'react';
import { reportError } from '../monitoring';

// If a page crashes, show a calm message instead of a blank screen, and
// report it so we hear about it right away.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (info?.componentStack) err.stack = `${err.stack || ''}\n${info.componentStack.split('\n').slice(0, 6).join('\n')}`;
    reportError(err, 'render');
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ padding: '48px 32px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#1f2328' }}>Something went wrong on this page</h2>
        <p style={{ color: '#6b7177', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
          We've been notified automatically and will look into it. Your data is safe. Try reloading, or use another page in the meantime.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: '#c9a548', color: '#0d1117', border: 0, borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}
        >
          Reload
        </button>
      </div>
    );
  }
}
