// hooks/usePerformanceOptimizations.ts
import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Hook pour optimiser les re-renders avec React.memo et useMemo
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
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
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
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
export const useThrottledCallback = <T extends (...args: any[]) => any>(
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

/**
 * Hook pour monitoring des performances
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[PERF] ${componentName} - Render #${renderCount.current} - ${renderTime.toFixed(2)}ms`
      );
    }
    
    startTime.current = performance.now();
  });
  
  return {
    renderCount: renderCount.current,
    markStart: () => { startTime.current = performance.now(); },
    markEnd: (operation: string) => {
      const duration = performance.now() - startTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${componentName}.${operation} - ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
};

// Types pour une meilleure intégration
export interface PerformanceMetrics {
  renderCount: number;
  markStart: () => void;
  markEnd: (operation: string) => number;
}

// Hook optimisé pour Zustand
export const useOptimizedSelector = <T, U>(
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean
) => {
  const selectedValue = useRef<U>();
  
  return useCallback((state: T) => {
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

// Export par défaut
export default {
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMonitor,
  useOptimizedSelector,
};