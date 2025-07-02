import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
          <div className="w-full max-w-lg rounded-lg bg-gray-800 p-8 text-center">
            <div className="mb-4 text-6xl text-red-500">⚠️</div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              Oups ! Une erreur s'est produite
            </h1>
            <p className="mb-6 text-gray-300">
              Une erreur inattendue a interrompu l'application. Nos développeurs
              ont été notifiés.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="mb-2 cursor-pointer text-red-400">
                  Détails de l'erreur (développement)
                </summary>
                <div className="max-h-40 overflow-auto rounded bg-gray-700 p-4 text-xs text-gray-300">
                  <div className="mb-2 font-bold text-red-400">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-4 border-t border-gray-600 pt-4">
                      <div className="mb-2 font-bold text-yellow-400">
                        Component Stack:
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="w-full rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
                type="button"
              >
                Recharger la page
              </button>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Si le problème persiste, contactez le support technique.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
  };
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
