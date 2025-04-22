/**
 * Socket.IO Debug Test
 * 
 * This test provides detailed debugging information for Socket.IO connections
 * and helps diagnose connection issues.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Enable Socket.IO debug logs
process.env.DEBUG = 'socket.io:*';

// Track resources for cleanup
const activeResources = {
  httpServer: null,
  io: null,
  clientSocket: null
};

describe('Socket.IO Debug Test', () => {
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

  // Test Socket.IO connection with debugging
  test('should establish a Socket.IO connection with debug info', (done) => {
    // Create HTTP server
    console.log('Creating HTTP server');
    const httpServer = http.createServer();
    activeResources.httpServer = httpServer;
    
    // Start server on random port
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      
      // Create Socket.IO server with all debugging options
      console.log('Creating Socket.IO server with debug options');
      const io = new Server(httpServer, {
        // Explicitly set transport methods
        transports: ['websocket', 'polling'],
        
        // Enable CORS for all origins
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        
        // Connection timeout
        connectTimeout: 5000,
        
        // Other settings
        pingInterval: 2000,
        pingTimeout: 5000,
        
        // Explicitly set to lowest level for debugging
        logLevel: 0
      });
      activeResources.io = io;
      
      // Handle connections
      io.on('connection', (socket) => {
        console.log(`Server received connection: ${socket.id}`);
        
        // Log socket details
        console.log('Socket details:', {
          id: socket.id,
          handshake: {
            address: socket.handshake.address,
            headers: socket.handshake.headers,
            query: socket.handshake.query,
            time: socket.handshake.time
          },
          rooms: Array.from(socket.rooms || []),
          connected: socket.connected
        });
        
        // Send a test message
        socket.emit('welcome', 'Connected to server!');
        
        // Mark test as done when connection is established
        done();
      });
      
      // Create client with debug options
      console.log('Creating Socket.IO client with debug options');
      const clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
        // Add query parameters for debugging
        query: {
          clientId: 'debug-client',
          timestamp: Date.now()
        }
      });
      activeResources.clientSocket = clientSocket;
      
      // Handle client events with detailed logging
      clientSocket.on('connect', () => {
        console.log(`Client connected with ID: ${clientSocket.id}`);
        console.log('Client transport:', clientSocket.io.engine.transport.name);
        console.log('Client protocol:', clientSocket.io.engine.protocol);
      });
      
      clientSocket.on('welcome', (data) => {
        console.log('Received welcome message:', data);
        expect(data).toBe('Connected to server!');
      });
      
      clientSocket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        console.error('Error details:', err);
      });
      
      clientSocket.on('disconnect', (reason) => {
        console.log(`Client disconnected. Reason: ${reason}`);
      });
      
      clientSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Reconnection attempt #${attemptNumber}`);
      });
    });
  }, 15000); // Increase timeout for this test
});
