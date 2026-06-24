import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--app-bg)]">
          <div className="max-w-md w-full text-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-lg">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--app-danger)]/10 text-[var(--app-danger)] flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-xl font-bold text-[var(--app-text)]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              An unexpected error occurred. Please refresh the page.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
