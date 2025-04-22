// Configuration for jest-puppeteer
const fs = require("fs");
const path = require("path");

// Ensure temp directory exists for port file
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// File to store dynamically assigned port
const PORT_FILE = path.join(tempDir, "test-server-port.txt");

// Clean up any existing port file before starting
if (fs.existsSync(PORT_FILE)) {
  fs.unlinkSync(PORT_FILE);
}

module.exports = {
  // Launch options for Puppeteer
  launch: {
    // Use new headless mode
    headless: "new",
    // Slow down Puppeteer operations by the specified amount of milliseconds
    // Useful for debugging
    slowMo: process.env.DEBUG ? 100 : 0,
    // Add any additional command line arguments for Chrome/Chromium
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    // Set timeout for browser launch
    timeout: 10000,
  },
  // Server configurations
  server: {
    // Use the dev script with dynamic port and port file for persistence
    command: `NODE_ENV=test START_SERVER_IN_TEST=true PORT=0 PORT_FILE="${PORT_FILE}" node server/index.js`,
    // Port detection is handled by waitForPort function in custom setup
    port: 0,
    // URL is dynamically determined in test setup
    url: null, // Will be determined dynamically
    // Increase timeout for server to start
    launchTimeout: 180000, // Increased from 120000
    // Debug server startup
    debug: true,
    // Only start the server once for all tests
    launchType: "once",
    // Used port action
    usedPortAction: "kill",
  },
  // Browser context settings
  browserContext: "default", // or 'incognito'
};
