
Let me check the codebase first to verify the "Before" snippets exist, then improve the plan.

Ran tool

Read file: /Users/fernandoduarte/Brown Dropbox/Fernando Duarte/Teaching/ECON1500/2025 Spring/Modules/The Rise of China/Game/jest-puppeteer.config.js
Let's check for server/index.js to verify the before snippets:

Ran tool

Read file: /Users/fernandoduarte/Brown Dropbox/Fernando Duarte/Teaching/ECON1500/2025 Spring/Modules/The Rise of China/Game/server/index.js
Let's check for e2eUtils.js:

Ran tool

Read file: /Users/fernandoduarte/Brown Dropbox/Fernando Duarte/Teaching/ECON1500/2025 Spring/Modules/The Rise of China/Game/tests/e2e/e2eUtils.js
Now let's look for socketUtils.js:

Ran tool

Read file: /Users/fernandoduarte/Brown Dropbox/Fernando Duarte/Teaching/ECON1500/2025 Spring/Modules/The Rise of China/Game/tests/integration/socketUtils.js
Let's look for jest.config.js:

Ran tool

Read file: /Users/fernandoduarte/Brown Dropbox/Fernando Duarte/Teaching/ECON1500/2025 Spring/Modules/The Rise of China/Game/jest.config.js
Now that I've verified the "Before" snippets, I'll modify the implementation plan to address the issue with port detection relying on parsing stdout. Here's my improved plan:

# Improved Implementation Plan for Testing Infrastructure

## Recommendation 1: Use dynamic ports for all tests (with improved implementation)

### Step 1.1: Modify jest-puppeteer.config.js to use dynamic ports

**Before:**
```javascript
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
```

**After (Improved):**
```javascript
// Configuration for jest-puppeteer
const fs = require('fs');
const path = require('path');

// Ensure temp directory exists for port file
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// File to store dynamically assigned port
const PORT_FILE = path.join(tempDir, 'test-server-port.txt');

// Clean up any existing port file before starting
if (fs.existsSync(PORT_FILE)) {
  fs.unlinkSync(PORT_FILE);
}

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
    // Use the dev script with dynamic port and port file for persistence
    command: `NODE_ENV=test START_SERVER_IN_TEST=true PORT=0 PORT_FILE="${PORT_FILE}" node server/index.js`,
    // Port detection is handled by waitForPort function in custom setup
    port: 0,
    // URL is dynamically determined in test setup
    url: null, // Will be determined dynamically
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
```

### Step 1.2: Update server/index.js to write port to a file instead of just logging it

**Before:**
```javascript
// Start the server
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;
// Only start the server if not in test environment or if explicitly required
if (!isTestEnvironment || process.env.START_SERVER_IN_TEST) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Only log URLs in non-test environment
    if (!isTestEnvironment) {
      console.log(`Student view: http://localhost:${PORT}`);
      console.log(`Instructor view: http://localhost:${PORT}/instructor`);
      console.log(`Screen dashboard: http://localhost:${PORT}/screen`);
    }
  });
}
```

**After (Improved):**
```javascript
const fs = require('fs');
const path = require('path');

// Start the server
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;
// Only start the server if not in test environment or if explicitly required
if (!isTestEnvironment || process.env.START_SERVER_IN_TEST) {
  server.listen(PORT, () => {
    // Get the actual port that was assigned (especially important when PORT=0)
    const actualPort = server.address().port;
    console.log(`Server running on port ${actualPort}`);
    
    // For test environments, write the port to a file for reliable port detection
    if (isTestEnvironment && process.env.PORT_FILE) {
      try {
        fs.writeFileSync(process.env.PORT_FILE, actualPort.toString(), 'utf8');
        console.log(`Test server port ${actualPort} written to ${process.env.PORT_FILE}`);
      } catch (error) {
        console.error(`Failed to write port to file: ${error.message}`);
      }
      
      // Also log a special marker for backward compatibility
      console.log(`TEST_SERVER_PORT=${actualPort}`);
    } else {
      console.log(`Student view: http://localhost:${actualPort}`);
      console.log(`Instructor view: http://localhost:${actualPort}/instructor`);
      console.log(`Screen dashboard: http://localhost:${actualPort}/screen`);
    }
  });
}
```

### Step 1.3: Update e2eUtils.js to use the port file with a fallback to stdout parsing

**Before:**
```javascript
async function startTestServer() {
  const testPort = process.env.PORT || 3001;
  // Wait for the server started by jest-puppeteer to be ready
  await waitOn({ resources: [`http://localhost:${testPort}`], timeout: 45000 });
  return { port: Number(testPort), close: async () => {} };
}
```

**After (Improved):**
```javascript
const fs = require('fs');
const path = require('path');

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
```

### Step 1.4: Update test files to use the detected port

(This part of the original plan remains the same)

Example for `home.test.js`:

**Before:**
```javascript
describe('Home Page', () => {
  beforeAll(async () => {
    // Navigate to the home page before running tests
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0', // Wait until there are no more network connections for at least 500ms
      timeout: 30000 // Increase timeout for page load
    });
    
    // Wait for the page to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  // test cases...
});
```

**After:**
```javascript
const { startTestServer } = require('./e2eUtils');

describe('Home Page', () => {
  let testServer;
  
  beforeAll(async () => {
    // Get server info including dynamic port
    testServer = await startTestServer();
    
    // Navigate to the home page before running tests
    await page.goto(`http://localhost:${testServer.port}`, {
      waitUntil: 'networkidle0', // Wait until there are no more network connections for at least 500ms
      timeout: 10000 // Match Jest timeout
    });
    
    // Wait for the page to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  afterAll(async () => {
    if (testServer) {
      await testServer.close().catch(console.error);
    }
  });

  // test cases...
});
```


## Recommendation 2: Ensure proper cleanup after tests

### Step 2.1: Improve test server cleanup in e2eUtils.js

**Before:**
```javascript
async function startTestServer() {
  const testPort = process.env.PORT || 3001;
  // Wait for the server started by jest-puppeteer to be ready
  await waitOn({ resources: [`http://localhost:${testPort}`], timeout: 45000 });
  return { port: Number(testPort), close: async () => {} };
}
```

**After:**
```javascript
// Track active browser instances for cleanup
const activeBrowsers = new Set();

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
```

Add to module.exports:
```javascript
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
```

### Step 2.2: Improve socket test cleanup in socketUtils.js

**Before:**
```javascript
function createSocketClient(port) {
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  
  return {
    client,
    connectClient: () => {
      return new Promise(resolve => {
        client.on('connect', () => {
          resolve();
        });
      });
    },
    disconnectClient: () => {
      return new Promise(resolve => {
        if (client.connected) {
          client.on('disconnect', () => {
            resolve();
          });
          client.disconnect();
        } else {
          resolve();
        }
      });
    }
  };
}
```

**After:**
```javascript
// Track active clients and servers for cleanup
const activeClients = new Set();
const activeServers = new Set();

async function createSocketServer() {
  // Create an HTTP server
  const httpServer = createServer();
  
  // Create Socket.IO server
  const io = new Server(httpServer);
  
  // Set up Socket.IO event handlers
  const { setupSocketEvents } = require('../../server/events');
  setupSocketEvents(io);
  
  // Start server on a random port and wait until it's listening
  await new Promise(resolve => httpServer.listen(0, resolve));
  
  // Track this server instance
  activeServers.add(httpServer);
  
  // Return server instances and helper functions
  return {
    httpServer,
    io,
    getPort: () => httpServer.address().port,
    closeServer: () => {
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeServers.delete(httpServer);
          
          // Properly close io first
          io.close(() => {
            // Then close httpServer
            httpServer.close((err) => {
              if (err) {
                console.error('Error closing HTTP server:', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } catch (err) {
          console.error('Error in closeServer:', err);
          reject(err);
        }
      });
    }
  };
}

function createSocketClient(port) {
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  
  // Track this client
  activeClients.add(client);
  
  return {
    client,
    connectClient: () => {
      return new Promise((resolve, reject) => {
        // Add timeout to avoid hanging
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);
        
        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        client.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    },
    disconnectClient: () => {
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeClients.delete(client);
          
          if (client.connected) {
            // Set timeout to avoid hanging
            const timeout = setTimeout(() => {
              console.warn('Socket disconnect timeout - forcing cleanup');
              resolve();
            }, 2000);
            
            client.on('disconnect', () => {
              clearTimeout(timeout);
              resolve();
            });
            
            client.disconnect();
          } else {
            resolve();
          }
        } catch (err) {
          console.error('Error in disconnectClient:', err);
          reject(err);
        }
      });
    }
  };
}

// Add global cleanup function
async function cleanupAllSocketResources() {
  // Close any remaining clients
  for (const client of activeClients) {
    try {
      if (client.connected) {
        client.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting client in cleanup:', err);
    }
    activeClients.delete(client);
  }
  
  // Close any remaining servers
  const closePromises = [];
  for (const server of activeServers) {
    closePromises.push(
      new Promise(resolve => {
        try {
          server.close(() => resolve());
        } catch (err) {
          console.error('Error closing server in cleanup:', err);
          resolve();
        }
      })
    );
    activeServers.delete(server);
  }
  
  await Promise.allSettled(closePromises);
}
```

Add to module.exports:
```javascript
module.exports = {
  createSocketServer,
  createSocketClient,
  CONSTANTS,
  cleanupAllSocketResources  // Export the cleanup function
};
```

### Step 2.3: Add global cleanup to jest configuration

Create a new file `tests/globalTeardown.js`:

```javascript
// Global teardown to ensure all resources are cleaned up
const { cleanupAllResources } = require('./e2e/e2eUtils');
const { cleanupAllSocketResources } = require('./integration/socketUtils');

module.exports = async () => {
  console.log('Running global teardown to clean up test resources...');
  
  try {
    // Run cleanup functions
    await Promise.all([
      cleanupAllResources(),
      cleanupAllSocketResources()
    ]);
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};
```

Update `jest.config.js`:

**Before:**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  // Default configuration for all tests
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/mocks/'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  reporters: ['default'],
  // ...
};
```

**After:**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  // Default configuration for all tests
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/mocks/'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  reporters: ['default'],
  // Add global teardown
  globalTeardown: './tests/globalTeardown.js',
  // ...
};
```

## Recommendation 3: Align timeouts between Jest and server

### Step 3.1: Update waitOn timeout in e2eUtils.js

**Before:**
```javascript
async function startTestServer() {
  const testPort = process.env.PORT || 3001;
  // Wait for the server started by jest-puppeteer to be ready
  await waitOn({ resources: [`http://localhost:${testPort}`], timeout: 45000 });
  return { port: Number(testPort), close: async () => {} };
}
```

**After:**
```javascript
async function startTestServer() {
  return new Promise((resolve, reject) => {
    // We'll use the server started by jest-puppeteer, but need to detect its port
    const serverProcess = jest.puppeteer.server;
    
    if (!serverProcess || !serverProcess.stdout) {
      reject(new Error('Server process not available from jest-puppeteer'));
      return;
    }
    
    // Set a timeout in case we never detect the port
    const detectPortTimeout = setTimeout(() => {
      reject(new Error('Timed out waiting for server port detection'));
    }, 10000); // Match Jest timeout
    
    // Regular expression to extract the port number from server output
    const portRegex = /TEST_SERVER_PORT=(\d+)/;
    
    // Listen for the port in server output
    serverProcess.stdout.on('data', async (data) => {
      const dataStr = data.toString();
      const match = dataStr.match(portRegex);
      
      if (match && match[1]) {
        clearTimeout(detectPortTimeout);
        const port = Number(match[1]);
        
        try {
          // Wait for server to be ready on this port
          await waitOn({ 
            resources: [`http://localhost:${port}`], 
            timeout: 10000, // Match Jest timeout
            delay: 100,     // Check every 100ms
            simultaneous: 1 // Only check one resource at a time
          });
          // Store the detected port in a global for tests to access
          global.__TEST_SERVER_PORT__ = port;
          
          resolve({ 
            port,
            url: `http://localhost:${port}`,
            close: async () => {
              // We don't actually close the server here as jest-puppeteer manages its lifecycle
              // But we return a real function for consistency
              return Promise.resolve();
            }
          });
        } catch (error) {
          reject(new Error(`Server started but waitOn failed: ${error.message}`));
        }
      }
    });
  });
}
```

### Step 3.2: Update timeouts in test files

Example for `instructor.test.js`:

**Before:**
```javascript
beforeAll(async () => {
  // Start test server
  server = await startTestServer();
  
  // Launch browser
  const browserObj = await launchBrowser();
  browser = browserObj.browser;
  
  // Create a new page
  page = await browser.newPage();
  
  // Navigate to the instructor page
  await page.goto('http://localhost:3001/instructor', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  // Wait for the page to render fully
  await new Promise(resolve => setTimeout(resolve, 1000));
}, 60000);
```

**After:**
```javascript
beforeAll(async () => {
  // Start test server
  server = await startTestServer();
  
  // Launch browser
  const browserObj = await launchBrowser();
  browser = browserObj.browser;
  
  // Create a new page
  page = await browser.newPage();
  
  // Navigate to the instructor page (using dynamic port)
  await page.goto(`http://localhost:${server.port}/instructor`, {
    waitUntil: 'networkidle0',
    timeout: 10000 // Match Jest timeout
  });
  // Wait for the page to render fully (but with shorter wait)
  await new Promise(resolve => setTimeout(resolve, 500));
}, 10000); // Match Jest timeout
```

### Step 3.3: Update server-side timeouts in server/index.js

**Before:**
```javascript
// Set up Socket.IO with test-specific configurations
const io = isTestEnvironment
  ? new Server(server, {
      pingTimeout: 2000, // Reduce ping timeout for faster tests
      pingInterval: 5000, // Reduce ping interval for faster tests
    })
  : new Server(server);
```

**After:**
```javascript
// Set up Socket.IO with test-specific configurations
const io = isTestEnvironment
  ? new Server(server, {
      pingTimeout: 2000,   // Reduced ping timeout for faster tests
      pingInterval: 2000,  // Reduced ping interval for faster tests
      connectTimeout: 5000, // Reduced connection timeout
      transports: ['websocket'], // Use only websocket for faster tests
    })
  : new Server(server);
```

## Recommendation 4: Add more robust error handling

### Step.4.1: Enhance error handling in e2eUtils.js

**Before:**
```javascript
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
```

**After:**
```javascript
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

// Enhanced debug screenshot function
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
```

### Step 4.2: Improve server error handling in server/index.js

**Before:**
```javascript
// Add global error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error occurred');
});

// Add catch-all 404 handler
app.use((req, res, next) => {
  res.status(404).send('Not Found');
});
```

**After:**
```javascript
// Add global error handler middleware with more detailed logging
app.use((err, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  console.error(`Express error [${errorId}]:`, err);
  console.error(`Request path: ${req.path}, method: ${req.method}`);
  
  // In test environment, provide more detailed error information
  if (isTestEnvironment) {
    res.status(500).json({
      errorId,
      message: 'Server error occurred',
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    // In production, don't expose error details
    res.status(500).send('Server error occurred');
  }
});

// Add catch-all 404 handler with more information
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  
  // In test environment, provide more information
  if (isTestEnvironment) {
    res.status(404).json({
      message: 'Not Found',
      path: req.path,
      method: req.method,
      availableRoutes: [
        '/', 
        '/instructor', 
        '/screen', 
        '/constants.js'
      ]
    });
  } else {
    res.status(404).send('Not Found');
  }
});

// Add graceful shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Received shutdown signal, closing server...');
  
  // Set a timeout to force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('Forced exit after shutdown timeout');
    process.exit(1);
  }, 10000);
  
  // Close the server gracefully
  server.close(() => {
    console.log('Server closed successfully');
    clearTimeout(forceExitTimeout);
    process.exit(0);
  });
}
```

### Step 4.3: Enhance socket connection error handling

**Before:**
```javascript
function createSocketClient(port) {
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  // ... rest of the function
}
```

**After:**
```javascript
function createSocketClient(port) {
  // Add error handling and logging for the socket client
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 5000,  // Connection timeout
    autoConnect: false // Don't connect automatically, we'll do it manually with error handling
  });
  
  // Set up error handlers
  client.on('connect_error', (err) => {
    console.error(`Socket connect error to port ${port}:`, err.message);
  });
  
  client.on('error', (err) => {
    console.error(`Socket error on port ${port}:`, err.message);
  });
  
  // Track this client
  activeClients.add(client);
  
  return {
    client,
    connectClient: () => {
      return new Promise((resolve, reject) => {
        // Connect manually
        client.connect();
        
        // Add timeout to avoid hanging
        const timeout = setTimeout(() => {
          reject(new Error(`Socket connection timeout to port ${port}`));
        }, 5000);
        
        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        client.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`Socket connection error: ${err.message}`));
        });
      });
    },
    // ... rest of the function
  };
}
```

## Recommendation 5: Implement better isolation between test suites

### Step 5.1: Create custom test sequencer to run tests in controlled order

Create a new file `tests/sequencer.js`:

```javascript
const { TestSequencer } = require('@jest/test-sequencer');

class CustomSequencer extends TestSequencer {
  // Sort test files to run in a specific order
  sort(tests) {
    // Ensure tests run in a specific order for better isolation:
    // 1. Unit tests (fastest and most isolated)
    // 2. Integration tests (require server but not browser)
    // 3. E2E tests (require full stack)
    
    return tests.sort((testA, testB) => {
      // Extract test type from path
      const getTestType = (path) => {
        if (path.includes('/unit/')) return 1;
        if (path.includes('/integration/')) return 2;
        if (path.includes('/e2e/')) return 3;
        return 4; // Other tests
      };
      
      // Get test types
      const typeA = getTestType(testA.path);
      const typeB = getTestType(testB.path);
      
      // Sort by test type first
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      
      // If same test type, use Jest's default sorting
      return super.sort([testA, testB])[0] === testA ? -1 : 1;
    });
  }
}

module.exports = CustomSequencer;
```

### Step 5.2: Update Jest config to use the sequencer and run tests with isolation

**Before:**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  // Default configuration for all tests
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/mocks/'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  reporters: ['default'],
  // ... other configuration
};
```

**After:**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  // Default configuration for all tests
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/mocks/'],
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  reporters: ['default'],
  // Add global teardown
  globalTeardown: './tests/globalTeardown.js',
  // Use custom sequencer for controlled test order
  testSequencer: './tests/sequencer.js',
  // Make test runs more isolated
  maxWorkers: 1, // Run tests serially for better isolation
  // Add more granular test execution
  bail: 0, // Don't stop on first failure
  // ... other configuration
};
```

### Step 5.3: Update E2E test files to have better isolation for server/browser instances

Update `tests/e2e-setup.js`:

**Before:**
```javascript
// Import jest-puppeteer helpers
// Use require syntax for better compatibility with Jest
require('expect-puppeteer');

// Set longer timeout for E2E tests
jest.setTimeout(10000);

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
```

**After:**
```javascript
// Import jest-puppeteer helpers
// Use require syntax for better compatibility with Jest
require('expect-puppeteer');
const { cleanupAllResources } = require('./e2e/e2eUtils');

// Set timeout for E2E tests (matching Jest config)
jest.setTimeout(10000);

// Track all open resources for cleanup
global.__E2E_RESOURCES__ = {
  browsers: new Set(),
  pages: new Set(),
  servers: new Set()
};

// Log useful debugging information
console.log('Running E2E tests with Puppeteer');
console.log('Browser version:', process.env.PUPPETEER_BROWSER_VERSION || 'default');
console.log('Test isolation level: high (1 test at a time)');

// Add custom matchers
expect.extend({
  // Custom matcher to check if an element is visible
  async toBeVisible(received) {
    if (!received) {
      return {
        message: () => 'Element is null or undefined',
        pass: false
      };
    }
    
    try {
      const isVisible = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
      }, received);
      
      return {
        message: () => 
          isVisible 
            ? `Expected element not to be visible, but it is`
            : `Expected element to be visible, but it isn't`,
        pass: isVisible
      };
    } catch (error) {
      return {
        message: () => `Error checking visibility: ${error.message}`,
        pass: false
      };
    }
  }
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
    const testName = expect.getState().currentTestName.replace(/\s+/g, '-').toLowerCase();
    console.log(`Test failed, taking screenshot: ${testName}`);
    
    try {
      await page.screenshot({ 
        path: `tests/e2e/screenshots/failed-${testName}.png`,
        fullPage: true 
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
```

