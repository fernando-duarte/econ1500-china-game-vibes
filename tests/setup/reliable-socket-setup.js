/**
 * Reliable Socket.IO Test Setup
 * 
 * This file sets up the environment for reliable Socket.IO tests.
 */

// Increase Jest timeout for Socket.IO tests
jest.setTimeout(10000);

// Enable Socket.IO debug logs in test environment
process.env.DEBUG = 'socket.io:*';

// Enable real console logs for debugging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
};

console.error = function(...args) {
  process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
};

// Restore console functions after tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

console.log('Reliable Socket.IO test setup complete');
