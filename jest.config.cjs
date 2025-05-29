const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 🔧 FIX: "moduleNameMapper" pas "moduleNameMapping"
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@xyflow/react$': '<rootDir>/__mocks__/@xyflow/react.js',
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '\\.(css|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  testMatch: [
    '<rootDir>/src/__tests__/components/LoadingFallback.test.tsx',
    '<rootDir>/src/__tests__/components/StoryViewer.test.tsx',
    '<rootDir>/src/__tests__/lib/storyLoader.test.ts',
  ],
  
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/src/__tests__/components/gameStore.test.tsx',
    '<rootDir>/src/__tests__/components/graphToStoryConverter.test.ts',
  ],
  
  collectCoverageFrom: [
    'src/components/LoadingFallback.tsx',
    'src/components/StoryViewer.tsx',
    'src/lib/storyLoader.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  
  transformIgnorePatterns: [
    'node_modules/(?!((@xyflow/.*)|(@react-flow/.*)|framer-motion|web-vitals)/)'
  ],
  
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
      module: {
        type: 'commonjs',
      },
    }],
  },
  
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  
  coverageReporters: ['text'],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  verbose: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(customJestConfig);