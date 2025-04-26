// const { game } = require('../gameState'); // Now passed in via register function

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

function handleSubmitInvestment(
  io,
  socket,
  roundManager,
  CONSTANTS,
  game,
  data
) {
  try {
    const { investment, isAutoSubmit } = data;
    const playerName = socket.playerName; // Use player name from socket

    console.log(
      `Received investment submission from socket ${socket.id} (role: ${socket.gameRole || 'unknown'}, player: ${playerName})`
    );

    if (!playerName) {
      console.error(
        `${CONSTANTS.DEBUG_MESSAGES.NO_PLAYER_NAME} ${socket.id}. Socket may not be registered as a player.`
      );
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message: CONSTANTS.ERROR_MESSAGES.NOT_IN_GAME,
      });
      return;
    }

    console.log(`Processing investment from ${playerName}: ${investment}`);

    const result = roundManager.submitInvestment(
      playerName,
      investment,
      isAutoSubmit
    );

    if (result.success) {
      console.log(
        `Investment submitted by ${playerName}: ${result.investment}${isAutoSubmit ? ' (auto-submitted)' : ''}`
      );

      socket.emit(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, {
        investment: result.investment,
        isAutoSubmit,
      });

      console.log('Sending investment_received to instructor room');
      io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
        CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
        {
          playerName: playerName,
          investment: result.investment,
          isAutoSubmit,
        }
      );

      console.log('Sending investment_received to screens room');
      io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
        CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
        {
          playerName: playerName,
          investment: result.investment,
          isAutoSubmit,
        }
      );

      // Check if the round should end (using passed game state)
      if (game.pendingEndRound) {
        console.log('All players have submitted - ending round immediately');
        // Prepare notification message
        const notificationData = {
          message: CONSTANTS.UI_TEXT.ALL_SUBMITTED_NOTIFICATION,
          timeRemaining: CONSTANTS.ALL_SUBMITTED_NOTIFICATION_SECONDS,
        };

        try {
          // Send notification to all students, instructors, and screens
          io.to(CONSTANTS.SOCKET_ROOMS.PLAYERS).emit(
            CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
            notificationData
          );
          io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
            CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
            notificationData
          );
          io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
            CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
            notificationData
          );

          // Clear timers safely (using passed game state)
          if (game.roundTimer) clearTimeout(game.roundTimer);
          if (game.timerInterval) clearInterval(game.timerInterval);
          game.roundTimer = null;
          game.timerInterval = null;

          // Add a slight delay before ending the round
          setTimeout(() => {
            try {
              roundManager.endRound(io);
            } catch (endRoundError) {
              console.error(
                CONSTANTS.DEBUG_MESSAGES.ERROR_ENDING_ROUND,
                endRoundError
              );
            }
          }, CONSTANTS.ALL_SUBMITTED_UI_DELAY_MS);
        } catch (notificationError) {
          console.error(
            CONSTANTS.DEBUG_MESSAGES.ERROR_SENDING_NOTIFICATIONS,
            notificationError
          );
        }
      } else if (result.allSubmitted) {
        // Should not happen if pendingEndRound is managed correctly, but log just in case
        console.log(
          'This submission completed all required inputs - round end triggered by pendingEndRound flag.'
        );
      }
    } else {
      console.error(
        `${CONSTANTS.DEBUG_MESSAGES.INVESTMENT_SUBMISSION_FAILED} ${playerName}:`,
        result.error
      );
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message:
          result.error || CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_INVESTMENT, // Use specific error if available
      });
    }
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SUBMIT_INVESTMENT, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_INVESTMENT,
    });
  }
}

function registerPlayerEventHandlers(
  io,
  socket,
  playerManager,
  roundManager,
  getPlayerRoom,
  CONSTANTS,
  game
) {
  socket.on(CONSTANTS.SOCKET.EVENT_RECONNECT_GAME, (data) =>
    handleReconnectGame(
      io,
      socket,
      playerManager,
      getPlayerRoom,
      CONSTANTS,
      game,
      data
    )
  );

  socket.on(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, (data) =>
    handleSubmitInvestment(io, socket, roundManager, CONSTANTS, game, data)
  );
}

module.exports = { registerPlayerEventHandlers };
