/**
 * Simplified Reliable Socket.IO Test
 *
 * This test demonstrates how to make Socket.IO tests work reliably
 * without mocks inside the Jest environment using the socket-test-utils.
 */
const {
  createServerAndClient,
  waitForEvent,
  cleanupSocketResources
} = require('../utils/socket-test-utils');

describe('Simplified Reliable Socket.IO Test', () => {
  // Resources to clean up
  let resources = {};

  // Clean up after all tests
  afterAll((done) => {
    console.log('Running afterAll cleanup...');
    cleanupSocketResources(resources, done);
  });

  // Test server and client creation and communication
  test('should create server and client and communicate', async () => {
    // Create server and client
    resources = await createServerAndClient();
    const { clientSocket } = resources;

    // Verify client is connected
    expect(clientSocket.connected).toBe(true);
    console.log('Client connected successfully');

    // Wait for welcome message
    const welcomeMessage = await waitForEvent(clientSocket, 'welcome');
    expect(welcomeMessage).toBe('Hello from server');
    console.log('Received welcome message:', welcomeMessage);

    // Test echo functionality
    const testData = { message: 'test', timestamp: Date.now() };
    console.log('Sending echo request:', testData);

    const response = await new Promise((resolve) => {
      clientSocket.emit('echo', testData, (data) => {
        console.log('Received echo response:', data);
        resolve(data);
      });
    });

    expect(response).toEqual(testData);
    console.log('Echo test passed');
  }, 10000); // 10 second timeout
});
