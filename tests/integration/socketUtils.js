const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Track active clients and servers for cleanup
const activeClients = new Set();
const activeServers = new Set();

// Add debugging to console
const log = (...args) => {
  if (typeof console.log === 'function' && console.log.mock) {
    // If console.log is mocked, use process.stdout directly
    process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
  } else {
    console.log(...args);
  }
};

const error = (...args) => {
  if (typeof console.error === 'function' && console.error.mock) {
    // If console.error is mocked, use process.stderr directly
    process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
  } else {
    console.error(...args);
  }
};

async function createSocketServer() {
  // Create an HTTP server
  log('Creating HTTP server...');
  const httpServer = createServer();

  // Create Socket.IO server
  log('Creating Socket.IO server...');
  const io = new Server(httpServer, {
    // Add explicit configuration for test environment
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 2000, // Reduce ping timeout for tests
    pingInterval: 2000, // Reduce ping interval for tests
    connectTimeout: 5000, // Reduce connection timeout
  });

  // Set up Socket.IO event handlers
  log('Setting up socket events...');
  try {
    const { setupSocketEvents } = require('../../server/events');
    setupSocketEvents(io);
    log('Socket events set up successfully');
  } catch (err) {
    error('Error setting up socket events:', err);
    throw err;
  }

  // Start server on a random port and wait until it's listening
  log('Starting HTTP server on random port...');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server start timeout after 5 seconds'));
    }, 5000);
    
    httpServer.listen(0, () => {
      clearTimeout(timeout);
      log(`HTTP server listening on port ${httpServer.address().port}`);
      resolve();
    });
    
    httpServer.on('error', (err) => {
      clearTimeout(timeout);
      error('HTTP server error:', err);
      reject(err);
    });
  });

  // Track this server instance
  activeServers.add(httpServer);
  log('Added server to active servers list');

  // Return server instances and helper functions
  return {
    httpServer,
    io,
    getPort: () => {
      const address = httpServer.address();
      return address && typeof address === 'object' ? address.port : 0;
    },
    closeServer: () => {
      log('Closing server...');
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeServers.delete(httpServer);
          log('Removed server from active servers list');

          // Add timeout for server close
          const timeout = setTimeout(() => {
            error('Server close timeout after 5 seconds, forcing cleanup');
            resolve();
          }, 5000);

          // Properly close io first
          io.close(() => {
            log('Socket.IO server closed');
            
            // Then close httpServer
            httpServer.close((err) => {
              clearTimeout(timeout);
              if (err) {
                error('Error closing HTTP server:', err);
                reject(err);
              } else {
                log('HTTP server closed successfully');
                resolve();
              }
            });
          });
        } catch (err) {
          error('Error in closeServer:', err);
          reject(err);
        }
      });
    },
  };
}

function createSocketClient(port) {
  log(`Creating socket client for port ${port}...`);
  
  // Create client with proper method call
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 5000, // Connection timeout
    autoConnect: false, // Don't connect automatically, we'll do it manually with error handling
  });

  // Set up error handlers
  client.on('connect_error', (err) => {
    error(`Socket connect error to port ${port}:`, err.message);
  });

  client.on('error', (err) => {
    error(`Socket error on port ${port}:`, err.message);
  });

  // Track this client
  activeClients.add(client);
  log('Added client to active clients list');

  return {
    client,
    connectClient: () => {
      log(`Attempting to connect client to port ${port}...`);
      return new Promise((resolve, reject) => {
        // Connect manually
        client.connect();
        log('Called client.connect()');

        // Add timeout to avoid hanging
        const timeout = setTimeout(() => {
          error(`Socket connection timeout after 5 seconds to port ${port}`);
          reject(new Error(`Socket connection timeout to port ${port}`));
        }, 5000);

        client.on('connect', () => {
          clearTimeout(timeout);
          log('Client connected successfully');
          resolve();
        });

        client.on('connect_error', (err) => {
          clearTimeout(timeout);
          error(`Socket connection error: ${err.message}`);
          reject(new Error(`Socket connection error: ${err.message}`));
        });
      });
    },
    disconnectClient: () => {
      log('Disconnecting client...');
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeClients.delete(client);
          log('Removed client from active clients list');

          if (client.connected) {
            // Set timeout to avoid hanging
            const timeout = setTimeout(() => {
              error('Socket disconnect timeout after 2 seconds - forcing cleanup');
              resolve();
            }, 2000);

            client.on('disconnect', () => {
              clearTimeout(timeout);
              log('Client disconnected successfully');
              resolve();
            });

            client.disconnect();
            log('Called client.disconnect()');
          } else {
            log('Client was not connected, skipping disconnect');
            resolve();
          }
        } catch (err) {
          error('Error in disconnectClient:', err);
          reject(err);
        }
      });
    },
  };
}

// Add global cleanup function
async function cleanupAllSocketResources() {
  log('Running global cleanup for socket resources...');
  
  // Close any remaining clients
  for (const client of activeClients) {
    try {
      if (client.connected) {
        log('Disconnecting connected client during cleanup');
        client.disconnect();
      }
    } catch (err) {
      error('Error disconnecting client in cleanup:', err);
    }
    activeClients.delete(client);
  }
  log(`Cleaned up ${activeClients.size} clients`);

  // Close any remaining servers
  const closePromises = [];
  for (const server of activeServers) {
    closePromises.push(
      new Promise((resolve) => {
        try {
          log('Closing server during cleanup');
          server.close(() => resolve());
        } catch (err) {
          error('Error closing server in cleanup:', err);
          resolve();
        }
      }),
    );
    activeServers.delete(server);
  }
  log(`Cleaning up ${closePromises.length} servers`);

  await Promise.allSettled(closePromises);
  log('Global socket cleanup completed');
}

module.exports = {
  createSocketServer,
  createSocketClient,
  CONSTANTS,
  cleanupAllSocketResources, // Export the cleanup function
};
