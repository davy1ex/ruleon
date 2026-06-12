import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-primary p-6">
          <div className="max-w-md space-y-4 rounded border border-border bg-surface-secondary p-6 text-center">
            <h1 className="text-lg font-medium text-text-normal">
              Something went wrong
            </h1>
            <p className="text-sm text-text-muted">
              Ruleon hit an unexpected error. Your data is still saved locally.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded bg-accent px-4 py-2 text-sm text-text-on-accent hover:bg-accent-hover"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
