/**
 * Socket.IO Test Utilities
 *
 * Provides utilities for reliable Socket.IO testing without mocks.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const { trackHttpServer, trackSocketServer, trackSocketClient, trackTimer } = require('./resource-tracker');

/**
 * Create a promise with timeout
 * @param {number} ms - Timeout in milliseconds
 * @param {string} [errorMessage] - Error message
 * @returns {Promise} Promise that rejects after timeout
 */
function createTimeoutPromise(ms, errorMessage) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Promise timed out after ${ms}ms`));
    }, ms);
    trackTimer(timeoutId);
  });
}

/**
 * Wait for an event
 * @param {SocketIO.Socket} socket - Socket to listen on
 * @param {string} event - Event name
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise} Promise that resolves with event data
 */
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

/**
 * Create a Socket.IO server
 * @param {Object} [options] - Server options
 * @returns {Promise<Object>} Promise that resolves with server info
 */
async function createServer(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Create HTTP server
      console.log('Creating HTTP server');
      const server = http.createServer();
      const httpServer = trackHttpServer(server);

      // Set a timeout for server creation
      const serverTimeout = trackTimer(setTimeout(() => {
        reject(new Error('Timed out creating Socket.IO server'));
      }, 15000));

      // Create Socket.IO server with optimized settings
      console.log('Creating Socket.IO server');
      const io = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'], // Use only websocket for faster tests
        pingTimeout: 2000, // Increased for more reliability
        pingInterval: 2000, // Increased for more reliability
        connectTimeout: 5000, // Increased for more reliability
        forceNew: true,
        allowEIO3: true, // Allow Engine.IO 3 clients
        ...options
      });
      const ioServer = trackSocketServer(io);

      // Set up connection handler
      io.on('connection', (socket) => {
        console.log(`Server received connection: ${socket.id}`);

        // Send welcome message immediately with a slight delay to ensure client is ready
        setTimeout(() => {
          console.log(`Sending welcome message to ${socket.id}`);
          socket.emit('welcome', 'Hello from server');
        }, 300); // Increased delay for more reliability

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
        clearTimeout(serverTimeout);
        resolve({ httpServer, ioServer, port });
      });

      // Handle server error
      server.on('error', (err) => {
        console.error('Server error:', err);
        clearTimeout(serverTimeout);
        reject(err);
      });
    } catch (err) {
      console.error('Error creating server:', err);
      reject(err);
    }
  });
}

/**
 * Create a Socket.IO client
 * @param {number} port - Server port
 * @param {Object} [options] - Client options
 * @returns {SocketIO.Socket} Socket.IO client
 */
function createClient(port, options = {}) {
  console.log(`Creating client connecting to port ${port}`);
  const socket = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 5000, // Increased for more reliability
    autoConnect: false, // Don't connect automatically
    ...options
  });

  const clientSocket = trackSocketClient(socket);

  // Set up event handlers
  socket.on('connect_error', (err) => {
    console.error('Client connection error:', err.message);
  });

  socket.on('connect_timeout', () => {
    console.error('Client connection timeout');
  });

  socket.on('welcome', (msg) => {
    console.log('Client received welcome message:', msg);
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected. Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

/**
 * Connect a Socket.IO client
 * @param {SocketIO.Socket} socket - Socket.IO client
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<SocketIO.Socket>} Promise that resolves with connected socket
 */
async function connectClient(socket, timeout = 15000) {
  return new Promise((resolve, reject) => {
    // Set timeout
    const connectionTimeout = trackTimer(setTimeout(() => {
      reject(new Error(`Client connection timeout after ${timeout}ms`));
    }, timeout));

    // Handle connection
    socket.once('connect', () => {
      console.log(`Client connected with ID: ${socket.id}`);
      clearTimeout(connectionTimeout);

      // Wait a bit to ensure connection is stable
      setTimeout(() => {
        resolve(socket);
      }, 500);
    });

    // Handle connection errors
    const errorHandler = (error) => {
      console.error('Connection error:', error);
      // Don't reject here, let the timeout handle it
    };
    socket.once('connect_error', errorHandler);

    // Connect
    console.log('Connecting client...');
    socket.connect();
  });
}

/**
 * Create a Socket.IO server and client
 * @param {Object} [serverOptions] - Server options
 * @param {Object} [clientOptions] - Client options
 * @returns {Promise<Object>} Promise that resolves with server and client
 */
async function createServerAndClient(serverOptions = {}, clientOptions = {}) {
  // Create server
  const { httpServer, ioServer, port } = await createServer(serverOptions);

  // Create client
  const clientSocket = createClient(port, clientOptions);

  // Connect client
  await connectClient(clientSocket);

  return { httpServer, ioServer, clientSocket, port };
}

/**
 * Clean up Socket.IO resources
 * @param {Object} resources - Resources to clean up
 * @param {Function} [callback] - Callback to run after cleanup
 */
function cleanupSocketResources(resources, callback) {
  if (!resources) {
    console.log('No resources to clean up');
    if (callback) callback();
    return;
  }

  const { clientSocket, ioServer, httpServer } = resources;

  console.log('Cleaning up Socket.IO resources...');

  // Clean up client
  if (clientSocket) {
    try {
      if (clientSocket.connected) {
        console.log('Disconnecting client socket');
        clientSocket.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting client socket:', err);
    }
  }

  // Clean up server
  if (ioServer) {
    try {
      console.log('Closing Socket.IO server');
      ioServer.close();
    } catch (err) {
      console.error('Error closing Socket.IO server:', err);
    }
  }

  // Set a timeout to force callback if HTTP server doesn't close properly
  const forceCloseTimeout = setTimeout(() => {
    console.warn('HTTP server close timed out, forcing cleanup');
    if (callback) callback();
  }, 5000);
  trackTimer(forceCloseTimeout);

  // Clean up HTTP server
  if (httpServer) {
    try {
      console.log('Closing HTTP server');
      httpServer.close(() => {
        console.log('HTTP server closed');
        clearTimeout(forceCloseTimeout);
        if (callback) callback();
      });
    } catch (err) {
      console.error('Error closing HTTP server:', err);
      clearTimeout(forceCloseTimeout);
      if (callback) callback();
    }
  } else {
    clearTimeout(forceCloseTimeout);
    if (callback) callback();
  }
}

module.exports = {
  createTimeoutPromise,
  waitForEvent,
  createServer,
  createClient,
  connectClient,
  createServerAndClient,
  cleanupSocketResources
};
