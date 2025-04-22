const { createServer, createClient, cleanupAllResources } = require('./simple-socket-utils');

// Test that uses the simplified socket utils
describe('Simple Socket Tests', () => {
  let server;
  let client;

  // Clean up after each test
  afterEach(async () => {
    console.log('Running afterEach cleanup...');

    // Clean up client
    if (client) {
      await client.disconnect();
      client = null;
    }

    // Clean up server
    if (server) {
      await server.close();
      server = null;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    console.log('Running afterAll cleanup...');
    await cleanupAllResources();
  });

  // Test HTTP and Socket.IO functionality
  test('should create a socket server and client', async () => {
    console.log('Starting socket server and client test');

    // Create server
    server = await createServer();
    expect(server).toBeDefined();
    expect(server.httpServer).toBeDefined();
    expect(server.io).toBeDefined();
    expect(server.port).toBeGreaterThan(0);
    console.log(`Server created on port ${server.port}`);

    // Create client
    client = createClient(server.port);
    expect(client).toBeDefined();
    expect(client.socket).toBeDefined();
    console.log('Client created');

    // Connect client
    const socket = await client.connect();
    expect(socket.connected).toBe(true);
    console.log('Client connected successfully');

    // Test echo functionality
    const testData = { message: 'test' };
    console.log('Testing echo functionality with data:', testData);

    const response = await new Promise((resolve) => {
      socket.emit('echo', testData, (data) => {
        console.log('Received echo response:', data);
        resolve(data);
      });
    });

    expect(response).toEqual(testData);
    console.log('Echo test passed');
  }, 15000); // Increase timeout for this test
});
