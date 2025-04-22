/**
 * Server Events Test
 * 
 * This test demonstrates how to test server event handlers using mocked Socket.IO objects.
 */
const { createMockSocket, createMockServer, triggerSocketEvent } = require('../utils/socket-mock');
const CONSTANTS = require('../../shared/constants');

// Mock dependencies
jest.mock('../../server/gameLogic', () => ({
  createGame: jest.fn(() => true),
  addPlayer: jest.fn((playerName) => ({
    success: true,
    initialCapital: 100,
    initialOutput: 10,
    player: { name: playerName, id: playerName },
  })),
  startGame: jest.fn(() => ({ success: true })),
  game: {
    players: {},
    manualStartEnabled: true,
    isGameRunning: false,
    round: 0
  },
  setManualStartMode: jest.fn((enabled) => ({
    success: true,
    manualStartEnabled: enabled,
  })),
}));

jest.mock('../../server/teamManager', () => ({
  loadStudentList: jest.fn(() => []),
  clearTeams: jest.fn(),
}));

describe('Server Events', () => {
  let mockIo;
  let mockSocket;
  let setupSocketEvents;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset modules to get fresh instances
    jest.resetModules();
    
    // Import the module under test
    setupSocketEvents = require('../../server/events').setupSocketEvents;
    
    // Create mock Socket.IO server
    mockIo = createMockServer();
    
    // Create mock socket
    mockSocket = createMockSocket();
    
    // Mock socket properties
    mockSocket.playerName = null;
    mockSocket.instructor = false;
    mockSocket.screen = false;
    mockSocket.gameRole = null;
    
    // Mock io.to().emit() pattern
    mockIo.to = jest.fn().mockReturnValue({
      emit: jest.fn()
    });
    
    // Mock io.emit
    mockIo.emit = jest.fn();
  });
  
  test('should set up socket events', () => {
    // Call the function that sets up socket events
    setupSocketEvents(mockIo);
    
    // Verify that the connection event handler was registered
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    
    // Verify that game was created
    const gameLogic = require('../../server/gameLogic');
    expect(gameLogic.createGame).toHaveBeenCalled();
    
    // Verify that manual start mode was enabled
    expect(gameLogic.setManualStartMode).toHaveBeenCalledWith(true);
    
    // Verify that student list was loaded
    const teamManager = require('../../server/teamManager');
    expect(teamManager.loadStudentList).toHaveBeenCalled();
    
    // Verify that teams were cleared
    expect(teamManager.clearTeams).toHaveBeenCalled();
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
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.ALL);
    
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
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR);
    
    // Verify that the socket was marked as an instructor
    expect(mockSocket.instructor).toBe(true);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.INSTRUCTOR);
    
    // Verify that game created event was emitted
    expect(mockSocket.emit).toHaveBeenCalledWith(
      CONSTANTS.SOCKET.EVENT_GAME_CREATED,
      expect.objectContaining({ manualStartEnabled: true })
    );
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
    triggerSocketEvent(mockSocket, CONSTANTS.SOCKET.EVENT_SCREEN_CONNECT, {});
    
    // Verify that the socket joined the screens room
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.SCREENS);
    
    // Verify that the socket was marked as a screen
    expect(mockSocket.screen).toBe(true);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.SCREEN);
  });
  
  test('should handle player join game', () => {
    // Set up socket events
    setupSocketEvents(mockIo);
    
    // Get the connection handler
    const connectionHandler = mockIo.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
    
    // Call the connection handler with our mock socket
    connectionHandler(mockSocket);
    
    // Simulate join_game event
    const playerName = 'TestPlayer';
    triggerSocketEvent(mockSocket, CONSTANTS.SOCKET.EVENT_JOIN_GAME, { playerName });
    
    // Verify that the socket joined the players room
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.PLAYERS);
    
    // Verify that the socket joined the player-specific room
    expect(mockSocket.join).toHaveBeenCalledWith(`player:${playerName}`);
    
    // Verify that the player name was stored on the socket
    expect(mockSocket.playerName).toBe(playerName);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.PLAYER);
    
    // Verify that addPlayer was called
    const gameLogic = require('../../server/gameLogic');
    expect(gameLogic.addPlayer).toHaveBeenCalledWith(playerName, mockSocket.id, mockIo);
  });
});
