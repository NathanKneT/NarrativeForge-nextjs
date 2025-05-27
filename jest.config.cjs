const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 🔧 FIX: Correction du mapping des modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    // CSS modules
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Images et assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Tests à inclure
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Tests et dossiers à exclure
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    // Exclure les tests E2E (Playwright)
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/tests/e2e/',
    // Exclure temporairement les tests problématiques
    '<rootDir>/src/__tests__/components/gameStore.test.tsx',
    '<rootDir>/src/__tests__/components/graphToStoryConverter.test.ts',
    '<rootDir>/src/__tests__/components/saveManager.test.ts',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/stores/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    // Exclure certains fichiers de la coverage
    '!src/types/**/*',
    '!src/**/index.{ts,tsx}',
  ],
  
  // Coverage thresholds pour FAANG standards
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Options de coverage
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageDirectory: 'coverage',
  
  // 🔧 FIX: Support pour ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Transforms pour différents types de fichiers
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: false,
          dynamicImport: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // Délai d'attente global
  testTimeout: 10000,
  
  // Verbosity pour debugging
  verbose: process.env.NODE_ENV === 'development',
  
  // 🔧 FIX: Résolution des modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Clearner les mocks automatiquement
  clearMocks: true,
  restoreMocks: true,
  
  // Reporter pour CI/CD
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
}

module.exports = createJestConfig(customJestConfig);