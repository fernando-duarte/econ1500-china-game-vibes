/**
 * Socket.IO Utilities for Integration Tests
 *
 * Provides utilities for managing Socket.IO resources in integration tests.
 */
const { cleanupResources } = require('../utils/resource-tracker');

// Track active resources for global cleanup
const activeResources = {
  httpServers: new Set(),
  socketServers: new Set(),
  socketClients: new Set(),
  timers: new Set()
};

/**
 * Track an HTTP server for cleanup
 * @param {http.Server} server - HTTP server to track
 * @returns {http.Server} The same server (for chaining)
 */
function trackServer(server) {
  if (server) {
    activeResources.httpServers.add(server);
  }
  return server;
}

/**
 * Track a Socket.IO server for cleanup
 * @param {SocketIO.Server} io - Socket.IO server to track
 * @returns {SocketIO.Server} The same server (for chaining)
 */
function trackSocketServer(io) {
  if (io) {
    activeResources.socketServers.add(io);
  }
  return io;
}

/**
 * Track a Socket.IO client for cleanup
 * @param {SocketIO.Socket} socket - Socket.IO client to track
 * @returns {SocketIO.Socket} The same client (for chaining)
 */
function trackSocketClient(socket) {
  if (socket) {
    activeResources.socketClients.add(socket);
  }
  return socket;
}

/**
 * Track a timer for cleanup
 * @param {number} timerId - Timer ID to track
 * @returns {number} The same timer ID (for chaining)
 */
function trackTimer(timerId) {
  if (timerId) {
    activeResources.timers.add(timerId);
  }
  return timerId;
}

/**
 * Clean up all tracked socket resources
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 */
async function cleanupAllSocketResources() {
  console.log('Running global cleanup for socket resources...');
  
  // Clean up Socket.IO clients
  for (const client of activeResources.socketClients) {
    try {
      if (client && client.connected) {
        console.log(`Disconnecting Socket.IO client: ${client.id}`);
        client.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting Socket.IO client:', err);
    }
  }
  activeResources.socketClients.clear();
  
  // Clean up Socket.IO servers
  for (const io of activeResources.socketServers) {
    try {
      if (io) {
        console.log('Closing Socket.IO server');
        io.close();
      }
    } catch (err) {
      console.error('Error closing Socket.IO server:', err);
    }
  }
  activeResources.socketServers.clear();
  
  // Clean up timers
  for (const timerId of activeResources.timers) {
    try {
      clearTimeout(timerId);
    } catch (err) {
      console.error('Error clearing timeout:', err);
    }
  }
  activeResources.timers.clear();
  
  // Clean up HTTP servers
  const closePromises = [];
  for (const server of activeResources.httpServers) {
    if (server) {
      closePromises.push(
        new Promise((resolve) => {
          try {
            console.log('Closing HTTP server');
            server.close(() => resolve());
          } catch (err) {
            console.error('Error closing HTTP server:', err);
            resolve();
          }
        })
      );
    }
  }
  activeResources.httpServers.clear();
  
  // Wait for all servers to close
  await Promise.allSettled(closePromises);
  
  // Run the resource tracker cleanup as well
  await new Promise(resolve => {
    cleanupResources(resolve);
  });
  
  console.log('Global socket cleanup completed');
}

module.exports = {
  trackServer,
  trackSocketServer,
  trackSocketClient,
  trackTimer,
  cleanupAllSocketResources
};
