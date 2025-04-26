const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const { calculateOutput, calculateNewCapital } = require('../model');
const { getPlayerRoom } = require('../gameUtils');
const { clearRoundTimers } = require('./timerManager');

// Lazy load gameLifecycle to handle circular dependency
let gameLifecycle;
function getGameLifecycle() {
  if (!gameLifecycle) {
    gameLifecycle = require('../gameLifecycle');
  }
  return gameLifecycle;
}

/**
 * End a round and process all investments
 */
function endRound(io) {
  // Prevent multiple simultaneous calls or ending an already ended/inactive game
  if (game.state !== CONSTANTS.GAME_STATES.ACTIVE) {
    console.log(
      `Attempted to end round ${game.round} while game state is ${game.state}. Aborting.`
    );
    return { success: false, error: 'Round already ended or game not active.' };
  }
  // Mark round as ending immediately to prevent race conditions
  game.state = CONSTANTS.GAME_STATES.ROUND_ENDING;
  console.log(`Ending round ${game.round}...`);

  // Clear timers *after* confirming the round should end
  clearRoundTimers();
  game.pendingEndRound = false; // Reset flag

  // Auto-submit for connected players who haven't submitted
  Object.values(game.players).forEach((player) => {
    if (player.connected && player.investment === null) {
      console.log(
        `Auto-submitting investment ${CONSTANTS.INVESTMENT_MIN} for player ${player.name}`
      );
      player.investment = CONSTANTS.INVESTMENT_MIN;
      player.isAutoSubmit = true; // Mark as auto-submitted
    }
  });

  const results = [];
  // Process results only for connected players
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (!player.connected) return; // Skip disconnected players

    // Use the submitted investment (or auto-submitted default)
    const investmentToProcess = player.investment ?? CONSTANTS.INVESTMENT_MIN;
    const newCapital = calculateNewCapital(player.capital, investmentToProcess);
    const newOutput = calculateOutput(newCapital);

    // Update player state
    player.capital = newCapital;
    player.output = newOutput;

    results.push({
      playerName,
      investment: investmentToProcess,
      newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      isAutoSubmit: player.isAutoSubmit || false, // Reflect if it was auto-submitted
    });

    // Send individual updates
    if (io) {
      io.to(getPlayerRoom(playerName)).emit(CONSTANTS.SOCKET.EVENT_ROUND_END, {
        newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      });
    }
    // Reset investment and auto-submit status for the next round
    player.investment = null;
    player.isAutoSubmit = false;
  });

  // Send summaries to instructor and screens
  if (io) {
    const summaryData = { roundNumber: game.round, results };
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      summaryData
    );
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      summaryData
    );
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.NO_IO_AVAILABLE_END_ROUND);
  }

  // Increment round number *after* processing results for the current round
  game.round++;

  // Check game end condition
  if (game.round > CONSTANTS.ROUNDS) {
    console.log('Game is over - final round reached.');
    // Update state *before* calling endGame
    game.state = CONSTANTS.GAME_STATES.COMPLETED;
    getGameLifecycle().endGame(io); // Call endGame from gameLifecycle
    return { success: true, gameOver: true };
  }

  // Prepare for the next round
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  console.log(
    `Round ${game.round - 1} completed. Preparing to start round ${game.round}`
  );
  if (io) {
    // Start the next round automatically
    startRound(io);
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.CANNOT_START_NEXT_ROUND);
  }

  return { success: true, gameOver: false };
}

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
        endRound(io); // Call endRound defined above
      }
    }, CONSTANTS.MILLISECONDS_PER_SECOND);

    // Backup timer to ensure round ends even if interval fails
    game.roundTimer = setTimeout(
      () => {
        // Only end round via backup if it hasn't already started ending
        if (game.state === CONSTANTS.GAME_STATES.ACTIVE) {
          console.log('Round backup timer expired, ending round.');
          endRound(game.currentIo || io); // Call endRound defined above
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
  endRound,
};
