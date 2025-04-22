const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

describe('Basic Socket.IO Connection Test', () => {
  let httpServer;
  let io;
  let clientSocket;
  const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

  beforeAll((done) => {
    // Create a simple HTTP server with a basic request handler
    httpServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    // Create Socket.IO server with configuration matching the main app
    io = new Server(httpServer, {
      cors: { origin: "*" },
      transports: ['websocket'], // Use only websocket to match server/index.js test config
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000
    });

    // Set up a simple connection handler with better logging
    io.on('connection', (socket) => {
      console.log(`Client connected to server: ${socket.id}`);

      // Add a simple echo event for testing
      socket.on('echo', (data, callback) => {
        console.log(`Received echo request: ${JSON.stringify(data)}`);
        callback(data);
      });
    });

    // Start the server on a random port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`Server started on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    console.log('Running cleanup...');

    // Clean up client
    if (clientSocket) {
      console.log('Disconnecting client');
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
    }

    // Close the server
    console.log('Closing server');
    io.close();
    httpServer.close(() => {
      console.log('Server closed');
      done();
    });
  });

  // This is the core test - just check if a basic socket can connect
  it('should connect to Socket.IO server', (done) => {
    // Get the port that the server is running on
    const port = httpServer.address().port;
    console.log(`Server running on port ${port}`);

    // Create client with configuration matching the server
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'], // Match server transport
      forceNew: true,
      reconnection: false,
      timeout: CONNECTION_TIMEOUT
    });

    // Set timeout to fail the test if connection doesn't happen
    const timeoutId = setTimeout(() => {
      console.error(`Connection timeout after ${CONNECTION_TIMEOUT/1000} seconds`);
      done(new Error(`Connection timeout - socket did not connect within ${CONNECTION_TIMEOUT/1000} seconds`));
    }, CONNECTION_TIMEOUT);

    // Connection successful
    clientSocket.on('connect', () => {
      console.log('Client connected successfully');
      clearTimeout(timeoutId);

      // Simple check to verify connection
      expect(clientSocket.connected).toBe(true);

      // Test echo functionality
      const testData = { message: 'test' };
      clientSocket.emit('echo', testData, (response) => {
        console.log(`Received echo response: ${JSON.stringify(response)}`);
        expect(response).toEqual(testData);
        done();
      });
    });

    // Handle connection errors with better logging
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
      // Don't fail the test immediately to allow for retries
    });

    clientSocket.on('error', (err) => {
      console.error(`Socket error: ${err.message}`);
    });

    // Add disconnect handler for debugging
    clientSocket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${reason}`);
    });
  });
});