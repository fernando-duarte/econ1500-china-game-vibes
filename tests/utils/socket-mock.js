/**
 * Socket.IO Mock Utility
 *
 * Provides standardized mocking functionality for Socket.IO testing.
 * This utility helps create mock socket objects for unit testing without
 * establishing real connections.
 */

/**
 * Create a mock Socket.IO socket
 * @returns {Object} Mock socket with common methods
 */
function createMockSocket() {
  return {
    id: `mock-socket-${Math.random().toString(36).substring(2, 10)}`,
    emit: jest.fn(),
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    rooms: new Set(['mock-room']),
    connected: true,
    disconnected: false,
    handshake: {
      headers: {
        referer: ''
      }
    }
  };
}

/**
 * Create a mock Socket.IO server
 * @returns {Object} Mock Socket.IO server
 */
function createMockServer() {
  const mockServer = {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    of: jest.fn().mockReturnThis(),
    close: jest.fn(),
    sockets: {
      adapter: {
        rooms: new Map()
      },
      emit: jest.fn()
    }
  };

  // Add a room to the adapter
  mockServer.sockets.adapter.rooms.set('mock-room', new Set(['mock-socket-id']));

  return mockServer;
}

/**
 * Create a mock Socket.IO client
 * @returns {Object} Mock Socket.IO client
 */
function createMockClient() {
  return {
    id: `mock-client-${Math.random().toString(36).substring(2, 10)}`,
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    disconnected: false,
    io: {
      engine: {
        transport: {
          name: 'websocket'
        }
      }
    }
  };
}

/**
 * Simulate a Socket.IO connection event
 * @param {Object} mockSocket - The mock socket to trigger the event on
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
function triggerSocketEvent(mockSocket, event, data) {
  // Find the event handler
  const handlers = mockSocket.on.mock.calls.filter(call => call[0] === event);

  // Call each handler with the data
  handlers.forEach(call => {
    const handler = call[1];
    if (typeof handler === 'function') {
      handler(data);
    }
  });
}

/**
 * Reset all mocks
 */
function resetMocks() {
  jest.clearAllMocks();
}

module.exports = {
  createMockSocket,
  createMockServer,
  createMockClient,
  triggerSocketEvent,
  resetMocks
};
