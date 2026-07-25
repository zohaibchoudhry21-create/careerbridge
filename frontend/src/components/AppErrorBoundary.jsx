import React from 'react';
import AppIcon from './icons/AppIcon';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-md">
        <div className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center max-w-lg w-full">
          <AppIcon name="error" size="h-8 w-8" className="text-error mb-sm mx-auto" />
          <h1 className="font-headline-section text-headline-section text-on-surface mb-xs">
            Something went wrong
          </h1>
          <p className="font-body-md text-on-surface-variant mb-md">
            The app hit an unexpected error. You can reload and try again.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-3 bg-secondary text-on-secondary rounded-2xl font-label-md dashboard-btn-glow"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
