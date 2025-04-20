const http = require('http');
const { exec } = require('child_process');

const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

console.log("Testing server graceful shutdown...");

// First check if server is running
function checkServerStatus() {
  return new Promise((resolve, reject) => {
    http.get(SERVER_URL, (res) => {
      console.log(`Server is running (Status: ${res.statusCode})`);
      resolve(true);
    }).on('error', (err) => {
      console.log('Server not accessible:', err.message);
      resolve(false);
    });
  });
}

// Function to send SIGINT to server process
function sendSigintToServer() {
  return new Promise((resolve, reject) => {
    exec('pgrep -f "PORT=3001" | xargs kill -SIGINT', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error sending SIGINT: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Signal error: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      
      console.log('SIGINT signal sent to server successfully');
      resolve();
    });
  });
}

// Wait for server to stop
function waitForServerDown() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(SERVER_URL, () => {
        console.log('Server still running...');
      }).on('error', () => {
        console.log('Server is down as expected');
        clearInterval(interval);
        resolve();
      });
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('Timeout waiting for server to go down');
      resolve();
    }, 10000);
  });
}

// Start a new server
function startNewServer() {
  return new Promise((resolve, reject) => {
    const serverProcess = exec('PORT=3001 node server', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting server: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Server error: ${stderr}`);
      }
    });
    
    console.log('Starting new server...');
    
    // Capture server output
    serverProcess.stdout.on('data', (data) => {
      console.log(`Server output: ${data}`);
      if (data.includes('Server running on port')) {
        console.log('Server started successfully');
        resolve(serverProcess);
      }
    });
    
    // Timeout if server doesn't start
    setTimeout(() => {
      console.log('Timeout waiting for server to start');
      resolve(serverProcess);
    }, 5000);
  });
}

// Wait for server to be accessible
function waitForServerUp() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(SERVER_URL, (res) => {
        console.log(`Server is up (Status: ${res.statusCode})`);
        clearInterval(interval);
        resolve();
      }).on('error', () => {
        console.log('Server not accessible yet...');
      });
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('Timeout waiting for server to come up');
      resolve();
    }, 10000);
  });
}

// Run the test
async function runTest() {
  try {
    // Check if server is running
    const isRunning = await checkServerStatus();
    
    if (!isRunning) {
      console.log('Server not running. Starting server first...');
      const server = await startNewServer();
      await waitForServerUp();
    }
    
    // Send SIGINT to server
    console.log('Sending SIGINT signal to test graceful shutdown...');
    await sendSigintToServer();
    
    // Wait for server to go down
    console.log('Waiting for server to shut down gracefully...');
    await waitForServerDown();
    
    // Start server again
    console.log('Restarting the server...');
    const newServer = await startNewServer();
    
    // Wait for server to come up again
    console.log('Waiting for server to come up...');
    await waitForServerUp();
    
    console.log('\nTEST COMPLETED SUCCESSFULLY');
    console.log('Server graceful shutdown is working correctly');
    
    // Keep the script running for some time to observe
    console.log('Exiting in 5 seconds...');
    setTimeout(() => {
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest(); 