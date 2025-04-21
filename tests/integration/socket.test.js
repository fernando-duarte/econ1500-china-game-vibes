// @ts-nocheck
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const CONSTANTS = require('../../shared/constants');

// Mock dependencies to minimize external dependencies
jest.mock('../../server/gameLogic', () => ({
  createGame: jest.fn(() => true),
  addPlayer: jest.fn((playerName) => ({
    success: true,
    player: { name: playerName, id: playerName },
  })),
  startGame: jest.fn(() => ({ success: true })),
  pauseGame: jest.fn(),
  endGame: jest.fn(),
  forceEndGame: jest.fn(() => ({ success: true })),
  submitInvestment: jest.fn((playerName, investment) => ({
    success: true,
    player: { name: playerName, investment },
  })),
  playerReconnect: jest.fn((playerName) => ({
    success: true,
    player: { name: playerName },
  })),
  setManualStartMode: jest.fn((enabled) => ({
    success: true,
    manualStartEnabled: enabled,
  })),
  game: {
    players: {},
  },
}));

// Enable real console logs for debugging
beforeAll(() => {
  console.log = function(...args) {
    process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
  };
  console.error = function(...args) {
    process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
  };
});

describe('Socket.IO Events', () => {
  // Only implementing the connection test
  test('Client can connect to server', done => {
    // Create test variables
    let httpServer;
    let ioServer;
    let clientSocket;

    try {
      // First create a basic server
      console.log('TEST: Creating HTTP server');
      httpServer = http.createServer();

      // Add Socket.IO with minimal features
      console.log('TEST: Creating Socket.IO server');
      ioServer = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['polling'],
        connectTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 1000
      });

      // Handle connections
      ioServer.on('connection', socket => {
        console.log(`TEST: Socket connected to server: ${socket.id}`);
        socket.emit('welcome', 'Hello from server');
      });

      // Start server
      httpServer.listen(() => {
        const port = httpServer.address().port;
        console.log(`TEST: Server listening on port ${port}`);

        // Now connect a client
        console.log('TEST: Creating client connection');
        clientSocket = Client(`http://localhost:${port}`, {
          transports: ['polling'],
          reconnection: false,
          timeout: 10000
        });

        // Define connection events
        clientSocket.on('connect', () => {
          console.log('TEST: Client connected successfully!');
          expect(clientSocket.connected).toBe(true);
          
          // Wait for welcome message
          clientSocket.on('welcome', (msg) => {
            console.log(`TEST: Received welcome message: ${msg}`);
            expect(msg).toBe('Hello from server');
            
            // Test passed, clean up
            console.log('TEST: Cleaning up resources');
            clientSocket.disconnect();
            ioServer.close();
            httpServer.close();
            
            console.log('TEST: Complete');
            done();
          });
        });

        // Handle connection error
        clientSocket.on('connect_error', err => {
          console.error(`TEST: Socket connection error: ${err.message}`);
        });
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!clientSocket || !clientSocket.connected) {
          console.error('TEST: Connection timeout after 10 seconds');
          
          // Clean up resources
          if (clientSocket) clientSocket.disconnect();
          if (ioServer) ioServer.close();
          if (httpServer) httpServer.close();
          
          done(new Error('Connection timeout after 10 seconds'));
        }
      }, 10000);
    } catch (error) {
      console.error(`TEST: Unexpected error: ${error.message}`);
      done(error);
    }
  }, 15000); // 15 second timeout
});
