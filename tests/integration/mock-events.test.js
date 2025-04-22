/**
 * Mock-Based Socket.IO Event Test
 *
 * This test uses mocked Socket.IO objects to test event handlers
 * without attempting to establish real connections, which has been
 * problematic in the test environment.
 */
const { createMockSocket, createMockServer, triggerSocketEvent } = require('../utils/socket-mock');

// Import server events module that we want to test
const { setupSocketEvents } = require('../../server/events');
const CONSTANTS = require('../../shared/constants');

describe('Socket.IO Event Handlers', () => {
  let mockIo;
  let mockSocket;
  let connectionHandler;
  
  beforeEach(() => {
    // Create mock objects for each test
    mockIo = createMockServer();
    mockSocket = createMockSocket();
    
    // Set up required socket properties
    mockSocket.playerName = null;
    mockSocket.instructor = false;
    mockSocket.screen = false;
    mockSocket.teamId = null;
    mockSocket.gameRole = null;
    
    // Set up socket handshake info
    mockSocket.handshake = {
      headers: {
        referer: 'http://localhost:3000/'
      }
    };
    
    // Initialize server events
    setupSocketEvents(mockIo);
    
    // Get the connection handler function from the mock
    connectionHandler = mockIo.on.mock.calls.find(
      call => call[0] === 'connection'
    )[1];
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // Test basic connection handling
  test('should handle new socket connections', () => {
    // Call the connection handler with our mock socket
    connectionHandler(mockSocket);
    
    // Verify that all sockets join the 'all' room
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.ALL);
    
    // Verify that a test event is emitted with the correct format
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'test_event', 
      { message: 'Hello from server!' }
    );
  });
  
  // Test instructor connection handling
  test('should handle instructor connection', () => {
    // Set up referer URL for instructor
    mockSocket.handshake.headers.referer = 'http://localhost:3000/instructor';
    
    // Simulate connection
    connectionHandler(mockSocket);
    
    // Verify instructor-specific setup
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR);
    expect(mockSocket.instructor).toBe(true);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.INSTRUCTOR);
    
    // Verify event for game creation notice
    expect(mockSocket.emit).toHaveBeenCalledWith(
      CONSTANTS.SOCKET.EVENT_GAME_CREATED,
      expect.objectContaining({
        manualStartEnabled: expect.any(Boolean)
      })
    );
  });
  
  // Test screen connection handling
  test('should handle screen connection event', () => {
    // Simulate connection
    connectionHandler(mockSocket);
    
    // Simulate screen_connect event
    triggerSocketEvent(mockSocket, CONSTANTS.SOCKET.EVENT_SCREEN_CONNECT, {});
    
    // Verify screen-specific setup
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.SCREENS);
    expect(mockSocket.screen).toBe(true);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.SCREEN);
  });
  
  // Test get_student_list handler
  test('should handle get_student_list event', () => {
    // Set up connection
    connectionHandler(mockSocket);
    
    // Trigger get_student_list event
    triggerSocketEvent(mockSocket, 'get_student_list');
    
    // Verify that we emit student_list in response
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'student_list',
      expect.objectContaining({
        allStudents: expect.any(Array),
        studentsInTeams: expect.any(Array),
        teamInfo: expect.any(Object)
      })
    );
  });
  
  // Test game join
  test('should handle game join', () => {
    // Set up connection
    connectionHandler(mockSocket);
    
    // Setup join data
    const joinData = { playerName: 'TestPlayer' };
    
    // Trigger join event
    triggerSocketEvent(mockSocket, CONSTANTS.SOCKET.EVENT_JOIN_GAME, joinData);
    
    // Verify join-specific behavior 
    expect(mockSocket.join).toHaveBeenCalledWith(CONSTANTS.SOCKET_ROOMS.PLAYERS);
    expect(mockSocket.join).toHaveBeenCalledWith(
      `${CONSTANTS.SOCKET_ROOMS.PLAYER_PREFIX}${joinData.playerName}`
    );
    
    // Verify that player name was stored on socket
    expect(mockSocket.playerName).toBe(joinData.playerName);
    expect(mockSocket.gameRole).toBe(CONSTANTS.GAME_ROLES.PLAYER);
  });
  
  // Test game start permission system
  test('should restrict game start to instructors only', () => {
    // Set up regular connection (not instructor)
    connectionHandler(mockSocket);
    expect(mockSocket.instructor).toBe(false);
    
    // Trigger game start event
    triggerSocketEvent(mockSocket, CONSTANTS.SOCKET.EVENT_START_GAME);
    
    // Verify that an error was sent due to non-instructor trying to start game
    expect(mockSocket.emit).toHaveBeenCalledWith(
      CONSTANTS.SOCKET.EVENT_ERROR,
      expect.objectContaining({
        message: CONSTANTS.ERROR_MESSAGES.NOT_AUTHORIZED
      })
    );
  });
});