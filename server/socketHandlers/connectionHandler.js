// server/socketHandlers/connectionHandler.js
const CONSTANTS = require('../../shared/constants');
const playerManager = require('../playerManager');
// const { game } = require('../gameState'); // Not needed here directly

function handleDisconnect(io, socket) {
  console.log(`Disconnected: ${socket.id}`);

  // Handle role-specific disconnect logic first
  if (socket.gameRole === CONSTANTS.GAME_ROLES.INSTRUCTOR) {
    console.log('Instructor disconnected');
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_INSTRUCTOR_DISCONNECTED
    );
    // No further player disconnect logic needed for instructor
    return;
  }

  if (socket.gameRole === CONSTANTS.GAME_ROLES.SCREEN) {
    console.log('Screen disconnected');
    // No further player disconnect logic needed for screen
    return;
  }

  // Now handle potential player disconnect
  const playerName = socket.playerName; // Get player name stored on the socket

  // Always call playerManager.playerDisconnect to clean up state based on socket ID
  // This function is responsible for finding the player by socket ID (if any) and updating game state.
  playerManager.playerDisconnect(socket.id);

  // If a player name was associated with this socket, broadcast the disconnect
  if (playerName) {
    console.log(
      `Player disconnected: ${playerName} (associated with socket ${socket.id})`
    );
    // Notify instructor and screens about the player disconnection
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
      { playerName: playerName } // Use the name stored on the socket
    );
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
      { playerName: playerName } // Use the name stored on the socket
    );
  } else {
    // This socket was not associated with a playerName (maybe never fully joined/registered)
    console.log(
      `Socket ${socket.id} disconnected, no player name was associated with this socket.`
    );
  }
}

function handleNewConnection(io, socket) {
  console.log(`New connection: ${socket.id}`);

  // Add every client to the "all" room
  socket.join(CONSTANTS.SOCKET_ROOMS.ALL);

  // Send a test event to the client
  socket.emit('test_event', { message: 'Hello from server!' });
  console.log(`Sent test_event to client: ${socket.id}`);

  // Block or filter out any events that might be causing unintended broadcasting
  socket.use((packet, next) => {
    if (
      packet[0] === 'input' ||
      packet[0] === 'keyup' ||
      packet[0] === 'change'
    ) {
      console.log('Blocked input broadcast event:', packet[0]);
      return; // Stop processing this packet
    }
    return next(); // Continue processing
  });

  // Determine connection type based on referer
  const referer = socket.handshake.headers.referer || '';
  console.log(`Connection referer: ${referer}`);
  const isInstructorPage =
    referer && referer.includes(CONSTANTS.ROUTES.INSTRUCTOR);
  console.log(`Is instructor page: ${isInstructorPage}`);

  // Set initial roles/flags on the socket object for later use
  socket.isInstructorPage = isInstructorPage; // Store for logic remaining in events.js
  socket.isScreen = false; // Will be set explicitly by screen connect event
  socket.gameRole = null; // Will be set when role is confirmed (instructor, screen, player)
  socket.playerName = null; // Will be set on join/reconnect/register

  // Add instructor to the instructor room if connecting from instructor page
  if (isInstructorPage) {
    console.log(`Adding instructor socket ${socket.id} to instructor room`);
    socket.join(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR);
    socket.gameRole = CONSTANTS.GAME_ROLES.INSTRUCTOR;
  }

  // Attach the disconnect handler
  socket.on('disconnect', () => {
    try {
      handleDisconnect(io, socket);
    } catch (error) {
      // Use a more specific error message if available
      const errorMessage = error.message || 'Unknown error';
      console.error(
        `${CONSTANTS.DEBUG_MESSAGES.ERROR_IN_DISCONNECT}: ${errorMessage}`,
        error
      );
    }
  });
}

module.exports = { handleNewConnection };
