const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Restore real console for debugging
beforeAll(() => {
  // Restore console methods
  console.log = jest.fn((...args) => {
    process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
  });
  console.error = jest.fn((...args) => {
    process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
  });
});

// Simplified test that focuses on just HTTP functionality first
describe('Basic Socket.IO Connection', () => {
  let httpServer;
  let io;
  let port;

  beforeAll((done) => {
    // Create HTTP server
    console.log('Creating HTTP server');
    httpServer = http.createServer((req, res) => {
      // Add a simple response handler for HTTP requests
      res.writeHead(200);
      res.end('OK');
    });

    // Start server on random port
    httpServer.listen(() => {
      port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  }, 10000);

  afterAll((done) => {
    console.log('Closing server');
    httpServer.close(() => {
      console.log('Server closed');
      done();
    });
  }, 10000);

  // Test HTTP functionality first
  test('should respond to HTTP requests', (done) => {
    const http = require('http');

    console.log(`Making HTTP request to port ${port}`);
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log(`Got HTTP response: ${res.statusCode}`);
      expect(res.statusCode).toBe(200);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Response body: ${data}`);
        expect(data).toBe('OK');
        done();
      });
    });

    req.on('error', (error) => {
      console.error(`HTTP request error: ${error.message}`);
      done(error);
    });

    req.end();
  }, 5000);

  // Then test Socket.IO in a separate test
  test('should connect with Socket.IO', (done) => {
    // Create Socket.IO server
    console.log('Creating Socket.IO server');
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      // Match the server configuration in server/index.js for test environment
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000,
      transports: ['websocket'] // Explicitly use only websocket transport
    });

    // Set up basic connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      done(); // Mark test as done when connection is established
    });

    // Create client with explicit configuration matching the server
    console.log(`Creating client and connecting to port ${port}`);
    const clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'], // Match server transport
      forceNew: true,
      reconnection: false,
      timeout: 5000 // Add explicit timeout
    });

    // Add error handlers with better logging
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
      // Don't fail the test on first error, allow retry
    });

    clientSocket.on('error', (err) => {
      console.error(`Socket error: ${err.message}`);
    });

    // Add disconnect handler for debugging
    clientSocket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${reason}`);
    });

    // Clean up after test
    setTimeout(() => {
      if (clientSocket) {
        console.log('Disconnecting client');
        clientSocket.disconnect();
      }

      if (io) {
        console.log('Closing Socket.IO server');
        io.close();
      }
    }, 6000); // Clean up after test timeout
  }, 5000);
});