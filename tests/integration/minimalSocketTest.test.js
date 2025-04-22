const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Test configuration
const TEST_TIMEOUT = 10000; // 10 seconds timeout
const CONNECTION_TIMEOUT = 5000; // 5 seconds connection timeout

describe('Minimal Socket.IO Connection Test', () => {
  let httpServer;
  let server;
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    // Create HTTP server with a basic request handler
    httpServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    // Create Socket.IO server with configuration matching the main app
    server = new Server(httpServer, {
      cors: { origin: "*" },
      transports: ['websocket'], // Use only websocket to match server/index.js test config
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000
    });

    // Basic connection handler
    server.on('connection', (socket) => {
      console.log(`[Server] Client connected: ${socket.id}`);
      serverSocket = socket;

      // Basic ping test
      socket.on('ping', (callback) => {
        console.log(`[Server] Received ping from ${socket.id}`);
        callback('pong');
      });
    });

    // Start server and get port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`[Server] Started on port ${port}`);
      done();
    });
  }, TEST_TIMEOUT);

  afterAll((done) => {
    console.log('[Test] Running cleanup...');

    // Cleanup client
    if (clientSocket) {
      console.log('[Client] Disconnecting client');
      clientSocket.disconnect();
      clientSocket = null;
    }

    // Close server
    console.log('[Server] Closing server');
    server.close();
    httpServer.close(done);
  }, TEST_TIMEOUT);

  // The actual test
  test('should connect to Socket.IO server', (done) => {
    const port = httpServer.address().port;
    console.log(`[Client] Connecting to server on port ${port}`);

    // Create client with configuration matching the server
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'], // Match server transport
      forceNew: true,
      reconnection: false,
      timeout: CONNECTION_TIMEOUT
    });

    // Connection successful
    clientSocket.on('connect', () => {
      console.log('[Client] Successfully connected');

      // Verify connection
      expect(clientSocket.connected).toBe(true);

      // Try to communicate with server
      clientSocket.emit('ping', (response) => {
        console.log(`[Client] Received response: ${response}`);
        expect(response).toBe('pong');
        done();
      });
    });

    // Handle connection errors with better logging
    clientSocket.on('connect_error', (error) => {
      console.error(`[Client] Connection error: ${error.message}`);
      // Don't fail the test immediately to allow for retries
    });

    clientSocket.on('error', (error) => {
      console.error(`[Client] Socket error: ${error.message}`);
    });

    // Add disconnect handler for debugging
    clientSocket.on('disconnect', (reason) => {
      console.log(`[Client] Disconnected: ${reason}`);
    });

    // Set timeout to fail if connection doesn't happen
    setTimeout(() => {
      if (!clientSocket.connected) {
        console.error(`[Client] Connection timeout after ${CONNECTION_TIMEOUT/1000} seconds`);
        done(new Error(`Connection timeout - socket did not connect within ${CONNECTION_TIMEOUT/1000} seconds`));
      }
    }, CONNECTION_TIMEOUT);
  }, TEST_TIMEOUT);
});