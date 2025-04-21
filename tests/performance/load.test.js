const {
  createSocketServer,
  createSocketClient,
} = require('../integration/socketUtils');
const CONSTANTS = require('../../shared/constants');

describe('Socket Performance', () => {
  let socketServer;
  let clients = [];

  beforeAll(async () => {
    socketServer = await createSocketServer();
  });

  afterAll(async () => {
    // Disconnect all clients
    await Promise.all(clients.map((c) => c.disconnectClient()));

    if (socketServer) {
      await socketServer.closeServer();
    }
  });

  test('Can handle 20 simultaneous connections', async () => {
    const startTime = Date.now();

    // Create 20 clients
    for (let i = 0; i < 20; i++) {
      const socketClient = createSocketClient(socketServer.getPort());
      await socketClient.connectClient();
      clients.push(socketClient);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(clients.length).toBe(20);
    expect(duration).toBeLessThan(10000); // Should connect 20 clients in under 10 seconds
  }, 10000);

  test('Can broadcast to all clients efficiently', async () => {
    // Skip if no clients connected
    if (clients.length === 0) {
      return;
    }

    // Setup promise to wait for all clients to receive message
    const receivePromises = clients.map((client) => {
      return new Promise((resolve) => {
        client.client.on('broadcastTest', (data) => {
          resolve(data);
        });
      });
    });

    // Broadcast message to all clients
    const startTime = Date.now();
    socketServer.io.emit('broadcastTest', { message: 'Test broadcast' });

    // Wait for all clients to receive the message
    const results = await Promise.all(receivePromises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all clients received the message
    expect(results.length).toBe(clients.length);
    expect(results.every((r) => r.message === 'Test broadcast')).toBe(true);

    // Performance expectations
    expect(duration).toBeLessThan(1000); // Broadcast should complete in under 1 second
  }, 10000);

  test('Can handle multiple simultaneous investment submissions', async () => {
    // Skip if no clients connected
    if (clients.length < 10) {
      return;
    }

    // Setup promise to wait for client responses
    const responsePromises = clients.slice(0, 10).map((client) => {
      return new Promise((resolve) => {
        client.client.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
          resolve(data);
        });
      });
    });

    // Submit investment from multiple clients simultaneously
    const startTime = Date.now();

    await Promise.all(
      clients.slice(0, 10).map((client, index) => {
        return new Promise((resolve) => {
          client.client.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, {
            playerName: `player${index}`,
            gameId: 'game123',
            investment: 50 + index,
          });
          resolve();
        });
      }),
    );

    // Wait for all responses
    const results = await Promise.all(responsePromises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all submissions were received (responses may not match exactly due to mocking)
    expect(results.length).toBe(10);

    // Performance expectations
    expect(duration).toBeLessThan(2000); // 10 submissions should process in under 2 seconds
  }, 10000);
});
