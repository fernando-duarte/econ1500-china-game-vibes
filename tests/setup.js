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
jest.setTimeout(10000);

// Database setup/teardown (if applicable)
beforeAll(async () => {
  // If your app uses a database, set up a test database here
  // For in-memory databases or test-specific databases
});

afterAll(async () => {
  // Clean up database connections, if any
}); 