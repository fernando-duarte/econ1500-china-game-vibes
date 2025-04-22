const { createSocketServer, createSocketClient, cleanupAllSocketResources } = require('./socketUtils');

// Test that uses the socketUtils.js file
describe('Socket Utils Tests', () => {
  let server;
  let client;

  // Clean up after all tests
  afterAll(async () => {
    console.log('Running afterAll cleanup...');

    // Clean up client and server if they exist
    if (client) {
      await client.disconnectClient().catch(err => {
        console.error('Error disconnecting client:', err);
      });
    }

    if (server) {
      await server.closeServer().catch(err => {
        console.error('Error closing server:', err);
      });
    }

    // Run global cleanup to catch any missed resources
    await cleanupAllSocketResources();
  });

  // Test HTTP functionality
  test('should create a socket server and client', async () => {
    // Create server
    server = await createSocketServer();
    expect(server).toBeDefined();
    expect(server.httpServer).toBeDefined();
    expect(server.io).toBeDefined();
    expect(server.getPort()).toBeGreaterThan(0);
    console.log(`Server created on port ${server.getPort()}`);

    // Create client
    const port = server.getPort();
    client = createSocketClient(port);
    expect(client).toBeDefined();
    expect(client.client).toBeDefined();
    console.log('Client created');

    // Connect client
    await client.connectClient();
    expect(client.client.connected).toBe(true);
    console.log('Client connected successfully');

    // Test is complete, but we'll let the afterAll handle cleanup
  }, 15000); // Increase timeout for this test
});
