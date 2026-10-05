import React from 'react';
import { Control, StateMessage } from '../styles/primitives';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <StateMessage role="alert">
          <h2>This view could not load</h2>
          <p>Your inventory is still available. Reload to try again.</p>
          <details><summary>Error details</summary><p>{this.state.error?.message}</p></details>
          <Control type="button" onClick={() => window.location.reload()}>Reload view</Control>
        </StateMessage>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
