import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Asylum - Histoire Interactive',
  description: 'Une expérience narrative interactive immersive',
  keywords: ['histoire interactive', 'jeu narratif', 'asylum', 'aventure'],
  authors: [{ name: 'Asylum Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  
  // Open Graph
  openGraph: {
    title: 'Asylum - Histoire Interactive',
    description: 'Une expérience narrative interactive immersive',
    type: 'website',
    locale: 'fr_FR',
  },
  
  // PWA metadata
  manifest: '/manifest.json',
  
  // Security
  other: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1a1a1a" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        {children}
        
        {/* Performance Monitoring Script */}
        <Script
          id="performance-monitor"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize Web Vitals monitoring
              (function() {
                // Only in production or when explicitly enabled
                if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'production' || window.localStorage.getItem('enablePerformanceMonitoring'))) {
                  // Import and initialize performance monitoring
                  import('/lib/performanceMonitor.js').then(module => {
                    if (module.initWebVitals) {
                      module.initWebVitals();
                    }
                    
                    // Track bundle size
                    if (module.trackBundleSize) {
                      window.addEventListener('load', module.trackBundleSize);
                    }
                    
                    // Track memory usage periodically
                    if (module.trackMemoryUsage) {
                      setInterval(module.trackMemoryUsage, 30000); // Every 30 seconds
                    }
                  }).catch(e => {
                    console.warn('Performance monitoring failed to load:', e);
                  });
                }
              })();
            `,
          }}
        />
        
        {/* Error Boundary Script */}
        <Script
          id="error-boundary"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handling
              window.addEventListener('error', function(event) {
                console.error('[ERROR]', event.error);
                
                // In production, you might want to send errors to a monitoring service
                if (typeof fetch !== 'undefined' && window.location.hostname !== 'localhost') {
                  fetch('/api/errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: event.error?.message || 'Unknown error',
                      stack: event.error?.stack,
                      url: window.location.href,
                      timestamp: Date.now(),
                      userAgent: navigator.userAgent
                    })
                  }).catch(() => {}); // Silently fail
                }
              });
              
              // Unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                console.error('[UNHANDLED PROMISE]', event.reason);
              });
              
              // Performance observer for long tasks
              if ('PerformanceObserver' in window) {
                try {
                  const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn('[LONG TASK]', entry.duration + 'ms');
                      }
                    }
                  });
                  observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                  // PerformanceObserver not supported
                }
              }
            `,
          }}
        />
        
        {/* Development helpers */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            id="dev-helpers"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                // Development performance helpers
                console.log('%c🚀 Asylum Interactive Story - Dev Mode', 'color: #e94560; font-size: 16px; font-weight: bold;');
                console.log('%c📊 Performance monitoring enabled', 'color: #4a5568;');
                console.log('%c🔧 To enable performance monitoring in dev: localStorage.setItem("enablePerformanceMonitoring", "true")', 'color: #4a5568;');
                
                // Expose performance utilities to window for debugging
                window.__asylum_perf = {
                  clearMetrics: () => localStorage.removeItem('asylum_metrics'),
                  getMetrics: () => JSON.parse(localStorage.getItem('asylum_metrics') || '[]'),
                  enableMonitoring: () => localStorage.setItem('enablePerformanceMonitoring', 'true'),
                  disableMonitoring: () => localStorage.removeItem('enablePerformanceMonitoring')
                };
              `,
            }}
          />
        )}
        
        {/* Service Worker Registration (for PWA) */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker for PWA features
              if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}