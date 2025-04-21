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

describe('Basic Socket.IO Connection', () => {
  let httpServer;
  let io;
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Create HTTP server
    console.log('Creating HTTP server');
    httpServer = http.createServer();
    
    // Create Socket.IO server
    console.log('Creating Socket.IO server');
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 2000,
      pingInterval: 2000,
      connectTimeout: 5000
    });
    
    // Set up basic connection handler
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Echo event for testing
      socket.on('echo', (data) => {
        console.log(`Received echo request: ${JSON.stringify(data)}`);
        socket.emit('echo:response', data);
      });
    });
    
    // Start server on random port
    httpServer.listen(() => {
      port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  }, 10000);
  
  afterAll((done) => {
    // Cleanup
    if (clientSocket) {
      console.log('Disconnecting client');
      clientSocket.disconnect();
    }
    
    console.log('Closing server');
    io.close();
    httpServer.close(() => {
      console.log('Server closed');
      done();
    });
  }, 10000);
  
  test('should connect to server', (done) => {
    console.log(`Creating client and connecting to port ${port}`);
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });
    
    clientSocket.on('connect', () => {
      console.log('Client connected successfully');
      expect(clientSocket.connected).toBe(true);
      done();
    });
    
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
    });
  }, 5000);
  
  test('should receive echo response', (done) => {
    const testData = { message: 'hello world' };
    console.log(`Sending echo message: ${JSON.stringify(testData)}`);
    
    // Set up response handler
    clientSocket.on('echo:response', (response) => {
      console.log(`Received echo response: ${JSON.stringify(response)}`);
      expect(response).toEqual(testData);
      done();
    });
    
    // Send echo request
    clientSocket.emit('echo', testData);
  }, 5000);
}); 