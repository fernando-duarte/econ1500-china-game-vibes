const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Enable real console logs
console.log = function(...args) {
  process.stdout.write(args.map(a => String(a)).join(' ') + '\n');
};
console.error = function(...args) {
  process.stderr.write(args.map(a => String(a)).join(' ') + '\n');
};

// Test configuration
const TEST_TIMEOUT = 15000; // 15 seconds

describe('Socket.IO With Logs', () => {
  let httpServer;
  let io;
  let clientSocket;

  beforeAll((done) => {
    console.log('SETUP: Creating HTTP server');
    httpServer = http.createServer((req, res) => {
      console.log(`SETUP: HTTP request received: ${req.method} ${req.url}`);
      res.writeHead(200);
      res.end('OK');
    });
    
    console.log('SETUP: Adding Socket.IO server');
    io = new Server(httpServer, {
      // Critical settings for test environments:
      cors: { origin: '*' },
      transports: ['polling'], // Force polling only for debugging
      connectTimeout: 10000,
      pingTimeout: 10000,
      pingInterval: 1000
    });
    
    console.log('SETUP: Setting up connection handler');
    io.on('connection', (socket) => {
      console.log(`SETUP: Socket connected: ${socket.id}`);
      
      socket.on('echo', (data, callback) => {
        console.log(`SOCKET: Received echo event with data: ${JSON.stringify(data)}`);
        if (typeof callback === 'function') {
          console.log('SOCKET: Calling echo callback');
          callback({ echo: data });
        } else {
          console.log('SOCKET: No callback provided, emitting response');
          socket.emit('echo:response', { echo: data });
        }
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`SOCKET: Client ${socket.id} disconnected: ${reason}`);
      });
    });
    
    console.log('SETUP: Starting HTTP server on random port');
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`SETUP: Server listening on port ${port}`);
      done();
    });
  }, TEST_TIMEOUT);
  
  afterAll((done) => {
    console.log('CLEANUP: Starting cleanup');
    if (clientSocket) {
      if (clientSocket.connected) {
        console.log('CLEANUP: Disconnecting client socket');
        clientSocket.disconnect();
      } else {
        console.log('CLEANUP: Client socket not connected');
      }
    } else {
      console.log('CLEANUP: No client socket to clean up');
    }
    
    console.log('CLEANUP: Closing Socket.IO server');
    io.close(() => {
      console.log('CLEANUP: Socket.IO server closed');
      
      console.log('CLEANUP: Closing HTTP server');
      httpServer.close(() => {
        console.log('CLEANUP: HTTP server closed');
        done();
      });
    });
  }, TEST_TIMEOUT);
  
  // First verify HTTP works
  test('HTTP server should respond to requests', (done) => {
    const port = httpServer.address().port;
    console.log(`HTTP TEST: Making request to port ${port}`);
    
    http.get(`http://localhost:${port}`, (res) => {
      console.log(`HTTP TEST: Got response: ${res.statusCode}`);
      expect(res.statusCode).toBe(200);
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`HTTP TEST: Got data: ${data}`);
        expect(data).toBe('OK');
        done();
      });
    }).on('error', (err) => {
      console.error(`HTTP TEST: Error: ${err.message}`);
      done(err);
    });
  }, TEST_TIMEOUT);
  
  // Then try Socket.IO connection
  test('should establish Socket.IO connection', (done) => {
    const port = httpServer.address().port;
    console.log(`SOCKET TEST: Creating client connection to port ${port}`);
    
    // Create client
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['polling'], // Force polling for more reliable testing
      reconnection: false,
      timeout: 10000
    });
    
    console.log('SOCKET TEST: Set up connection listeners');
    
    clientSocket.on('connect', () => {
      console.log('SOCKET TEST: Client connected successfully');
      expect(clientSocket.connected).toBe(true);
      
      // Test echo
      console.log('SOCKET TEST: Sending echo message');
      clientSocket.emit('echo', { test: 'hello' }, (response) => {
        console.log(`SOCKET TEST: Got echo response: ${JSON.stringify(response)}`);
        expect(response).toEqual({ echo: { test: 'hello' } });
        done();
      });
    });
    
    clientSocket.on('connect_error', (err) => {
      console.error(`SOCKET TEST: Connection error: ${err.message}`);
      // Don't fail yet to allow retries
    });
    
    // Set timeout to fail if connection doesn't happen
    setTimeout(() => {
      if (!clientSocket.connected) {
        const err = new Error('Socket.IO connection timeout after 10 seconds');
        console.error(`SOCKET TEST: ${err.message}`);
        done(err);
      }
    }, 10000);
  }, TEST_TIMEOUT);
}); 