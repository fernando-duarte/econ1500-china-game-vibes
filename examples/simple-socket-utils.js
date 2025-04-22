const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Track active servers and clients for cleanup
const activeServers = new Set();
const activeClients = new Set();

/**
 * Create a simple Socket.IO server
 * @returns {Promise<{httpServer, io, port, close}>} Server objects and close function
 */
async function createServer() {
  return new Promise((resolve, reject) => {
    // Create HTTP server
    const httpServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    // Create Socket.IO server
    const io = new Server(httpServer, {
      cors: { origin: "*" },
      transports: ['websocket'],
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000
    });

    // Track this server for cleanup
    activeServers.add(httpServer);

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Echo event for testing
      socket.on('echo', (data, callback) => {
        if (callback && typeof callback === 'function') {
          callback(data);
        } else {
          socket.emit('echo:response', data);
        }
      });
    });

    // Start server
    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);

      // Return server objects and close function
      resolve({
        httpServer,
        io,
        port,
        close: () => {
          return new Promise((resolveClose) => {
            // Remove from tracking
            activeServers.delete(httpServer);

            // Set timeout to avoid hanging
            const timeout = setTimeout(() => {
              console.error('Server close timeout after 5 seconds');
              resolveClose();
            }, 5000);

            // Close io first, then http server
            io.close(() => {
              console.log('Socket.IO server closed');
              httpServer.close((err) => {
                clearTimeout(timeout);
                if (err) {
                  console.error('Error closing HTTP server:', err);
                }
                console.log('HTTP server closed');
                resolveClose();
              });
            });
          });
        }
      });
    });

    // Handle errors
    httpServer.on('error', (err) => {
      activeServers.delete(httpServer);
      console.error('Server error:', err);
      reject(err);
    });
  });
}

/**
 * Create a Socket.IO client
 * @param {number} port - Server port
 * @returns {object} Client object and connect/disconnect functions
 */
function createClient(port) {
  // Create client
  const socket = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    timeout: 5000
  });

  // Track this client for cleanup
  activeClients.add(socket);

  return {
    socket,
    connect: () => {
      return new Promise((resolve, reject) => {
        // Set timeout
        const timeoutId = setTimeout(() => {
          console.error('Connection timeout after 5 seconds');
          reject(new Error('Connection timeout'));
        }, 5000);

        // Connection handler
        socket.on('connect', () => {
          console.log(`Client connected with ID: ${socket.id}`);
          clearTimeout(timeoutId);
          resolve(socket);
        });

        // Error handler
        socket.on('connect_error', (err) => {
          console.error('Connection error:', err.message);
          clearTimeout(timeoutId);
          reject(err);
        });
      });
    },
    disconnect: () => {
      return new Promise((resolve) => {
        // Remove from tracking
        activeClients.delete(socket);

        if (socket.connected) {
          console.log('Disconnecting client');
          // Set timeout to avoid hanging
          const timeout = setTimeout(() => {
            console.log('Client disconnect timeout after 2 seconds');
            resolve();
          }, 2000);

          socket.on('disconnect', () => {
            clearTimeout(timeout);
            console.log('Client disconnected');
            resolve();
          });

          socket.disconnect();
        } else {
          console.log('Client was not connected');
          resolve();
        }
      });
    }
  };
}

/**
 * Clean up all active socket resources
 * @returns {Promise<void>}
 */
async function cleanupAllResources() {
  console.log('Cleaning up all socket resources...');

  // Clean up clients
  const clientPromises = [];
  for (const client of activeClients) {
    if (client.connected) {
      clientPromises.push(
        new Promise((resolve) => {
          client.disconnect();
          resolve();
        })
      );
    }
    activeClients.delete(client);
  }

  // Clean up servers
  const serverPromises = [];
  for (const server of activeServers) {
    serverPromises.push(
      new Promise((resolve) => {
        server.close(() => resolve());
        activeServers.delete(server);
      })
    );
  }

  // Wait for all cleanup to complete
  await Promise.allSettled([...clientPromises, ...serverPromises]);
  console.log('All socket resources cleaned up');
}

module.exports = {
  createServer,
  createClient,
  cleanupAllResources
};
