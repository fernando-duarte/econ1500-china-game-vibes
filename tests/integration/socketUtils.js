const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

async function createSocketServer() {
  // Create an HTTP server
  const httpServer = createServer();
  
  // Create Socket.IO server
  const io = new Server(httpServer);
  
  // Set up Socket.IO event handlers
  const { setupSocketEvents } = require('../../server/events');
  setupSocketEvents(io);
  
  // Start server on a random port and wait until it's listening
  await new Promise(resolve => httpServer.listen(0, resolve));
  
  // Return server instances and helper functions
  return {
    httpServer,
    io,
    getPort: () => httpServer.address().port,
    closeServer: () => {
      return new Promise(resolve => {
        httpServer.close(() => {
          resolve();
        });
      });
    }
  };
}

function createSocketClient(port) {
  const client = Client(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
  
  return {
    client,
    connectClient: () => {
      return new Promise(resolve => {
        client.on('connect', () => {
          resolve();
        });
      });
    },
    disconnectClient: () => {
      return new Promise(resolve => {
        if (client.connected) {
          client.on('disconnect', () => {
            resolve();
          });
          client.disconnect();
        } else {
          resolve();
        }
      });
    }
  };
}

module.exports = {
  createSocketServer,
  createSocketClient,
  CONSTANTS
}; 