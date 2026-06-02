import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** When any value in resetKeys changes, the boundary clears its error (e.g. on route change). */
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors in its subtree and shows a recoverable fallback
 * instead of unmounting the whole React tree to a blank screen.
 *
 * Use one at the app root (around <Routes>) and one per route (around <Outlet/>),
 * passing resetKeys={[location.pathname]} so navigating away clears a crashed page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    if (!this.state.hasError || !resetKeys || !prevProps.resetKeys) return;
    const changed =
      prevProps.resetKeys.length !== resetKeys.length ||
      prevProps.resetKeys.some((k, i) => !Object.is(k, resetKeys[i]));
    if (changed) this.reset();
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-3xl">😕</div>
        <p className="text-lg font-semibold text-foreground">Something went wrong.</p>
        <p className="text-sm text-muted-foreground max-w-md">
          This section hit an unexpected error. You can try again or head back home.
        </p>
        <div className="mt-1 flex gap-2">
          <button
            onClick={this.reset}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
