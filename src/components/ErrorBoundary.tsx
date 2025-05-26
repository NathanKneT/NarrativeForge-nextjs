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
    // Met à jour l'état pour que le prochain rendu affiche l'UI de fallback
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

    // Appeler le callback d'erreur personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optionnel: Envoyer l'erreur à un service de monitoring
    // reportErrorToService(error, errorInfo);
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
      // Utiliser le fallback personnalisé s'il est fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback par défaut
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Oups ! Une erreur s'est produite
            </h1>
            <p className="text-gray-300 mb-6">
              Une erreur inattendue a interrompu l'application. 
              Nos développeurs ont été notifiés.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-red-400 cursor-pointer mb-2">
                  Détails de l'erreur (développement)
                </summary>
                <div className="bg-gray-700 p-4 rounded text-xs text-gray-300 overflow-auto max-h-40">
                  <div className="font-bold text-red-400 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="font-bold text-yellow-400 mb-2">
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
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                type="button"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
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

// Hook pour utiliser ErrorBoundary avec des composants fonctionnels
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Optionnel: Envoyer à un service de monitoring
    // reportErrorToService(error, errorInfo);
  };
}

// HOC pour wrapper automatiquement un composant avec ErrorBoundary
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