// @ts-nocheck
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const waitOn = require('wait-on');
const path = require('path');

async function startTestServer() {
  const testPort = process.env.PORT || 3001;
  // Wait for the server started by jest-puppeteer to be ready
  await waitOn({ resources: [`http://localhost:${testPort}`], timeout: 45000 });
  return { port: Number(testPort), close: async () => {} };
}

async function launchBrowser() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new', // Updated to new headless mode
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // Helps with memory in CI environments
        '--disable-gpu',            // Reduces resource usage
        '--window-size=1280,720'    // Sets consistent viewport size
      ],
      defaultViewport: { width: 1280, height: 720 },
      timeout: 30000                // Browser launch timeout
    });
    
    return {
      browser,
      closeBrowser: async () => {
        if (browser) {
          await browser.close();
        }
      }
    };
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

/**
 * Utility functions for E2E testing with Puppeteer
 */

// Wait for Socket.IO events in the browser
async function waitForGameEvents(page, eventTypes, timeout = 5000) {
  return page.evaluate((eventTypes, timeout) => {
    return new Promise((resolve, reject) => {
      const events = [];
      const timeoutId = setTimeout(() => {
        // Clean up listeners before resolving
        if (window.socket) {
          eventTypes.forEach(type => {
            window.socket.off(type);
          });
        }
        resolve(events);
      }, timeout);
      
      // Check if socket exists
      if (!window.socket) {
        console.log('Socket not found - returning empty events array');
        clearTimeout(timeoutId);
        return resolve(events);
      }
      
      // Set up event listeners
      eventTypes.forEach(type => {
        window.socket.on(type, (data) => {
          events.push({
            type,
            data,
            timestamp: Date.now()
          });
        });
      });
    });
  }, eventTypes, timeout);
}

// Set up error handling for server process
function setupServerErrorHandling(serverProcess) {
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  // Wait for the server to be available or timeout
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Server failed to start in time'));
    }, 10000);
    
    serverProcess.stdout.on('data', (data) => {
      // Look for server ready message
      if (data.toString().includes('Server running on port')) {
        clearTimeout(timeoutId);
        resolve(serverProcess);
      }
    });
  });
}

// Take screenshots for debugging
async function takeDebugScreenshot(page, name) {
  try {
    const screenshotPath = `tests/e2e/screenshots/debug-${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Debug screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`Failed to take debug screenshot: ${error.message}`);
  }
}

// Wait for element to be visible
async function waitForElement(page, selector, timeout = 5000) {
  try {
    // Use a promise with setTimeout instead of page.waitForTimeout
    const element = await page.waitForSelector(selector, { 
      timeout,
      visible: true
    });
    return element;
  } catch (error) {
    console.error(`Element not found: ${selector}`);
    return null;
  }
}

// Retry an action with exponential backoff
async function retryWithBackoff(action, retries = 3, initialDelay = 500) {
  let delay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await action();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed: ${error.message}`);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Use setTimeout instead of page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

module.exports = {
  startTestServer,
  launchBrowser,
  waitForGameEvents,
  setupServerErrorHandling,
  takeDebugScreenshot,
  waitForElement,
  retryWithBackoff
}; 