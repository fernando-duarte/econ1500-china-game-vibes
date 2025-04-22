/**
 * Minimal Socket.IO Test
 * 
 * This test focuses solely on establishing a Socket.IO connection
 * with minimal configuration and proper cleanup.
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

describe('Minimal Socket.IO Test', () => {
  // Clean up after all tests
  afterAll((done) => {
    console.log('Running afterAll cleanup...');
    
    // Clean up client
    if (activeResources.clientSocket) {
      if (activeResources.clientSocket.connected) {
        console.log('Disconnecting client socket');
        activeResources.clientSocket.disconnect();
      }
      activeResources.clientSocket = null;
    }
    
    // Clean up server
    if (activeResources.io) {
      console.log('Closing Socket.IO server');
      activeResources.io.close();
      activeResources.io = null;
    }
    
    // Clean up HTTP server
    if (activeResources.httpServer) {
      console.log('Closing HTTP server');
      activeResources.httpServer.close(() => {
        console.log('HTTP server closed');
        activeResources.httpServer = null;
        done();
      });
    } else {
      done();
    }
  });

  // Test basic Socket.IO connection
  test('should establish a basic Socket.IO connection', (done) => {
    // Create HTTP server
    console.log('Creating HTTP server');
    const httpServer = http.createServer();
    activeResources.httpServer = httpServer;
    
    // Start server on random port
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      
      // Create Socket.IO server
      console.log('Creating Socket.IO server');
      const io = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'], // Use only websocket transport
        pingTimeout: 2000,
        pingInterval: 2000,
        connectTimeout: 5000
      });
      activeResources.io = io;
      
      // Handle connections
      io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        
        // Send a test message
        socket.emit('test', { message: 'Hello from server' });
        
        // Mark test as done when connection is established
        done();
      });
      
      // Create client
      console.log('Creating Socket.IO client');
      const clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        timeout: 5000
      });
      activeResources.clientSocket = clientSocket;
      
      // Handle client events
      clientSocket.on('connect', () => {
        console.log(`Client connected with ID: ${clientSocket.id}`);
      });
      
      clientSocket.on('test', (data) => {
        console.log('Received test message:', data);
        expect(data).toHaveProperty('message');
        expect(data.message).toBe('Hello from server');
      });
      
      clientSocket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
      });
    });
  }, 15000); // Increase timeout for this test
});
