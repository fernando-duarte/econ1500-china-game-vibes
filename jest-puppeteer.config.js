// Configuration for jest-puppeteer
module.exports = {
  // Launch options for Puppeteer
  launch: {
    // Use new headless mode
    headless: 'new',
    // Slow down Puppeteer operations by the specified amount of milliseconds
    // Useful for debugging
    slowMo: process.env.DEBUG ? 100 : 0,
    // Add any additional command line arguments for Chrome/Chromium
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    // Set timeout for browser launch
    timeout: 10000,
  },
  // Server configurations
  server: {
    // Use the dev script which is likely more suitable for testing
    command: 'NODE_ENV=test START_SERVER_IN_TEST=true node server/index.js',
    // Port to wait for
    port: 3001,
    // Protocol, hostname and port
    url: 'http://localhost:3001',
    // Increase timeout for server to start
    launchTimeout: 10000,
    // Debug server startup
    debug: true,
    // Only start the server once for all tests
    launchType: 'once',
    // Used port action
    usedPortAction: 'kill',
  },
  // Browser context settings
  browserContext: 'default', // or 'incognito'
}; 