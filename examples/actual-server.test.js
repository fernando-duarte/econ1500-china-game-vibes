const { app, server } = require('../../server/index');
const { io: Client } = require('socket.io-client');
const request = require('supertest');

// Test that uses the actual server implementation
describe('Actual Server Tests', () => {
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Start the server on a random port
    process.env.NODE_ENV = 'test';
    process.env.START_SERVER_IN_TEST = 'true';
    
    // Listen on a random port
    server.listen(0, () => {
      port = server.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    // Clean up
    if (clientSocket) {
      clientSocket.disconnect();
    }
    
    server.close(() => {
      done();
    });
  });

  // Test HTTP functionality
  test('should respond to HTTP requests', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  // Test Socket.IO connection
  test('should establish a Socket.IO connection', (done) => {
    // Create client
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true
    });

    // Connection successful
    clientSocket.on('connect', () => {
      console.log('Client connected successfully');
      expect(clientSocket.connected).toBe(true);
      done();
    });

    // Add error handler
    clientSocket.on('connect_error', (err) => {
      console.error(`Connection error: ${err.message}`);
    });
  }, 10000); // Increase timeout for this test
});
