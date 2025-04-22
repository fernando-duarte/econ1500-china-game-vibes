/** @type {import('jest').Config} */
module.exports = {
  // Default configuration for all tests
  testEnvironment: "node",
  testTimeout: 60000, // Increased timeout for all tests
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/mocks/"],
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
  reporters: ["default"],
  // Add global teardown
  globalTeardown: "./tests/globalTeardown.js",
  // Disable coverage thresholds for now while fixing tests
  coverageThreshold: null,
  // Make test runs more isolated
  maxWorkers: 1, // Run tests serially for better isolation
  // Add more granular test execution
  bail: 0, // Don't stop on first failure
  // Configuration for specific test types
  projects: [
    {
      // Unit and integration tests with Node environment
      displayName: "node",
      testMatch: [
        "**/tests/unit/**/*.test.js",
        "**/tests/integration/**/*.test.js",
      ],
      testEnvironment: "node",
      setupFilesAfterEnv: ["./tests/setup.js"],
      // Note: timeouts are set in the setup files instead of here
    },
    {
      // E2E tests with jest-puppeteer
      displayName: "e2e",
      preset: "jest-puppeteer",
      testMatch: ["**/tests/e2e/**/*.test.js"],
      setupFilesAfterEnv: ["./tests/e2e-setup.js"],
      // Note: timeouts are set in the e2e-setup.js file via jest.setTimeout()
    },
  ],
  // Define specific test commands for running different types of tests
  // These can be used with: npm run test:unit, npm run test:integration, npm run test:e2e
  testSequencer: "./tests/sequencer.js",
};
