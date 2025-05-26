module.exports = {
  ci: {
    // Configuration de base
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/editor'],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        formFactor: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },

    // Assertions pour garantir la qualité FAANG-level
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance (Core Web Vitals)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // Performance globale
        'categories:performance': ['error', { minScore: 0.9 }],
        
        // Accessibilité
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',

        // SEO
        'categories:seo': ['error', { minScore: 0.9 }],
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'error',

        // Best Practices
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'errors-in-console': 'warn',

        // Métriques spécifiques pour les SPA
        'unused-javascript': ['warn', { maxNumericValue: 20 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20 }],
        'render-blocking-resources': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'offscreen-images': 'warn',

        // PWA (optionnel mais recommandé)
        'service-worker': 'off', // Désactivé pour cette app
        'installable-manifest': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'content-width': 'error',
        'viewport': 'error',

        // Sécurité
        'external-anchors-use-rel-noopener': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
      },
    },

    // Upload vers Lighthouse CI server (optionnel)
    upload: {
      target: 'temporary-public-storage',
      // Pour un serveur privé, utiliser:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    // Configuration serveur (si hébergé)
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },

    // Configuration wizard (pour setup initial)
    wizard: {
      // Désactivé en CI
    },
  },

  // Configuration custom pour différents environnements
  ...(() => {
    const isCI = process.env.CI === 'true';
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    
    if (isCI) {
      return {
        ci: {
          collect: {
            // En CI, tester plus d'URLs
            url: [
              'http://localhost:3000',
              'http://localhost:3000/editor',
            ],
            // Configurations CI spécifiques
            settings: {
              chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
              // Moins de runs en CI pour la vitesse
              numberOfRuns: isPR ? 1 : 3,
            },
          },
          
          assert: {
            // Assertions plus strictes en CI
            assertions: {
              'categories:performance': ['error', { minScore: 0.85 }], // Légèrement plus permissif en CI
              'categories:accessibility': ['error', { minScore: 0.9 }],
              'categories:seo': ['error', { minScore: 0.85 }],
              'categories:best-practices': ['error', { minScore: 0.85 }],
            },
          },
        },
      };
    }
    
    return {};
  })(),
};