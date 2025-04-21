const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const waitOn = require('wait-on');
const path = require('path');

async function startTestServer() {
  // Start a test server on a different port
  const testPort = 3001;
  process.env.PORT = testPort;
  
  // Start the server as a child process
  const serverProcess = spawn('node', [path.join(__dirname, '../../server/index.js')], {
    env: { ...process.env, PORT: testPort },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Log server output for debugging
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  // Wait for the server to be available
  await waitOn({
    resources: [`http://localhost:${testPort}`],
    timeout: 30000
  });
  
  return {
    port: testPort,
    close: () => {
      return new Promise(resolve => {
        serverProcess.on('close', () => {
          resolve();
        });
        serverProcess.kill('SIGTERM');
      });
    }
  };
}

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: true, // Use true instead of 'new' for better compatibility
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });
  
  return {
    browser,
    closeBrowser: async () => {
      await browser.close();
    }
  };
}

module.exports = {
  startTestServer,
  launchBrowser
}; 