/**
 * Reliable Socket.IO Test
 *
 * This test demonstrates how to make Socket.IO tests work reliably
 * without mocks inside the Jest environment.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Import resource tracker
const {
  trackHttpServer,
  trackSocketServer,
  trackSocketClient,
  trackTimer,
  cleanupResources
} = require('../utils/resource-tracker');

// Global variables to track resources
let httpServer;
let ioServer;
let clientSocket;
let serverSocket;
let connectionTimeout;

// Helper function to create a promise with timeout
function createTimeoutPromise(ms, errorMessage) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Promise timed out after ${ms}ms`));
    }, ms);
    trackTimer(timeoutId);
  });
}

// Helper function to wait for an event
function waitForEvent(socket, event, timeout = 5000) {
  console.log(`Waiting for event: ${event}`);

  // Check if we've already received the event
  if (socket._callbacks && socket._callbacks[`$${event}`]) {
    console.log(`Event handler for ${event} already registered`);
  }

  return Promise.race([
    new Promise(resolve => {
      // Use on instead of once to catch events that might have been emitted already
      const listener = (...args) => {
        console.log(`Event received: ${event}`, args[0]);
        socket.off(event, listener); // Remove listener after receiving event
        resolve(args.length > 1 ? args : args[0]);
      };

      socket.on(event, listener);
      console.log(`Registered listener for event: ${event}`);
    }),
    createTimeoutPromise(timeout, `Timeout waiting for event "${event}"`)
  ]);
}

// Helper function to create a server
async function createServer() {
  return new Promise((resolve, reject) => {
    try {
      // Create HTTP server
      console.log('Creating HTTP server');
      const server = http.createServer();
      httpServer = trackHttpServer(server);

      // Create Socket.IO server with optimized settings
      console.log('Creating Socket.IO server');
      const io = new Server(server, {
        cors: { origin: '*' },
        transports: ['websocket'], // Use only websocket for faster tests
        pingTimeout: 1000, // Reduced for faster tests
        pingInterval: 1000, // Reduced for faster tests
        connectTimeout: 2000, // Reduced for faster tests
        forceNew: true,
        allowEIO3: true // Allow Engine.IO 3 clients
      });
      ioServer = trackSocketServer(io);

      // Set up connection handler
      io.on('connection', (socket) => {
        console.log(`Server received connection: ${socket.id}`);
        serverSocket = socket;

        // Send welcome message immediately with a slight delay to ensure client is ready
        setTimeout(() => {
          console.log(`Sending welcome message to ${socket.id}`);
          socket.emit('welcome', 'Hello from server');
        }, 100);

        // Set up echo handler
        socket.on('echo', (data, callback) => {
          console.log('Server received echo request:', data);
          if (typeof callback === 'function') {
            callback(data);
          } else {
            socket.emit('echo_response', data);
          }
        });
      });

      // Start server on random port
      server.listen(() => {
        const port = server.address().port;
        console.log(`Server listening on port ${port}`);
        resolve({ server, io, port });
      });

      // Handle server error
      server.on('error', (err) => {
        console.error('Server error:', err);
        reject(err);
      });
    } catch (err) {
      console.error('Error creating server:', err);
      reject(err);
    }
  });
}

// Helper function to create a client
function createClient(port) {
  console.log(`Creating client connecting to port ${port}`);
  const socket = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    timeout: 2000,
    autoConnect: false // Don't connect automatically
  });

  clientSocket = trackSocketClient(socket);

  // Set up error handler
  socket.on('connect_error', (err) => {
    console.error('Client connection error:', err.message);
  });

  return socket;
}

// Helper function to connect a client
async function connectClient(socket, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // Set timeout
    connectionTimeout = trackTimer(setTimeout(() => {
      reject(new Error(`Client connection timeout after ${timeout}ms`));
    }, timeout));

    // Handle connection
    socket.once('connect', () => {
      console.log(`Client connected with ID: ${socket.id}`);
      clearTimeout(connectionTimeout);
      resolve(socket);
    });

    // Connect
    socket.connect();
  });
}

describe('Reliable Socket.IO Test', () => {
  // Set up before all tests
  beforeAll(async () => {
    // Increase Jest timeout
    jest.setTimeout(10000);

    // Enable real console logs for debugging
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = function(...args) {
      process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
    };
    console.error = function(...args) {
      process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
    };

    // Store original functions for cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  });

  // Clean up after all tests
  afterAll((done) => {
    console.log('Running afterAll cleanup...');

    // Clean up client
    if (clientSocket) {
      if (clientSocket.connected) {
        console.log('Disconnecting client socket');
        clientSocket.disconnect();
      }
      clientSocket = null;
    }

    // Clean up server
    if (ioServer) {
      console.log('Closing Socket.IO server');
      ioServer.close();
      ioServer = null;
    }

    // Clean up HTTP server
    if (httpServer) {
      console.log('Closing HTTP server');
      httpServer.close(() => {
        console.log('HTTP server closed');
        httpServer = null;
        done();
      });
    } else {
      done();
    }
  });

  // Test server creation
  test('should create a Socket.IO server', async () => {
    const { server, io, port } = await createServer();

    expect(server).toBeDefined();
    expect(io).toBeDefined();
    expect(port).toBeGreaterThan(0);

    console.log('Server created successfully');
  });

  // Test client connection
  test('should connect client to server', async () => {
    // Get port from server
    const port = httpServer.address().port;

    // Create client
    const socket = createClient(port);

    // Connect client
    await connectClient(socket);

    // Verify connection
    expect(socket.connected).toBe(true);

    console.log('Client connected successfully');
  });

  // Test communication
  test('should send and receive messages', async () => {
    // Verify client is connected
    expect(clientSocket.connected).toBe(true);

    // Wait for welcome message
    const welcomeMessage = await waitForEvent(clientSocket, 'welcome');
    expect(welcomeMessage).toBe('Hello from server');
    console.log('Received welcome message:', welcomeMessage);

    // Test echo functionality
    const testData = { message: 'test', timestamp: Date.now() };
    console.log('Sending echo request:', testData);

    const response = await new Promise((resolve) => {
      clientSocket.emit('echo', testData, (data) => {
        console.log('Received echo response:', data);
        resolve(data);
      });
    });

    expect(response).toEqual(testData);
    console.log('Echo test passed');
  });
});
