// server/socketHandlers/screenHandler.js

function handleScreenConnect(io, socket, CONSTANTS, game) {
  try {
    console.log(`Screen connected: ${socket.id}`);

    // Mark this socket as a screen
    socket.isScreen = true; // Maintain this? Or rely solely on gameRole? Let's keep both for clarity for now.
    socket.gameRole = CONSTANTS.GAME_ROLES.SCREEN;

    // Join a special room for screens
    socket.join(CONSTANTS.SOCKET_ROOMS.SCREENS);

    // Send current game state if available
    if (game) {
      const stateData = {
        isGameRunning: game.isGameRunning,
        roundNumber: game.round,
        timeRemaining: game.timeRemaining,
      };

      // If the game is running and a round is active, send more data
      // Send to all screens, including the newly connected one
      if (game.isGameRunning && game.round >= CONSTANTS.FIRST_ROUND_NUMBER) {
        io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
          CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
          stateData
        );
      }
      // Consider also sending game created/manual start status?
      // For now, match existing behavior.
    }
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SCREEN_CONNECT, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_CONNECTING_SCREEN,
    });
  }
}

function registerScreenEventHandlers(io, socket, CONSTANTS, game) {
  socket.on(CONSTANTS.SOCKET.EVENT_SCREEN_CONNECT, () =>
    handleScreenConnect(io, socket, CONSTANTS, game)
  );
}

module.exports = { registerScreenEventHandlers };
