const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Enable Socket.IO debug logs
process.env.DEBUG = 'socket.io:*';

describe('Socket.IO Debug Test', () => {
  let httpServer;
  let io;
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();
    
    // Create Socket.IO server with all debugging options
    io = new Server(httpServer, {
      // Explicitly set transport methods
      transports: ['websocket', 'polling'],
      
      // Enable CORS for all origins
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      
      // Connection timeout
      connectTimeout: 5000,
      
      // Other settings
      pingInterval: 2000,
      pingTimeout: 5000,
      
      // Explicitly set to lowest level for debugging
      logLevel: 0
    });
    
    // Set up connection handler
    io.on('connection', (socket) => {
      console.log(`Server received connection: ${socket.id}`);
      socket.emit('welcome', 'Connected to server!');
    });
    
    // Start server
    httpServer.listen(() => {
      port = httpServer.address().port;
      console.log(`Socket.IO server started on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    
    io.close();
    httpServer.close(() => {
      console.log('Server closed');
      done();
    });
  });

  it('should connect with debug logs enabled', (done) => {
    // Create client with all debug options
    console.log(`Creating client connection to port ${port}`);
    
    clientSocket = Client(`http://localhost:${port}`, {
      // Set explicit transport
      transports: ['websocket', 'polling'],
      
      // Disable reconnection to make test cleaner
      reconnection: false,
      
      // Forced new connection
      forceNew: true,
      
      // Debug flags
      debug: true
    });
    
    // Log all events for debugging
    clientSocket.onAny((event, ...args) => {
      console.log(`Client received event: ${event}`, args);
    });
    
    // Set connect handler
    clientSocket.on('connect', () => {
      console.log('Client connected successfully');
      expect(clientSocket.connected).toBe(true);
      
      // Send a test event
      clientSocket.emit('test', 'Hello from client');
      
      // Wait for welcome message before completing test
      clientSocket.on('welcome', (msg) => {
        console.log(`Received welcome message: ${msg}`);
        expect(msg).toBe('Connected to server!');
        done();
      });
    });
    
    // Log connect errors
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
    });
    
    // Set timeout to fail test if connection takes too long
    setTimeout(() => {
      if (!clientSocket.connected) {
        done(new Error('Connection timed out after 5 seconds'));
      }
    }, 5000);
  });
}); 