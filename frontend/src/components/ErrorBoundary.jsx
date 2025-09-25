import React from 'react';
import styled from 'styled-components';

const Fallback = styled.div`
  background: #1a1a1a;
  color: #ff6b6b;
  padding: 1.5rem;
  margin: 1rem;
  border: 1px solid #ff6b6b;
  border-radius: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
  box-shadow: 0 0 12px rgba(255, 0, 0, 0.4);

  h2 {
    margin-top: 0;
    color: #ff8080;
    font-size: 1.25rem;
  }

  pre {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

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
        <Fallback>
          <h2>Something went wrong 😬</h2>
          <pre>{this.state.error?.message}</pre>
        </Fallback>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
