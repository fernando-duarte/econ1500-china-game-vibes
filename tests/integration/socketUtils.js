const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Track active clients and servers for cleanup
const activeClients = new Set();
const activeServers = new Set();

async function createSocketServer() {
  // Create an HTTP server
  const httpServer = createServer();
  
  // Create Socket.IO server
  const io = new Server(httpServer);
  
  // Set up Socket.IO event handlers
  const { setupSocketEvents } = require('../../server/events');
  setupSocketEvents(io);
  
  // Start server on a random port and wait until it's listening
  await new Promise(resolve => {
    httpServer.listen(0, () => {
      resolve();
    });
  });
  
  // Track this server instance
  activeServers.add(httpServer);
  
  // Return server instances and helper functions
  return {
    httpServer,
    io,
    getPort: () => {
      const address = httpServer.address();
      return typeof address === 'string' ? 0 : address.port;
    },
    closeServer: () => {
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeServers.delete(httpServer);
          
          // Properly close io first
          io.close(() => {
            // Then close httpServer
            httpServer.close((err) => {
              if (err) {
                console.error('Error closing HTTP server:', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } catch (err) {
          console.error('Error in closeServer:', err);
          reject(err);
        }
      });
    }
  };
}

function createSocketClient(port) {
  // Create client with proper method call
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 5000,  // Connection timeout
    autoConnect: false // Don't connect automatically, we'll do it manually with error handling
  });
  
  // Set up error handlers
  client.on('connect_error', (err) => {
    console.error(`Socket connect error to port ${port}:`, err.message);
  });
  
  client.on('error', (err) => {
    console.error(`Socket error on port ${port}:`, err.message);
  });
  
  // Track this client
  activeClients.add(client);
  
  return {
    client,
    connectClient: () => {
      return new Promise((resolve, reject) => {
        // Connect manually
        client.connect();
        
        // Add timeout to avoid hanging
        const timeout = setTimeout(() => {
          reject(new Error(`Socket connection timeout to port ${port}`));
        }, 5000);
        
        client.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        client.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`Socket connection error: ${err.message}`));
        });
      });
    },
    disconnectClient: () => {
      return new Promise((resolve, reject) => {
        try {
          // Remove from tracking
          activeClients.delete(client);
          
          if (client.connected) {
            // Set timeout to avoid hanging
            const timeout = setTimeout(() => {
              console.warn('Socket disconnect timeout - forcing cleanup');
              resolve();
            }, 2000);
            
            client.on('disconnect', () => {
              clearTimeout(timeout);
              resolve();
            });
            
            client.disconnect();
          } else {
            resolve();
          }
        } catch (err) {
          console.error('Error in disconnectClient:', err);
          reject(err);
        }
      });
    }
  };
}

// Add global cleanup function
async function cleanupAllSocketResources() {
  // Close any remaining clients
  for (const client of activeClients) {
    try {
      if (client.connected) {
        client.disconnect();
      }
    } catch (err) {
      console.error('Error disconnecting client in cleanup:', err);
    }
    activeClients.delete(client);
  }
  
  // Close any remaining servers
  const closePromises = [];
  for (const server of activeServers) {
    closePromises.push(
      new Promise(resolve => {
        try {
          server.close(() => resolve());
        } catch (err) {
          console.error('Error closing server in cleanup:', err);
          resolve();
        }
      })
    );
    activeServers.delete(server);
  }
  
  await Promise.allSettled(closePromises);
}

module.exports = {
  createSocketServer,
  createSocketClient,
  CONSTANTS,
  cleanupAllSocketResources  // Export the cleanup function
}; 