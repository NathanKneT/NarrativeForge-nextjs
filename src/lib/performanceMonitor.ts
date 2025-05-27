export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'INP' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent?: string;
}

export interface PerformanceReport {
  metrics: WebVitalsMetric[];
  timestamp: number;
  sessionId: string;
  userId?: string;
  buildId?: string;
}

class PerformanceMonitor {
  private metrics: WebVitalsMetric[] = [];
  private sessionId: string;
  private reportInterval: number = 30000; // 30 seconds
  private reportTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startPeriodicReporting();
    
    // Listen for page visibility changes to report before page unload
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportMetrics();
        }
      });
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public recordMetric(metric: Omit<WebVitalsMetric, 'timestamp' | 'url'>): void {
    const fullMetric: WebVitalsMetric = {
      ...metric,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.metrics.push(fullMetric);

    // Report immediately for poor metrics
    if (fullMetric.rating === 'poor') {
      this.reportMetrics();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${fullMetric.name}: ${fullMetric.value}ms (${fullMetric.rating})`);
    }
  }

  public getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 }, // Updated: INP replaces FID
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private async reportMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const report: PerformanceReport = {
      metrics: [...this.metrics],
      timestamp: Date.now(),
      sessionId: this.sessionId,
      buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    };

    try {
      // Send to API endpoint
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        // Use keepalive for page unload scenarios
        keepalive: true,
      });

      // Clear reported metrics
      this.metrics = [];
    } catch (error) {
      console.warn('[PERF] Failed to report metrics:', error);
    }
  }

  private startPeriodicReporting(): void {
    if (typeof window === 'undefined') return;

    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.reportInterval);
  }

  public destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    // Final report
    this.reportMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals integration - Updated with modern Core Web Vitals
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Using the correct web-vitals API with modern metrics
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      performanceMonitor.recordMetric({
        id: metric.id,
        name: 'CLS',
        value: metric.value,
        rating: performanceMonitor.getRating('CLS', metric.value),
      });
    });

    // ✅ Updated: INP replaces FID as Core Web Vital
    onINP((metric) => {
      performanceMonitor.recordMetric({
        id: metric.id,
        name: 'INP',
        value: metric.value,
        rating: performanceMonitor.getRating('INP', metric.value),
      });
    });

    onFCP((metric) => {
      performanceMonitor.recordMetric({
        id: metric.id,
        name: 'FCP',
        value: metric.value,
        rating: performanceMonitor.getRating('FCP', metric.value),
      });
    });

    onLCP((metric) => {
      performanceMonitor.recordMetric({
        id: metric.id,
        name: 'LCP',
        value: metric.value,
        rating: performanceMonitor.getRating('LCP', metric.value),
      });
    });

    onTTFB((metric) => {
      performanceMonitor.recordMetric({
        id: metric.id,
        name: 'TTFB',
        value: metric.value,
        rating: performanceMonitor.getRating('TTFB', metric.value),
      });
    });
  }).catch(() => {
    console.warn('[PERF] Web Vitals library not available');
  });
}

// Performance timing utilities
export function measureOperation<T>(
  name: string,
  operation: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  
  const result = operation();
  
  if (result instanceof Promise) {
    return result.then((value) => {
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return { result: value, duration };
    });
  } else {
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return Promise.resolve({ result, duration });
  }
}

// Memory usage tracking
export function trackMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memory = (performance as any).memory;
  const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
  const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
  const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[MEMORY] Used: ${used}MB, Total: ${total}MB, Limit: ${limit}MB`);
  }

  // Report high memory usage
  if (used > limit * 0.8) {
    console.warn(`[MEMORY] High memory usage detected: ${used}MB`);
  }
}

// Bundle size tracking
export function trackBundleSize(): void {
  if (typeof window === 'undefined') return;

  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (entries.length > 0) {
    const navigation = entries[0];
    const transferSize = navigation.transferSize || 0;
    const encodedSize = navigation.encodedBodySize || 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BUNDLE] Transfer: ${(transferSize / 1024).toFixed(2)}KB, Encoded: ${(encodedSize / 1024).toFixed(2)}KB`);
    }
  }
}

// Export for layout integration
export default performanceMonitor;