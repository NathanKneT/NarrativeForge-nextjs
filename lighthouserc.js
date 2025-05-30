module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/editor',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo'
        ],
      },
    },
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.80 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Specific performance metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],
        
        // Resource optimization
        'uses-optimized-images': 'error',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'warn',
        
        // JavaScript optimization
        'unused-javascript': 'warn',
        'unminified-javascript': 'error',
        'legacy-javascript': 'warn',
        
        // CSS optimization
        'unused-css-rules': 'warn',
        'unminified-css': 'error',
        
        // Network optimization
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        'preload-lcp-image': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'heading-order': 'warn',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'hreflang': 'warn',
        'canonical': 'warn',
        
        // Best practices
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite3',
        sqlDatabasePath: './lhci.db',
      },
    },
    wizard: {
      serverBaseUrl: 'https://your-lhci-server.com',
    },
  },
  
  // Custom audit configurations
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      // Performance
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'max-potential-fid',
      
      // Resource efficiency
      'uses-optimized-images',
      'uses-webp-images',
      'uses-responsive-images',
      'efficient-animated-content',
      'unused-javascript',
      'unminified-javascript',
      'legacy-javascript',
      'unused-css-rules',
      'unminified-css',
      'uses-text-compression',
      'uses-rel-preconnect',
      'uses-rel-preload',
      'preload-lcp-image',
      
      // Accessibility
      'color-contrast',
      'image-alt',
      'label',
      'link-name',
      'heading-order',
      'focus-traps',
      'focusable-controls',
      'interactive-element-affordance',
      'logical-tab-order',
      'managed-focus',
      
      // SEO
      'document-title',
      'meta-description',
      'hreflang',
      'canonical',
      'robots-txt',
      'image-alt',
      'link-text',
      'crawlable-anchors',
      
      // Best practices
      'is-on-https',
      'uses-http2',
      'no-vulnerable-libraries',
      'csp-xss',
      'external-anchors-use-rel-noopener',
      'geolocation-on-start',
      'notification-on-start',
      'no-document-write',
      'js-libraries',
      'image-aspect-ratio',
      'image-size-responsive',
    ],
    
    // Custom throttling for realistic testing
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    
    // Form factor
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    
    // Network and CPU emulation
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  
  // Custom categories for specific focus areas
  categories: {
    'asylum-performance': {
      title: 'Asylum Performance',
      description: 'Performance metrics specific to interactive storytelling',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 15 },
        { id: 'largest-contentful-paint', weight: 25 },
        { id: 'cumulative-layout-shift', weight: 15 },
        { id: 'total-blocking-time', weight: 25 },
        { id: 'speed-index', weight: 10 },
        { id: 'interactive', weight: 10 },
      ],
    },
    'asylum-accessibility': {
      title: 'Asylum Accessibility',
      description: 'Accessibility for interactive story experiences',
      auditRefs: [
        { id: 'color-contrast', weight: 20 },
        { id: 'image-alt', weight: 15 },
        { id: 'label', weight: 15 },
        { id: 'link-name', weight: 15 },
        { id: 'heading-order', weight: 10 },
        { id: 'focus-traps', weight: 10 },
        { id: 'focusable-controls', weight: 15 },
      ],
    },
    'asylum-user-experience': {
      title: 'Asylum UX',
      description: 'User experience metrics for storytelling platform',
      auditRefs: [
        { id: 'uses-responsive-images', weight: 20 },
        { id: 'efficient-animated-content', weight: 15 },
        { id: 'interactive-element-affordance', weight: 15 },
        { id: 'logical-tab-order', weight: 15 },
        { id: 'managed-focus', weight: 15 },
        { id: 'image-aspect-ratio', weight: 10 },
        { id: 'image-size-responsive', weight: 10 },
      ],
    },
  },
};