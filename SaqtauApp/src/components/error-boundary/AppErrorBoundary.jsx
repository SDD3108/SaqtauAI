import React, { Component } from 'react';

import ErrorFallbackScreen from '@/src/components/error-boundary/ErrorFallbackScreen';

export default class AppErrorBoundary extends Component {
  state = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('SaqtauAI render error', error, info);
    }
  }

  reset = () => {
    this.setState((state) => ({ error: null, resetKey: state.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return <ErrorFallbackScreen onRetry={this.reset} />;
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
