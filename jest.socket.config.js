/**
 * Jest configuration for Socket.IO tests
 */
module.exports = {
  // Use a different test environment for Socket.IO tests
  testEnvironment: 'node',

  // Set up files to run before tests
  setupFilesAfterEnv: ['./tests/setup/reliable-socket-setup.js'],

  // Only run Socket.IO tests
  testMatch: [
    '**/tests/integration/reliable-socket.test.js',
    '**/tests/integration/simplified-reliable-socket.test.js',
    '**/tests/integration/socket.test.js'
  ],

  // Increase timeout for all tests
  testTimeout: 60000, // Increased timeout for all tests

  // Run tests in band (one at a time)
  runInBand: true,

  // Disable coverage thresholds for Socket.IO tests
  coverageThreshold: null,

  // Verbose output
  verbose: true
};
