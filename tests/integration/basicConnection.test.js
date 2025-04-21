const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

describe('Basic Socket.IO Connection Test', () => {
  let httpServer;
  let io;
  let clientSocket;

  beforeAll((done) => {
    // Create a simple HTTP server
    httpServer = http.createServer();
    
    // Create Socket.IO server
    io = new Server(httpServer);
    
    // Set up a simple connection handler
    io.on('connection', (socket) => {
      console.log('Client connected to server');
    });
    
    // Start the server on a random port
    httpServer.listen(() => {
      done();
    });
  });

  afterAll((done) => {
    // Clean up
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
    }
    
    // Close the server
    io.close();
    httpServer.close(() => {
      done();
    });
  });

  // This is the core test - just check if a basic socket can connect
  it('should connect to Socket.IO server', (done) => {
    // Get the port that the server is running on
    const port = httpServer.address().port;
    console.log(`Server running on port ${port}`);
    
    // Create client
    clientSocket = Client(`http://localhost:${port}`);
    
    // Set timeout to fail the test if connection doesn't happen
    const timeoutId = setTimeout(() => {
      done(new Error('Connection timeout - socket did not connect within 3 seconds'));
    }, 3000);
    
    // Connection successful
    clientSocket.on('connect', () => {
      clearTimeout(timeoutId);
      
      // Simple check to verify connection
      expect(clientSocket.connected).toBe(true);
      
      done();
    });
    
    // Handle connection errors
    clientSocket.on('connect_error', (err) => {
      clearTimeout(timeoutId);
      done(new Error(`Connection error: ${err.message}`));
    });
  });
}); 