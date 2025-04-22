/**
 * Standalone Socket.IO Test
 *
 * This script tests Socket.IO connections outside of the Jest environment.
 * Run with: node standalone-socket-test.js
 *
 * This is part of the recommended approach for testing Socket.IO functionality
 * without the complications of the Jest environment. It allows for testing
 * Socket.IO connections in isolation.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Enable Socket.IO debug logs
process.env.DEBUG = 'socket.io:*';

console.log('Starting standalone Socket.IO test...');

// Create HTTP server
const httpServer = http.createServer();

// Start server on port 3000
httpServer.listen(3000, () => {
  console.log('Server listening on port 3000');

  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket'], // Use only websocket for consistency with tests
    pingTimeout: 2000,
    pingInterval: 2000,
    connectTimeout: 5000
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`Server received connection: ${socket.id}`);

    // Send a welcome message
    socket.emit('welcome', 'Hello from server!');

    // Handle ping event
    socket.on('ping', (callback) => {
      console.log('Server received ping');
      callback('pong');
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected. Reason: ${reason}`);
    });
  });

  // Create client
  console.log('Creating Socket.IO client...');
  const clientSocket = Client('http://localhost:3000', {
    transports: ['websocket'], // Use only websocket for consistency with tests
    forceNew: true,
    reconnection: true,
    timeout: 5000
  });

  // Handle client events
  clientSocket.on('connect', () => {
    console.log(`Client connected with ID: ${clientSocket.id}`);
    console.log('Client transport:', clientSocket.io.engine.transport.name);

    // Send ping to server
    clientSocket.emit('ping', (response) => {
      console.log('Client received response:', response);

      // Disconnect after 2 seconds
      setTimeout(() => {
        console.log('Disconnecting client...');
        clientSocket.disconnect();

        // Close server after 1 second
        setTimeout(() => {
          console.log('Closing server...');
          io.close();
          httpServer.close(() => {
            console.log('Server closed');
            process.exit(0);
          });
        }, 1000);
      }, 2000);
    });
  });

  clientSocket.on('welcome', (data) => {
    console.log('Client received welcome message:', data);
  });

  clientSocket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });

  clientSocket.on('disconnect', (reason) => {
    console.log(`Client disconnected. Reason: ${reason}`);
  });

  // Set a timeout to exit if connection fails
  setTimeout(() => {
    console.error('Test timed out after 10 seconds');
    console.error('This may indicate Socket.IO connection issues');
    process.exit(1);
  }, 10000);
});
