// Global test setup
process.env.NODE_ENV = 'test';

// Add global mock for console to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Set up fake timers for testing time-dependent code
jest.useFakeTimers();

// Set timeout for unit and integration tests
jest.setTimeout(60000); // Increased timeout for all tests

// Database setup/teardown (if applicable)
beforeAll(async () => {
  // If your app uses a database, set up a test database here
  // For in-memory databases or test-specific databases
});

afterAll(async () => {
  // Clean up database connections, if any
  try {
    // If we're not in an environment where the socket module is loaded,
    // this will silently fail without affecting the tests
    const { cleanupAllSocketResources } = require('./integration/socketUtils');
    await cleanupAllSocketResources().catch((err) => {
      console.error('Error in socket cleanup during teardown:', err);
    });
  } catch (error) {
    // Ignore if module not found - this means we're not in a socket test context
  }
});
