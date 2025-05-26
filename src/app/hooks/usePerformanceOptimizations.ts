import React, { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook pour optimiser les re-renders avec React.memo et useMemo
 */
export const useStableCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    deps
  );
};

/**
 * Hook pour debouncer les opérations coûteuses
 */
export const useDebouncedCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, ...deps]
  );
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback as T;
};

/**
 * Hook pour throttler les mises à jour fréquentes
 */
export const useThrottledCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T => {
  const lastRunRef = useRef<number>(0);
  
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now;
        callback(...args);
      }
    },
    [callback, delay, ...deps]
  );
  
  return throttledCallback as T;
};

// Interface pour les métriques de performance
export interface PerformanceMetrics {
  renderCount: number;
  markStart: () => void;
  markEnd: (operation: string) => number;
}

/**
 * Hook pour monitoring des performances - version corrigée avec types stricts
 */
export const usePerformanceMonitor = (componentName: string): PerformanceMetrics => {
  const renderCount = useRef(0);
  const startTime = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Vérifier que performance.now() est disponible avec type guard
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[PERF] ${componentName} - Render #${renderCount.current} - ${renderTime.toFixed(2)}ms`
        );
      }
      
      startTime.current = performance.now();
    }
  });
  
  return {
    renderCount: renderCount.current,
    markStart: (): void => { 
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        startTime.current = performance.now(); 
      }
    },
    markEnd: (operation: string): number => {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const duration = performance.now() - startTime.current;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PERF] ${componentName}.${operation} - ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
      return 0;
    }
  };
};

// Hook optimisé pour Zustand avec types stricts
export const useOptimizedSelector = <T, U>(
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean
) => {
  const selectedValue = useRef<U>();
  
  return useCallback((state: T): U => {
    const newValue = selector(state);
    
    if (equalityFn) {
      if (!selectedValue.current || !equalityFn(selectedValue.current, newValue)) {
        selectedValue.current = newValue;
      }
      return selectedValue.current;
    }
    
    return newValue;
  }, [selector, equalityFn]);
};

// Interface pour le monitoring avancé - Types stricts pour exactOptionalPropertyTypes
interface AdvancedPerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | undefined;
  renderTime: number;
  componentName: string;
}

/**
 * Hook avancé pour monitoring avec métriques mémoire
 */
export const useAdvancedPerformanceMonitor = (
  componentName: string
): AdvancedPerformanceMetrics => {
  const startTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<AdvancedPerformanceMetrics>({
    renderTime: 0,
    componentName,
    memoryUsage: undefined, // Défini explicitement pour exactOptionalPropertyTypes
  });

  useEffect(() => {
    startTime.current = performance.now();
  }, []);

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    // Obtenir les métriques mémoire si disponibles
    let memoryUsage: AdvancedPerformanceMetrics['memoryUsage'] = undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }

    setMetrics({
      renderTime,
      componentName,
      memoryUsage, // Correctement typé maintenant
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${componentName} - Render time: ${renderTime.toFixed(2)}ms`, {
        memory: memoryUsage,
      });
    }
  });

  return metrics;
};

// Hook pour mesurer le temps d'une fonction
export const useTimedFunction = <T extends (...args: never[]) => unknown>(
  fn: T,
  name: string
): T => {
  return useCallback(
    ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${name} executed in ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T,
    [fn, name]
  );
};

// Hook pour mesurer automatiquement les performances des composants - CORRIGÉ
export const useComponentPerformance = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  displayName?: string
): React.ComponentType<P> => {
  // Créer un composant wrapper avec forwardRef correctement typé
  const ComponentWithPerformance = React.forwardRef<unknown, P>((props, ref) => {
    const componentName = displayName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    const { markStart, markEnd } = usePerformanceMonitor(componentName);
    
    useEffect(() => {
      markStart();
      return () => {
        markEnd('render');
      };
    });

    // Utiliser createElement pour gérer correctement la ref
    return React.createElement(WrappedComponent, { ...props, ref } as P & { ref?: unknown });
  });

  // Définir le displayName pour le debugging
  ComponentWithPerformance.displayName = `withPerformance(${displayName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown'})`;

  // Type assertion sécurisée via unknown pour satisfaire TypeScript strict
  return ComponentWithPerformance as unknown as React.ComponentType<P>;
};

// Export par défaut avec tous les hooks
const PerformanceHooks = {
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMonitor,
  useOptimizedSelector,
  useAdvancedPerformanceMonitor,
  useTimedFunction,
  useComponentPerformance,
} as const;

export default PerformanceHooks;