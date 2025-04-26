function handleReconnectGame(
  io,
  socket,
  playerManager,
  getPlayerRoom,
  CONSTANTS,
  game,
  data
) {
  try {
    const { playerName: name } = data;
    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, {
        success: false,
        error: CONSTANTS.ERROR_MESSAGES.INVALID_INPUT,
      });
      return;
    }

    const playerName = name.trim();
    socket.playerName = playerName; // Set socket playerName

    // Try to reconnect the player
    const result = playerManager.playerReconnect(playerName, socket.id);

    if (result.success) {
      socket.gameRole = CONSTANTS.GAME_ROLES.PLAYER; // Set role on reconnect
      socket.join(CONSTANTS.SOCKET_ROOMS.PLAYERS);
      socket.join(getPlayerRoom(playerName));

      console.log(`Player reconnected: ${playerName}`);

      // Send current game state to the player (using passed game state)
      if (
        result.isGameRunning &&
        result.round >= CONSTANTS.FIRST_ROUND_NUMBER
      ) {
        io.to(getPlayerRoom(playerName)).emit(
          CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
          {
            roundNumber: result.round,
            capital: result.capital,
            output: result.output,
            submitted: result.submitted,
            timeRemaining: game.timeRemaining, // Use passed game state
          }
        );
      }

      // Notify screens about reconnection
      io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
        CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
        {
          playerName,
          isReconnect: true,
        }
      );
    } else {
      // If reconnect failed, clear potentially wrongly set socket properties?
      // Maybe not necessary, playerManager handles the state.
      // socket.playerName = null;
      // socket.gameRole = null;
    }

    // Send acknowledgment to the client regardless of success/failure
    socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, result);
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_RECONNECT_GAME, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.SERVER_ERROR_RECONNECT,
    });
  }
}

module.exports = handleReconnectGame;
