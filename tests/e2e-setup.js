// Import jest-puppeteer helpers
// Use require syntax for better compatibility with Jest
require('expect-puppeteer');

// Set longer timeout for E2E tests
jest.setTimeout(120000);

// Log useful debugging information
console.log('Running E2E tests with Puppeteer');
console.log('Browser version:', process.env.PUPPETEER_BROWSER_VERSION || 'default');

// Extend Jest matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Global setup
beforeAll(async () => {
  // Additional setup if needed
  console.log('E2E tests started');
  
  // Wait for the application to be fully loaded
  // Use setTimeout instead of waitForTimeout
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Global teardown
afterAll(async () => {
  console.log('E2E tests completed');
}); 