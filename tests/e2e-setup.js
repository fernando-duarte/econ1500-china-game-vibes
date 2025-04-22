// Import jest-puppeteer helpers
// Use require syntax for better compatibility with Jest
require('expect-puppeteer');
const { cleanupAllResources } = require('./e2e/e2eUtils');
const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'e2e/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Set timeout for E2E tests (matching Jest config)
jest.setTimeout(60000); // Increased timeout for all tests

// Track all open resources for cleanup
global.__E2E_RESOURCES__ = {
  browsers: new Set(),
  pages: new Set(),
  servers: new Set(),
};

// Log useful debugging information
console.log('Running E2E tests with Puppeteer');
console.log(
  'Browser version:',
  process.env.PUPPETEER_BROWSER_VERSION || 'default',
);
console.log('Test isolation level: high (1 test at a time)');

// Add custom matchers
expect.extend({
  // Custom matcher to check if an element is visible
  async toBeVisible(received) {
    if (!received) {
      return {
        message: () => 'Element is null or undefined',
        pass: false,
      };
    }

    try {
      const isVisible = await page.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (
          style &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        );
      }, received);

      return {
        message: () =>
          isVisible
            ? 'Expected element not to be visible, but it is'
            : 'Expected element to be visible, but it isn\'t',
        pass: isVisible,
      };
    } catch (error) {
      return {
        message: () => `Error checking visibility: ${error.message}`,
        pass: false,
      };
    }
  },
});

// Global setup
beforeAll(async () => {
  console.log('E2E tests started');

  // Register process exit handler for emergency cleanup
  process.on('exit', () => {
    try {
      // Force cleanup anything that wasn't properly closed
      cleanupAllResources();
    } catch (error) {
      console.error('Error in emergency cleanup:', error);
    }
  });
});

// Run between each test file
beforeEach(async () => {
  console.log(`Starting test: ${expect.getState().currentTestName}`);
});

// Run between each test file
afterEach(async () => {
  // Take screenshot if test failed
  if (expect.getState().currentTestName && expect.getState().isAnyTestFailed) {
    const testName = expect
      .getState()
      .currentTestName.replace(/\s+/g, '-')
      .toLowerCase();
    console.log(`Test failed, taking screenshot: ${testName}`);

    try {
      await page.screenshot({
        path: `tests/e2e/screenshots/failed-${testName}.png`,
        fullPage: true,
      });
    } catch (error) {
      console.error('Could not take failure screenshot:', error.message);
    }
  }

  console.log(`Completed test: ${expect.getState().currentTestName}`);
});

// Global teardown
afterAll(async () => {
  console.log('E2E tests completed, cleaning up resources');

  try {
    await cleanupAllResources();
    console.log('Resources cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up resources:', error);
  }
});
