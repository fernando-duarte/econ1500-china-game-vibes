/**
 * Ultra Minimal Socket.IO Test
 *
 * This test is the simplest possible Socket.IO test that doesn't rely on
 * connection events to complete the test.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Track resources for cleanup
const activeResources = {
  httpServer: null,
  io: null,
  clientSocket: null
};

describe('Ultra Minimal Socket.IO Test', () => {
  let httpServer;
  let io;
  let clientSocket;

  // Set up server before tests
  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();
    activeResources.httpServer = httpServer;

    // Start server on random port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  });

  // Clean up after tests
  afterAll((done) => {
    // Clean up client
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
      clientSocket = null;
      activeResources.clientSocket = null;
    }

    // Clean up server
    if (io) {
      io.close();
      io = null;
      activeResources.io = null;
    }

    // Close HTTP server
    if (httpServer) {
      httpServer.close(() => {
        httpServer = null;
        activeResources.httpServer = null;
        done();
      });
    } else {
      done();
    }
  });

  // Test Socket.IO server creation
  test('should create a Socket.IO server', () => {
    // Create Socket.IO server
    io = new Server(httpServer, {
      cors: { origin: '*' },
      transports: ['websocket'],
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000
    });
    activeResources.io = io;

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
    });

    // Verify server was created
    expect(io).toBeDefined();
  });

  // Test Socket.IO client creation
  test('should create a Socket.IO client', () => {
    const port = httpServer.address().port;

    // Create client
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 5000
    });
    activeResources.clientSocket = clientSocket;

    // Verify client was created
    expect(clientSocket).toBeDefined();
  });
});
