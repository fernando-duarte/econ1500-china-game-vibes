/**
 * Resource Tracker Utility
 * 
 * Provides utilities for tracking and cleaning up resources in tests,
 * particularly Socket.IO resources that might cause memory leaks.
 */

// Global registry of active resources
const activeResources = {
  httpServers: [],
  socketServers: [],
  socketClients: [],
  timers: []
};

/**
 * Track an HTTP server
 * @param {http.Server} server - HTTP server to track
 * @returns {http.Server} The same server (for chaining)
 */
function trackHttpServer(server) {
  if (server && !activeResources.httpServers.includes(server)) {
    activeResources.httpServers.push(server);
  }
  return server;
}

/**
 * Track a Socket.IO server
 * @param {SocketIO.Server} io - Socket.IO server to track
 * @returns {SocketIO.Server} The same server (for chaining)
 */
function trackSocketServer(io) {
  if (io && !activeResources.socketServers.includes(io)) {
    activeResources.socketServers.push(io);
  }
  return io;
}

/**
 * Track a Socket.IO client
 * @param {SocketIO.Socket} client - Socket.IO client to track
 * @returns {SocketIO.Socket} The same client (for chaining)
 */
function trackSocketClient(client) {
  if (client && !activeResources.socketClients.includes(client)) {
    activeResources.socketClients.push(client);
  }
  return client;
}

/**
 * Track a timer
 * @param {number} timerId - Timer ID to track
 * @returns {number} The same timer ID (for chaining)
 */
function trackTimer(timerId) {
  if (timerId && !activeResources.timers.includes(timerId)) {
    activeResources.timers.push(timerId);
  }
  return timerId;
}

/**
 * Clean up all tracked resources
 * @param {Function} [callback] - Optional callback to run after cleanup
 */
function cleanupResources(callback) {
  console.log('Cleaning up tracked resources...');
  
  // Clean up Socket.IO clients
  activeResources.socketClients.forEach(client => {
    try {
      if (client && client.connected) {
        console.log(`Disconnecting Socket.IO client: ${client.id}`);
        client.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting Socket.IO client:', err);
    }
  });
  activeResources.socketClients = [];
  
  // Clean up Socket.IO servers
  activeResources.socketServers.forEach(io => {
    try {
      if (io) {
        console.log('Closing Socket.IO server');
        io.close();
      }
    } catch (err) {
      console.error('Error closing Socket.IO server:', err);
    }
  });
  activeResources.socketServers = [];
  
  // Clean up timers
  activeResources.timers.forEach(timerId => {
    try {
      console.log(`Clearing timer: ${timerId}`);
      clearTimeout(timerId);
      clearInterval(timerId);
    } catch (err) {
      console.error('Error clearing timer:', err);
    }
  });
  activeResources.timers = [];
  
  // Clean up HTTP servers
  const remainingServers = [...activeResources.httpServers];
  activeResources.httpServers = [];
  
  if (remainingServers.length === 0) {
    if (callback) callback();
    return;
  }
  
  // Close HTTP servers one by one
  function closeNextServer() {
    if (remainingServers.length === 0) {
      if (callback) callback();
      return;
    }
    
    const server = remainingServers.pop();
    try {
      if (server) {
        console.log('Closing HTTP server');
        server.close(() => closeNextServer());
      } else {
        closeNextServer();
      }
    } catch (err) {
      console.error('Error closing HTTP server:', err);
      closeNextServer();
    }
  }
  
  closeNextServer();
}

/**
 * Add global Jest hooks for resource cleanup
 */
function setupGlobalCleanup() {
  // Add afterEach hook for cleanup
  afterEach(() => {
    return new Promise(resolve => {
      cleanupResources(resolve);
    });
  });
  
  // Add afterAll hook for final cleanup
  afterAll(() => {
    return new Promise(resolve => {
      cleanupResources(resolve);
    });
  });
}

module.exports = {
  trackHttpServer,
  trackSocketServer,
  trackSocketClient,
  trackTimer,
  cleanupResources,
  setupGlobalCleanup,
  activeResources
};
