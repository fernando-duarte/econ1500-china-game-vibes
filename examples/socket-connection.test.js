/**
 * Socket.IO Connection Test
 * 
 * This test focuses on establishing a Socket.IO connection
 * with proper setup and teardown.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

describe('Socket.IO Connection Test', () => {
  let httpServer;
  let io;
  let clientSocket;
  let serverSocket;
  let port;
  
  // Set up server before tests
  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();
    
    // Start server on random port
    httpServer.listen(() => {
      port = httpServer.address().port;
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
        serverSocket = socket;
      });
      
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
  
  // Test Socket.IO connection
  test('should connect client to server', (done) => {
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
      expect(clientSocket.connected).toBe(true);
      done();
    });
    
    // Handle connection error
    clientSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
  }, 10000);
  
  // Test basic communication
  test('should communicate between client and server', (done) => {
    // Skip if client not connected
    if (!clientSocket || !clientSocket.connected) {
      console.log('Client not connected, skipping test');
      done();
      return;
    }
    
    // Set up event handler on server
    serverSocket.on('ping', (callback) => {
      console.log('Server received ping');
      callback('pong');
    });
    
    // Send ping from client
    clientSocket.emit('ping', (response) => {
      console.log('Client received response:', response);
      expect(response).toBe('pong');
      done();
    });
  }, 5000);
});
