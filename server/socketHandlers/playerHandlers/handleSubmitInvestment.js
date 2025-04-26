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

    // Use the refactored roundManager
    const result = roundManager.submitInvestment(
      playerName,
      investment,
      isAutoSubmit
    );

    if (result.success) {
      console.log(
        `Investment submitted by ${playerName}: ${result.investment}${result.alreadySubmitted ? ' (already submitted)' : ''}${isAutoSubmit ? ' (marked as auto-submitted)' : ''}`
      );

      // Send confirmation to the player
      socket.emit(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, {
        investment: result.investment,
        isAutoSubmit, // Reflect the original flag from the client
        alreadySubmitted: result.alreadySubmitted || false,
      });

      // Notify instructor and screens only for new submissions
      if (!result.alreadySubmitted) {
        console.log('Sending investment_received to instructor room');
        io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
          CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
          {
            playerName: playerName,
            investment: result.investment,
            isAutoSubmit, // Reflect the original flag
          }
        );

        console.log('Sending investment_received to screens room');
        io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
          CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
          {
            playerName: playerName,
            investment: result.investment,
            isAutoSubmit, // Reflect the original flag
          }
        );
      }

      // Check if the round should end based on the game state flag
      // This flag (pendingEndRound) is set within submitInvestment if all connected players submitted
      if (game.pendingEndRound) {
        console.log(
          'Game state indicates all players have submitted - ending round after delay.'
        );
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

          // Timers are already cleared by submitInvestment when pendingEndRound is set
          // Add a delay before actually ending the round for UI feedback
          setTimeout(() => {
            try {
              // Check game state again before ending, in case something changed
              if (game.state === CONSTANTS.GAME_STATES.ACTIVE && game.pendingEndRound) {
                 console.log("Executing delayed endRound call.");
                 roundManager.endRound(io);
              } else {
                 console.log(`Skipping delayed endRound call. Game state: ${game.state}, Pending: ${game.pendingEndRound}`);
              }
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
        // This case might occur if the check happens slightly before pendingEndRound is set,
        // but the logic relies on pendingEndRound now.
        console.log(
          'submitInvestment reported allSubmitted, but pendingEndRound is not yet set. Relying on pendingEndRound flag.'
        );
      }
    } else {
      console.error(
        `${CONSTANTS.DEBUG_MESSAGES.INVESTMENT_SUBMISSION_FAILED} ${playerName}:`,
        result.error
      );
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message:
          result.error || CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_INVESTMENT,
      });
    }
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SUBMIT_INVESTMENT, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_INVESTMENT,
    });
  }
}

module.exports = handleSubmitInvestment; 