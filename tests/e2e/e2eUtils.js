// @ts-nocheck
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const waitOn = require('wait-on');
const path = require('path');
const fs = require('fs');

// Track active browser instances for cleanup
const activeBrowsers = new Set();

async function startTestServer() {
  return new Promise((resolve, reject) => {
    // File where the port is written
    const portFile = path.join(__dirname, '../../temp/test-server-port.txt');
    
    // Set a timeout for port detection
    const detectPortTimeout = setTimeout(() => {
      reject(new Error('Timed out waiting for server port detection'));
    }, 10000);
    
    // Function to check for the port file
    const checkPortFile = async () => {
      try {
        if (fs.existsSync(portFile)) {
          const port = Number(fs.readFileSync(portFile, 'utf8').trim());
          
          if (port && !isNaN(port)) {
            clearTimeout(detectPortTimeout);
            
            try {
              // Wait for server to be ready on this port
              await waitOn({
                resources: [`http://localhost:${port}`],
                timeout: 10000,
                delay: 100,
                simultaneous: 1
              });
              
              // Store the detected port in a global for tests to access
              global.__TEST_SERVER_PORT__ = port;
              
              resolve({
                port,
                url: `http://localhost:${port}`,
                close: async () => {
                  // We don't actually close the server here as jest-puppeteer manages its lifecycle
                  return Promise.resolve();
                }
              });
            } catch (error) {
              reject(new Error(`Server started but waitOn failed: ${error.message}`));
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error checking port file:', error);
        return false;
      }
    };
    
    // First, try to read the port from the file immediately
    checkPortFile().then(foundPort => {
      if (foundPort) return;
      
      // If port file doesn't exist yet, set up polling
      const pollInterval = setInterval(async () => {
        const foundPort = await checkPortFile();
        if (foundPort) {
          clearInterval(pollInterval);
        }
      }, 300);
      
      // Fallback to parsing stdout if needed
      const serverProcess = jest.puppeteer.server;
      
      if (serverProcess && serverProcess.stdout) {
        // Regular expression to extract the port number from server output
        const portRegex = /TEST_SERVER_PORT=(\d+)/;
        
        // Listen for the port in server output as a fallback
        serverProcess.stdout.on('data', async (data) => {
          const dataStr = data.toString();
          const match = dataStr.match(portRegex);
          
          if (match && match[1]) {
            clearTimeout(detectPortTimeout);
            clearInterval(pollInterval);
            
            const port = Number(match[1]);
            
            try {
              // Wait for server to be ready on this port
              await waitOn({
                resources: [`http://localhost:${port}`],
                timeout: 10000,
                delay: 100,
                simultaneous: 1
              });
              
              // Store the detected port in a global for tests to access
              global.__TEST_SERVER_PORT__ = port;
              
              resolve({
                port,
                url: `http://localhost:${port}`,
                close: async () => {
                  return Promise.resolve();
                }
              });
            } catch (error) {
              reject(new Error(`Server started but waitOn failed: ${error.message}`));
            }
          }
        });
      }
    });
  });
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
      timeout: 10000                // Browser launch timeout
    });
    
    // Track this browser instance
    activeBrowsers.add(browser);
    
    return {
      browser,
      closeBrowser: async () => {
        if (browser) {
          // Remove from tracking set
          activeBrowsers.delete(browser);
          await browser.close().catch(err => 
            console.error('Error closing browser:', err)
          );
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
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const screenshotPath = path.join(
      screenshotsDir, 
      `debug-${name}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Debug screenshot saved: ${screenshotPath}`);
    
    // Also log page URL and title to help with debugging
    const url = page.url();
    const title = await page.title().catch(() => 'Unable to get title');
    console.log(`Page URL: ${url}, Title: ${title}`);
    
    // Add page content for HTML analysis (truncated to avoid excessive logs)
    const content = await page.content().catch(() => 'Unable to get content');
    console.log(`Page content preview: ${content.substring(0, 500)}...`);
    
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
    // Take a debug screenshot to help diagnose the issue
    await takeDebugScreenshot(page, `element-not-found-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
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

// Add a global cleanup function for jest afterAll
async function cleanupAllResources() {
  // Close any remaining browsers
  const closingPromises = [];
  for (const browser of activeBrowsers) {
    closingPromises.push(
      browser.close().catch(err => console.error('Error closing browser in cleanup:', err))
    );
    activeBrowsers.delete(browser);
  }
  
  try {
    await Promise.all(closingPromises);
  } catch (error) {
    console.error('Error in cleanupAllResources:', error);
  }
}

module.exports = {
  startTestServer,
  launchBrowser,
  waitForGameEvents,
  setupServerErrorHandling,
  takeDebugScreenshot,
  waitForElement,
  retryWithBackoff,
  cleanupAllResources  // Export the cleanup function
}; 