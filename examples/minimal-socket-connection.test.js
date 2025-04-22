const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Extremely minimal test that focuses only on Socket.IO connection
describe('Minimal Socket.IO Connection', () => {
  let httpServer;
  let io;
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Create HTTP server with a basic request handler
    httpServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    // Start server on random port
    httpServer.listen(() => {
      port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    // Clean up
    if (clientSocket) {
      clientSocket.disconnect();
    }
    
    if (io) {
      io.close();
    }
    
    httpServer.close(() => {
      done();
    });
  });

  // Test Socket.IO connection
  test('should establish a Socket.IO connection', (done) => {
    // Create Socket.IO server
    io = new Server(httpServer, {
      cors: { origin: "*" },
      transports: ['websocket']
    });

    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      done(); // Mark test as done when connection is established
    });

    // Create client
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true
    });

    // Add error handler
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
    });
  }, 10000); // Increase timeout for this test
});
