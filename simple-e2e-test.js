// Simple test script to check if the server starts
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting simple E2E test');

// Start the server
const server = spawn('node', ['server/index.js']);

// Log server output
server.stdout.on('data', (data) => {
  console.log(`Server output: ${data}`);
  
  // If server is running, try to connect
  if (data.toString().includes('Server running on port')) {
    const port = data.toString().match(/Server running on port (\d+)/)[1];
    console.log(`Detected port: ${port}`);
    
    // Wait a moment for the server to fully initialize
    setTimeout(() => {
      console.log(`Making request to http://localhost:${port}`);
      
      // Make a request to the server
      http.get(`http://localhost:${port}`, (res) => {
        console.log(`Response status: ${res.statusCode}`);
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Response length: ${data.length} bytes`);
          console.log('Test completed successfully');
          
          // Kill the server
          server.kill();
          process.exit(0);
        });
      }).on('error', (err) => {
        console.error(`Request error: ${err.message}`);
        server.kill();
        process.exit(1);
      });
    }, 1000);
  }
});

// Log server errors
server.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Set a timeout to kill the process if it takes too long
setTimeout(() => {
  console.error('Test timed out after 30 seconds');
  server.kill();
  process.exit(1);
}, 30000); 