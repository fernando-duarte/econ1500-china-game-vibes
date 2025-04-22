/**
 * Awaitable Socket.IO Integration Test
 * 
 * This test uses async/await with explicit Promises instead of callbacks
 * for better debugging and error handling with Socket.IO.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds timeout (very generous)

// Helper function to create a promise that times out after a given time
const createTimeoutPromise = (ms, message) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

// Helper function to connect a client with a timeout
const connectClientWithTimeout = (uri, options, timeoutMs) => {
  return new Promise((resolve, reject) => {
    console.log(`Connecting to ${uri} with timeout ${timeoutMs}ms`);
    
    // Create client
    const socket = Client(uri, options);
    
    // Set up event handlers
    socket.on('connect', () => {
      console.log(`Connected successfully as ${socket.id}`);
      resolve(socket);
    });
    
    socket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
      // Don't reject here to allow retries
    });
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!socket.connected) {
        console.error(`Connection timeout after ${timeoutMs}ms`);
        socket.disconnect();
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    
    // Clean up on error
    socket.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`Socket error: ${err.message}`);
      reject(err);
    });
  });
};

describe('Awaitable Socket.IO Test', () => {
  let httpServer;
  let io;
  let port;
  let clientSocket;
  
  beforeAll(async () => {
    console.log('Setting up test environment...');
    
    // Create HTTP server
    console.log('Creating HTTP server');
    httpServer = http.createServer((req, res) => {
      console.log(`HTTP request: ${req.method} ${req.url}`);
      res.writeHead(200);
      res.end('OK');
    });
    
    // Start server
    await new Promise((resolve) => {
      httpServer.listen(() => {
        port = httpServer.address().port;
        console.log(`HTTP server listening on port ${port}`);
        resolve();
      });
    });
    
    // Create Socket.IO server with minimalist configuration
    console.log('Creating Socket.IO server');
    io = new Server(httpServer, {
      cors: { origin: '*' },
      // Use both transports to maximize compatibility
      transports: ['polling', 'websocket'],
      // Increase timeouts for testing
      pingTimeout: 10000,
      pingInterval: 5000,
      connectTimeout: 15000
    });
    
    // Add connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Basic echo event for testing
      socket.on('echo', (data, callback) => {
        console.log(`Received echo with data: ${JSON.stringify(data)}`);
        if (typeof callback === 'function') {
          console.log('Sending echo response via callback');
          callback({ echo: data });
        }
      });
      
      // Log disconnect
      socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected: ${reason}`);
      });
    });
    
    console.log('Test setup complete');
  }, TEST_TIMEOUT);
  
  afterAll(async () => {
    console.log('Running test cleanup');
    
    // Disconnect client if it exists
    if (clientSocket && clientSocket.connected) {
      console.log('Disconnecting client');
      clientSocket.disconnect();
    }
    
    // Close Socket.IO server
    console.log('Closing Socket.IO server');
    await new Promise((resolve) => {
      io.close(() => {
        console.log('Socket.IO server closed');
        resolve();
      });
    });
    
    // Close HTTP server
    console.log('Closing HTTP server');
    await new Promise((resolve) => {
      httpServer.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
    
    console.log('Test cleanup complete');
  }, TEST_TIMEOUT);
  
  // Test HTTP server responds
  test('HTTP server should respond to requests', async () => {
    console.log(`Making HTTP request to port ${port}`);
    
    const response = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data });
        });
      }).on('error', reject);
    });
    
    console.log(`HTTP response: ${response.statusCode} ${response.data}`);
    expect(response.statusCode).toBe(200);
    expect(response.data).toBe('OK');
  }, TEST_TIMEOUT);
  
  // Test Socket.IO connection
  test('should establish Socket.IO connection', async () => {
    console.log(`Creating Socket.IO client for port ${port}`);
    
    try {
      // Try to connect with a timeout
      const connectPromise = connectClientWithTimeout(
        `http://localhost:${port}`,
        {
          transports: ['polling', 'websocket'],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 15000
        },
        20000 // 20 second timeout
      );
      
      // Race connection against timeout
      clientSocket = await Promise.race([
        connectPromise,
        createTimeoutPromise(25000, 'Global connection timeout after 25 seconds')
      ]);
      
      console.log('Connection established, verifying socket properties');
      expect(clientSocket.connected).toBe(true);
      
      // Test echo functionality
      console.log('Testing echo functionality');
      const testData = { test: 'hello' };
      
      const response = await new Promise((resolve) => {
        clientSocket.emit('echo', testData, (response) => {
          console.log(`Received echo response: ${JSON.stringify(response)}`);
          resolve(response);
        });
      });
      
      expect(response).toEqual({ echo: testData });
      console.log('Echo test successful');
      
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
      throw error;
    }
  }, TEST_TIMEOUT);
}); 