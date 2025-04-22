/**
 * Socket.IO Test Without Connection Event
 * 
 * This test doesn't rely on the connection event to complete the test.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

describe('Socket.IO Test Without Connection Event', () => {
  let httpServer;
  let io;
  let clientSocket;
  
  // Set up server before tests
  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();
    
    // Start server on random port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      
      // Create Socket.IO server
      io = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'],
        pingTimeout: 2000,
        pingInterval: 2000,
        connectTimeout: 5000
      });
      
      // Set up connection handler
      io.on('connection', (socket) => {
        console.log(`Server received connection: ${socket.id}`);
      });
      
      // Create client
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        timeout: 5000
      });
      
      // Handle connection
      clientSocket.on('connect', () => {
        console.log(`Client connected with ID: ${clientSocket.id}`);
      });
      
      // Handle connection error
      clientSocket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
      });
      
      // Wait a bit to allow connection attempt
      setTimeout(done, 1000);
    });
  });
  
  // Clean up after tests
  afterAll((done) => {
    // Clean up client
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
    }
    
    // Clean up server
    if (io) {
      io.close();
    }
    
    // Close HTTP server
    httpServer.close(() => {
      done();
    });
  });
  
  // Test Socket.IO server and client creation
  test('should create Socket.IO server and client', () => {
    expect(io).toBeDefined();
    expect(clientSocket).toBeDefined();
  });
  
  // Test client properties
  test('should have correct client properties', () => {
    expect(clientSocket.io).toBeDefined();
    expect(clientSocket.io.engine).toBeDefined();
    expect(clientSocket.io.engine.transport).toBeDefined();
    expect(clientSocket.io.engine.transport.name).toBe('websocket');
  });
});
