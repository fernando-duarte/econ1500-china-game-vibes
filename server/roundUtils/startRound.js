const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const { getPlayerRoom } = require('../gameUtils');
const { clearRoundTimers } = require('./timerManager');
const { endRound } = require('./endRound'); // Import endRound for timer callbacks

/**
 * Start a new round
 */
function startRound(io) {
  // Reset all investments for connected players
  Object.values(game.players).forEach((player) => {
    if (player.connected) {
      player.investment = null;
      player.isAutoSubmit = false; // Ensure this is reset
    }
  });

  game.currentIo = io; // Store io for potential use in timer callbacks
  game.timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  game.roundEndTime =
    Date.now() +
    CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND;
  game.pendingEndRound = false; // Ensure this is reset at round start
  game.allSubmittedTime = null;

  // Clear previous timers before starting new ones
  clearRoundTimers();

  try {
    // Interval timer for broadcasting remaining time
    game.timerInterval = setInterval(() => {
      game.timeRemaining = Math.max(
        0,
        Math.ceil(
          (game.roundEndTime - Date.now()) / CONSTANTS.MILLISECONDS_PER_SECOND
        )
      );

      if (io) {
        io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
          CONSTANTS.SOCKET.EVENT_TIMER_UPDATE,
          { timeRemaining: game.timeRemaining }
        );
      }

      // Safety check within interval to end round if time runs out
      if (game.timeRemaining <= 0 && !game.pendingEndRound) {
        console.log('Round timer interval reached zero, ending round.');
        endRound(io); // Use imported endRound
      }
    }, CONSTANTS.MILLISECONDS_PER_SECOND);

    // Backup timer to ensure round ends even if interval fails
    game.roundTimer = setTimeout(
      () => {
        // Only end round via backup if it hasn't already started ending
        if (game.state === CONSTANTS.GAME_STATES.ACTIVE) {
          console.log('Round backup timer expired, ending round.');
          endRound(game.currentIo || io); // Use imported endRound
        }
      },
      CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND + 500 // Add buffer
    );
  } catch (timerSetupError) {
    console.error(
      CONSTANTS.DEBUG_MESSAGES.ERROR_SETTING_UP_TIMERS,
      timerSetupError
    );
  }

  // Emit round start to players
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected && io) {
      io.to(getPlayerRoom(playerName)).emit(
        CONSTANTS.SOCKET.EVENT_ROUND_START,
        {
          roundNumber: game.round,
          capital: parseFloat(
            player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)
          ),
          output: parseFloat(
            player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)
          ),
          timeRemaining: game.timeRemaining,
        }
      );
    }
  });

  // Notify instructor
  if (io) {
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_ROUND_START,
      {
        roundNumber: game.round,
        timeRemaining: game.timeRemaining,
      }
    );
  }

  console.log(`Round ${game.round} started.`);
  return { success: true };
}

module.exports = {
  startRound,
};
