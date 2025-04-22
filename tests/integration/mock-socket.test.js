/**
 * Mock-Based Socket.IO Test
 *
 * This test demonstrates how to use mocked Socket.IO objects
 * instead of real connections for testing business logic.
 */
const { createMockSocket, createMockServer, triggerSocketEvent } = require('../utils/socket-mock');

// Import the module that uses Socket.IO
const { setupSocketEvents } = require('../../server/events');

describe('Mock-Based Socket.IO Test', () => {
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    // Create mock Socket.IO server
    mockIo = createMockServer();

    // Create mock socket
    mockSocket = createMockSocket();

    // Mock socket properties that might be used in the code
    mockSocket.playerName = null;
    mockSocket.instructor = false;
    mockSocket.screen = false;
    mockSocket.gameRole = null;
    mockSocket.handshake = {
      headers: {
        referer: ''
      }
    };

    // Mock io.to().emit() pattern
    mockIo.to = jest.fn().mockReturnValue({
      emit: jest.fn()
    });

    // Mock io.emit
    mockIo.emit = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should set up socket events', () => {
    // Call the function that sets up socket events
    setupSocketEvents(mockIo);

    // Verify that the connection event handler was registered
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('should handle new connections', () => {
    // Set up socket events
    setupSocketEvents(mockIo);

    // Get the connection handler
    const connectionHandler = mockIo.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];

    // Call the connection handler with our mock socket
    connectionHandler(mockSocket);

    // Verify that the socket joined the "all" room
    expect(mockSocket.join).toHaveBeenCalledWith('all');

    // Verify that a test event was emitted
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'test_event',
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  test('should handle instructor connection', () => {
    // Set up socket events
    setupSocketEvents(mockIo);

    // Get the connection handler
    const connectionHandler = mockIo.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];

    // Set up mock socket as coming from instructor page
    mockSocket.handshake = {
      headers: {
        referer: 'http://localhost:3000/instructor'
      }
    };

    // Call the connection handler with our mock socket
    connectionHandler(mockSocket);

    // Verify that the socket joined the instructor room
    expect(mockSocket.join).toHaveBeenCalledWith('instructor');

    // Verify that the socket was marked as an instructor
    expect(mockSocket.instructor).toBe(true);
    expect(mockSocket.gameRole).toBe('instructor');
  });

  test('should handle screen connection', () => {
    // Set up socket events
    setupSocketEvents(mockIo);

    // Get the connection handler
    const connectionHandler = mockIo.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];

    // Call the connection handler with our mock socket
    connectionHandler(mockSocket);

    // Simulate screen_connect event
    triggerSocketEvent(mockSocket, 'screen_connect', {});

    // Verify that the socket joined the screens room
    expect(mockSocket.join).toHaveBeenCalledWith('screens');

    // Verify that the socket was marked as a screen
    expect(mockSocket.screen).toBe(true);
    expect(mockSocket.gameRole).toBe('screen');
  });
});
