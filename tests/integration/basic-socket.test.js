/**
 * Basic Socket.IO Test
 * 
 * This is a simplified test for Socket.IO functionality.
 */
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

// Set a longer timeout for this test
jest.setTimeout(60000);

describe('Basic Socket.IO Test', () => {
  let httpServer;
  let ioServer;
  let clientSocket;
  
  beforeAll((done) => {
    // Create HTTP server
    httpServer = http.createServer();
    
    // Start server on a random port
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`Server listening on port ${port}`);
      
      // Create Socket.IO server
      ioServer = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket']
      });
      
      // Set up connection handler
      ioServer.on('connection', (socket) => {
        console.log(`Server received connection: ${socket.id}`);
        socket.emit('welcome', 'Hello from server');
      });
      
      // Create client
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket']
      });
      
      // Wait for client to connect
      clientSocket.on('connect', () => {
        console.log(`Client connected with ID: ${clientSocket.id}`);
        done();
      });
      
      // Connect client
      clientSocket.connect();
    });
  });
  
  afterAll((done) => {
    // Clean up resources
    if (clientSocket) {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
    }
    
    if (ioServer) {
      ioServer.close();
    }
    
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });
  
  test('should receive welcome message', (done) => {
    // Listen for welcome message
    clientSocket.on('welcome', (message) => {
      console.log('Received welcome message:', message);
      expect(message).toBe('Hello from server');
      done();
    });
  });
});
