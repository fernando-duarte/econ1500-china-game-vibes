// @ts-nocheck
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

// We'll use the resource tracker instead of manual tracking

describe('Socket.IO Events', () => {
  // Enable real console logs for debugging
  beforeAll(() => {
    console.log = function(...args) {
      process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
    };
    console.error = function(...args) {
      process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
    };
  });

  // Clean up after all tests
  afterAll((done) => {
    console.log('Running afterAll cleanup...');
    cleanupResources(done);
  });

  // Only implementing the connection test
  test('Client can connect to server', (done) => {
    try {
      // First create a basic server
      console.log('TEST: Creating HTTP server');
      const httpServer = trackHttpServer(http.createServer());

      // Add Socket.IO with standardized configuration
      console.log('TEST: Creating Socket.IO server');
      const ioServer = trackSocketServer(new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'], // Use websocket for faster tests
        connectTimeout: 5000,
        pingTimeout: 2000,
        pingInterval: 2000
      }));

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
        const clientSocket = trackSocketClient(Client(`http://localhost:${port}`, {
          transports: ['websocket'], // Match server transport
          forceNew: true,
          reconnection: true,
          timeout: 5000
        }));

        // Define connection events
        clientSocket.on('connect', () => {
          console.log('TEST: Client connected successfully!');
          expect(clientSocket.connected).toBe(true);

          // Wait for welcome message
          clientSocket.on('welcome', (msg) => {
            console.log(`TEST: Received welcome message: ${msg}`);
            expect(msg).toBe('Hello from server');
            done();
          });
        });

        // Handle connection error
        clientSocket.on('connect_error', err => {
          console.error(`TEST: Socket connection error: ${err.message}`);
          console.error('Error details:', err);
        });
      });

      // Set timeout for connection
      const timeoutId = trackTimer(setTimeout(() => {
        console.error('TEST: Connection timeout after 10 seconds');
        done(new Error('Connection timeout after 10 seconds'));
      }, 10000));
    } catch (error) {
      console.error(`TEST: Unexpected error: ${error.message}`);
      done(error);
    }
  }, 15000); // 15 second timeout
});
