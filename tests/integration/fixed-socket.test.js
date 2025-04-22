/**
 * Fixed Socket.IO Integration Test
 * 
 * This test focuses on fixing the Socket.IO connection issues
 * with enhanced debugging, error handling, and proper cleanup.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Enable real console for better debugging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
};

console.error = function(...args) {
  process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
};

// Test configuration
const TEST_TIMEOUT = 30000; // Longer timeout to prevent premature failures
const CONNECTION_TIMEOUT = 5000; // Longer connection timeout

describe('Fixed Socket.IO Connection Test', () => {
  let httpServer;
  let io;
  let clientSocket;
  let serverSocket;
  let port;

  beforeAll((done) => {
    // Create HTTP server with explicit request handler for diagnostics
    console.log('SETUP: Creating HTTP server');
    httpServer = http.createServer((req, res) => {
      console.log(`SETUP: HTTP request received: ${req.method} ${req.url}`);
      res.writeHead(200);
      res.end('OK');
    });
    
    // Create Socket.IO server with compatible options
    console.log('SETUP: Creating Socket.IO server');
    io = new Server(httpServer, {
      // Options that work well in testing environments:
      cors: { origin: '*' },
      connectTimeout: 10000,
      pingTimeout: 10000,
      pingInterval: 3000,
      // Support both transports for compatibility
      transports: ['polling', 'websocket']
    });
    
    // Set up Socket.IO connection handler
    console.log('SETUP: Setting up Socket.IO connection handler');
    io.on('connection', (socket) => {
      console.log(`SOCKET SERVER: Client connected with ID: ${socket.id}`);
      serverSocket = socket;
      
      // Set up echo event for testing
      socket.on('echo', (data, callback) => {
        console.log(`SOCKET SERVER: Received echo event with data: ${JSON.stringify(data)}`);
        if (typeof callback === 'function') {
          console.log('SOCKET SERVER: Calling echo callback');
          callback({ echo: data });
        } else {
          console.log('SOCKET SERVER: No callback provided, emitting response');
          socket.emit('echo:response', { echo: data });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`SOCKET SERVER: Client ${socket.id} disconnected: ${reason}`);
      });
    });
    
    // Start server on random port and wait for it to be ready
    console.log('SETUP: Starting HTTP server on random port');
    httpServer.listen(() => {
      port = httpServer.address().port;
      console.log(`SETUP: Server listening on port ${port}`);
      done();
    });
  }, TEST_TIMEOUT);
  
  afterAll((done) => {
    console.log('CLEANUP: Starting cleanup');
    
    // Clean up client if it exists
    if (clientSocket) {
      if (clientSocket.connected) {
        console.log('CLEANUP: Disconnecting client socket');
        clientSocket.disconnect();
      } else {
        console.log('CLEANUP: Client socket not connected');
      }
    }
    
    // Close Socket.IO server first
    console.log('CLEANUP: Closing Socket.IO server');
    io.close(() => {
      console.log('CLEANUP: Socket.IO server closed');
      
      // Then close HTTP server
      console.log('CLEANUP: Closing HTTP server');
      httpServer.close(() => {
        console.log('CLEANUP: HTTP server closed');
        
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        
        done();
      });
    });
  }, TEST_TIMEOUT);
  
  // Test HTTP server first to verify basic connectivity
  test('HTTP server should respond to requests', (done) => {
    console.log(`HTTP TEST: Making request to port ${port}`);
    
    http.get(`http://localhost:${port}`, (res) => {
      console.log(`HTTP TEST: Got response: ${res.statusCode}`);
      expect(res.statusCode).toBe(200);
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`HTTP TEST: Got data: ${data}`);
        expect(data).toBe('OK');
        done();
      });
    }).on('error', (err) => {
      console.error(`HTTP TEST: Error: ${err.message}`);
      done(err);
    });
  }, TEST_TIMEOUT);
  
  // Now test Socket.IO connection
  test('should establish Socket.IO connection', (done) => {
    console.log(`SOCKET TEST: Creating client connection to port ${port}`);
    
    // Create client with proper configuration
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['polling', 'websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000 // Extended timeout
    });
    
    // Set connection event handlers
    clientSocket.on('connect', () => {
      console.log(`SOCKET TEST: Client connected successfully with ID: ${clientSocket.id}`);
      console.log(`SOCKET TEST: Using transport: ${clientSocket.io.engine.transport.name}`);
      
      // Verify connection
      expect(clientSocket.connected).toBe(true);
      
      // Test echo functionality
      console.log('SOCKET TEST: Sending echo message');
      clientSocket.emit('echo', { test: 'hello' }, (response) => {
        console.log(`SOCKET TEST: Got echo response: ${JSON.stringify(response)}`);
        expect(response).toEqual({ echo: { test: 'hello' } });
        done();
      });
    });
    
    // Handle connection error for debugging
    clientSocket.on('connect_error', (err) => {
      console.error(`SOCKET TEST: Connection error: ${err.message}`);
      console.error('SOCKET TEST: Full error:', err);
      // Don't fail test yet to allow retries
    });
    
    // Debug transport events
    clientSocket.io.engine.on('upgrade', () => {
      console.log('SOCKET TEST: Transport upgraded');
    });
    
    clientSocket.io.engine.on('upgradeError', (err) => {
      console.error(`SOCKET TEST: Transport upgrade error: ${err.message}`);
    });
    
    // Set timeout to fail if connection doesn't happen
    const timeoutId = setTimeout(() => {
      if (!clientSocket.connected) {
        console.error('SOCKET TEST: Connection timeout after 10 seconds');
        done(new Error('Socket.IO connection timeout after 10 seconds'));
      }
    }, 10000);
    
    // Clean up timeout if test completes
    clientSocket.on('connect', () => {
      clearTimeout(timeoutId);
    });
  }, TEST_TIMEOUT);
}); 