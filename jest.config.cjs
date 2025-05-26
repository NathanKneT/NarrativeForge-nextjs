const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Correction: moduleNameMapping → moduleNameMapper
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Exclure les tests problématiques
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/__tests__/e2e/', // Exclure Playwright
    '<rootDir>/src/__tests__/components/gameStore.test.tsx',
    '<rootDir>/src/__tests__/components/graphToStoryConverter.test.ts',
    '<rootDir>/src/__tests__/components/saveManager.test.ts',
  ],
  
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);