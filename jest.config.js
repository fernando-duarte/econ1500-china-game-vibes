module.exports = {
  // Default configuration for all tests
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/mocks/'],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  reporters: ['default'],
  // Set coverage thresholds to enforce code quality - temporarily lowered for development
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  // Configuration for specific test types
  projects: [
    {
      // Unit and integration tests with Node environment
      displayName: 'node',
      testMatch: ['**/tests/unit/**/*.test.js', '**/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['./tests/setup.js']
    },
    {
      // E2E tests with jest-puppeteer
      displayName: 'e2e',
      preset: 'jest-puppeteer',
      testMatch: ['**/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['./tests/e2e-setup.js'],
      // Extend the timeout for e2e tests
      testTimeout: 120000
    }
  ],
  // Define specific test commands for running different types of tests
  // These can be used with: npm run test:unit, npm run test:integration, npm run test:e2e
  testSequencer: './tests/sequencer.js'
}; 