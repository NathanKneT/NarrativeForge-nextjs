import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  details?: Record<string, unknown> | undefined;
}


class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private readonly maxMetrics = 1000; // Limite pour éviter les fuites mémoire

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;

    try {
      // Observer pour les métriques de navigation
      if ('PerformanceObserver' in window) {
        this.setupNavigationObserver();
        this.setupResourceObserver();
        this.setupUserTimingObserver();
        this.setupLongTaskObserver();
      }

      // Web Vitals
      this.setupWebVitals();

      // Métriques personnalisées
      this.setupCustomMetrics();

      this.isInitialized = true;
      console.log('🔍 Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  private setupNavigationObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('navigation_timing', navEntry.loadEventEnd - navEntry.fetchStart, {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              firstPaint: navEntry.loadEventEnd - navEntry.fetchStart,
              domInteractive: navEntry.domInteractive - navEntry.fetchStart,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation observer setup failed:', error);
    }
  }

  private setupResourceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Filtrer les ressources importantes
          if (this.isImportantResource(resource.name)) {
            this.recordMetric('resource_timing', resource.duration, {
              name: resource.name,
              type: this.getResourceType(resource.name),
              size: resource.transferSize,
              cached: resource.transferSize === 0,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource observer setup failed:', error);
    }
  }

  private setupUserTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric('user_timing', entry.duration, {
              name: entry.name,
              type: 'measure',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('User timing observer setup failed:', error);
    }
  }

  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration, {
            startTime: entry.startTime,
            attribution: (entry as any).attribution,
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observer setup failed:', error);
    }
  }

  private setupWebVitals(): void {
    // Utilisation de web-vitals-like implementation
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureFCP();
    this.measureTTFB();
  }

  private measureLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry?.startTime ?? 0, {
          element: (lastEntry as any).element?.tagName,
          url: (lastEntry as any).url,
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP measurement failed:', error);
    }
  }

  private measureFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('FID', (entry as any)?.processingStart - entry.startTime, {
            eventType: (entry as any).name,
            startTime: entry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID measurement failed:', error);
    }
  }

  private measureCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.recordMetric('CLS', clsValue, {
          sessionEntries: list.getEntries().length,
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS measurement failed:', error);
    }
  }

  private measureFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP measurement failed:', error);
    }
  }

  private measureTTFB(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.recordMetric('TTFB', ttfb);
      }
    } catch (error) {
      console.warn('TTFB measurement failed:', error);
    }
  }

  private setupCustomMetrics(): void {
    // Mesurer le temps de rendu des composants React
    this.measureReactRenderTime();
    
    // Mesurer la taille du bundle
    this.measureBundleSize();
    
    // Mesurer l'utilisation mémoire
    this.measureMemoryUsage();
  }

  private measureReactRenderTime(): void {
    // Hook dans React DevTools si disponible
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      devTools.onCommitFiberRoot = (id: any, root: unknown, priorityLevel: any) => {
        const renderTime = performance.now();
        this.recordMetric('react_render', renderTime, {
          fiberId: id,
          priorityLevel,
        });
      };
    }
  }

  private measureBundleSize(): void {
    // Estimer la taille du bundle à partir des ressources chargées
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalJSSize = 0;
    let totalCSSSize = 0;

    resources.forEach(resource => {
      if (resource.name.includes('.js')) {
        totalJSSize += resource.transferSize || 0;
      } else if (resource.name.includes('.css')) {
        totalCSSSize += resource.transferSize || 0;
      }
    });

    this.recordMetric('bundle_size_js', totalJSSize);
    this.recordMetric('bundle_size_css', totalCSSSize);
  }

  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize);
      this.recordMetric('memory_total', memory.totalJSHeapSize);
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
    }
  }

  private isImportantResource(url: string): boolean {
    return (
      url.includes('.js') ||
      url.includes('.css') ||
      url.includes('.woff') ||
      url.includes('.svg') ||
      url.includes('.png') ||
      url.includes('.jpg')
    );
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('.svg') || url.includes('.png') || url.includes('.jpg')) return 'image';
    return 'other';
  }

  private recordMetric(name: string, value: number, details?: Record<string, unknown> | undefined): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      details,
    };

    this.metrics.push(metric);

    // Limiter le nombre de métriques en mémoire
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }

    // Log en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [${name}] ${value.toFixed(2)}ms`, details);
    }

    // Envoyer à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(metric);
    }
  }

  private sendToMonitoringService(metric: PerformanceMetric): void {
    // Exemple d'envoi vers un service de monitoring
    // En production, remplacer par votre service (DataDog, New Relic, etc.)
    try {
      if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'performance_metric',
            metric,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: metric.timestamp,
          }),
        }).catch(error => {
          console.warn('Failed to send metric to monitoring service:', error);
        });
      }
    } catch (error) {
      console.warn('Monitoring service error:', error);
    }
  }

  // API publique
  public mark(name: string): void {
    try {
      performance.mark(name);
    } catch (error) {
      console.warn(`Failed to mark ${name}:`, error);
    }
  }

  public measure(name: string, startMark: string, endMark?: string): number {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measures = performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];
      return lastMeasure ? lastMeasure.duration : 0;
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
      return 0;
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  public getWebVitalsReport(): Record<string, PerformanceMetric | undefined> {
    return {
      LCP: this.metrics.find(m => m.name === 'LCP'),
      FID: this.metrics.find(m => m.name === 'FID'),
      CLS: this.metrics.find(m => m.name === 'CLS'),
      FCP: this.metrics.find(m => m.name === 'FCP'),
      TTFB: this.metrics.find(m => m.name === 'TTFB'),
    };
  }

  public getBundleAnalysis(): {
    totalJS: number;
    totalCSS: number;
    resourceCount: number;
    averageLoadTime: number;
  } {
    const jsMetrics = this.getMetricsByName('bundle_size_js');
    const cssMetrics = this.getMetricsByName('bundle_size_css');
    const resourceMetrics = this.getMetricsByName('resource_timing');

    return {
      totalJS: jsMetrics.reduce((sum, m) => sum + m.value, 0),
      totalCSS: cssMetrics.reduce((sum, m) => sum + m.value, 0),
      resourceCount: resourceMetrics.length,
      averageLoadTime: resourceMetrics.length > 0 
        ? resourceMetrics.reduce((sum, m) => sum + m.value, 0) / resourceMetrics.length 
        : 0,
    };
  }

  public startTimer(name: string): () => number {
    const startTime = performance.now();
    this.mark(`${name}_start`);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.mark(`${name}_end`);
      this.measure(name, `${name}_start`, `${name}_end`);
      this.recordMetric(name, duration);
      return duration;
    };
  }

  public cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect performance observer:', error);
      }
    });
    
    this.observers = [];
    this.metrics = [];
    this.isInitialized = false;
  }

  // Méthodes utilitaires pour les composants React
  public measureComponentRender<T extends React.ComponentType<any>>(
    Component: T,
    displayName?: string
  ): T {
    if (process.env.NODE_ENV !== 'development') {
      return Component;
    }

    const WrappedComponent = React.forwardRef((props: any, ref: any) => {
      const componentName = displayName || Component.displayName || Component.name || 'Unknown';
      const timer = this.startTimer(`component_render_${componentName}`);
      
      React.useLayoutEffect(() => {
        timer();
      });

      return React.createElement(Component, { ...props, ref });
    });

    WrappedComponent.displayName = `PerformanceMonitored(${Component.displayName || Component.name})`;
    
    return WrappedComponent as T;
  }
}

// Instance singleton
export const performanceMonitor = new PerformanceMonitor();

// Hook React pour faciliter l'utilisation
export const usePerformanceTimer = (name: string) => {
  const [duration, setDuration] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    const timer = performanceMonitor.startTimer(name);
    
    return () => {
      const elapsed = timer();
      setDuration(elapsed);
    };
  }, [name]);
  
  return duration;
};

// HOC pour mesurer automatiquement les performances des composants
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  displayName?: string
) => {
  return performanceMonitor.measureComponentRender(WrappedComponent, displayName);
};

export default performanceMonitor;