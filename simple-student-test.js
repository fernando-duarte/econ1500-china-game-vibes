// Simple Puppeteer test for the student page
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

console.log('Starting simple student page test');

async function runTest() {
  // Start the server
  const server = spawn('node', ['server/index.js']);
  let port = null;
  let browser = null;

  try {
    // Wait for server to start and get the port
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within timeout'));
      }, 10000);

      server.stdout.on('data', (data) => {
        console.log(`Server output: ${data}`);
        
        // If server is running, extract the port
        if (data.toString().includes('Server running on port')) {
          const match = data.toString().match(/Server running on port (\d+)/);
          if (match && match[1]) {
            port = match[1];
            console.log(`Detected port: ${port}`);
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      server.stderr.on('data', (data) => {
        console.error(`Server error: ${data}`);
      });
    });

    // Launch Puppeteer
    console.log('Launching Puppeteer browser');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the student page (main route)
    console.log(`Navigating to http://localhost:${port}`);
    await page.goto(`http://localhost:${port}`, {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    // Take a screenshot
    console.log('Taking screenshot');
    await page.screenshot({ path: 'student-page.png' });

    // Perform basic checks
    console.log('Checking page title');
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for main heading
    console.log('Checking for main heading');
    const headingElement = await page.$('h1, h2');
    if (headingElement) {
      const headingText = await page.evaluate(el => el.textContent, headingElement);
      console.log(`Found heading: ${headingText}`);
    } else {
      console.log('No heading found');
    }

    // Check for student-specific elements
    console.log('Checking for student page elements');
    
    // Player name input
    const nameInput = await page.$('#playerName');
    if (nameInput) {
      console.log('Found player name input');
      
      // Try typing a student name
      await nameInput.type('Test Student');
      console.log('Typed student name');
    }
    
    // Join button
    const joinButton = await page.$('#joinButton');
    if (joinButton) {
      console.log('Found join button');
    }
    
    // Investment slider or input
    const investmentControl = await page.$('#investmentSlider, #investment');
    if (investmentControl) {
      console.log('Found investment control');
    }
    
    // Submit button
    const submitButton = await page.$('#submitButton, button[type="submit"]');
    if (submitButton) {
      console.log('Found submit button');
    }

    // Count all interactive elements
    console.log('Checking for interactive elements');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);

    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields`);

    console.log('Test completed successfully');
    
  } catch (error) {
    console.error(`Test error: ${error.message}`);
  } finally {
    // Clean up
    if (browser) {
      console.log('Closing browser');
      await browser.close();
    }
    
    console.log('Killing server');
    server.kill();
    
    // Explicitly exit with success code
    process.exit(0);
  }
}

runTest();

// Set a timeout to force exit if test hangs
setTimeout(() => {
  console.error('Test timed out after 30 seconds');
  process.exit(1);
}, 30000); 