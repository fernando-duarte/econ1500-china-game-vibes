const { game } = require('./gameState');
const CONSTANTS = require('../shared/constants');
const {
  calculateOutput,
  calculateNewCapital,
  validateInvestment,
} = require('./model');
const { getPlayerRoom } = require('./gameUtils');

// Forward declare/require functions from other modules that will be created later
// This creates temporary coupling but is necessary for circular dependencies.
// A better approach might involve event emitters or dependency injection.
let gameLifecycle;
// Function tolazy load gameLifecycle to avoid immediate circular dependency issues
function getGameLifecycle() {
  if (!gameLifecycle) {
    gameLifecycle = require('./gameLifecycle');
  }
  return gameLifecycle;
}

/**
 * Start a new round
 */
function startRound(io) {
  // Reset all investments
  Object.values(game.players).forEach((player) => {
    player.investment = null;
  });

  game.currentIo = io; // Store io for potential use in timer callbacks
  game.timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  game.roundEndTime =
    Date.now() +
    CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND;

  // Clear previous timers
  clearRoundTimers();

  try {
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

      if (game.timeRemaining <= 0) {
        console.log('Round timer interval reached zero, ending round.');
        endRound(io); // Call endRound defined in this module
      }
    }, CONSTANTS.MILLISECONDS_PER_SECOND);

    game.roundTimer = setTimeout(
      () => {
        console.log('Round backup timer expired, ending round.');
        endRound(game.currentIo || io); // Use stored or passed io
      },
      CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND + 500
    ); // Add buffer
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

  return { success: true };
}

/**
 * Process a player's investment
 */
function submitInvestment(playerName, investment, isAutoSubmit = false) {
  if (!game.isGameRunning || game.round < CONSTANTS.FIRST_ROUND_NUMBER) {
    return {
      success: false,
      error: CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START,
    };
  }
  if (game.round > CONSTANTS.ROUNDS) {
    return { success: false, error: CONSTANTS.UI_TEXT.STATUS_GAME_OVER };
  }
  if (!game.players[playerName]) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.PLAYER_NOT_FOUND };
  }

  const player = game.players[playerName];
  if (player.investment !== null) {
    return {
      success: true,
      investment: player.investment,
      allSubmitted: false,
      alreadySubmitted: true,
    };
  }

  const validInvestment = validateInvestment(investment, player.output);
  player.investment = validInvestment;
  player.isAutoSubmit = isAutoSubmit;

  const connectedPlayers = Object.values(game.players).filter(
    (p) => p.connected
  ).length;
  const submittedPlayers = Object.values(game.players).filter(
    (p) => p.connected && p.investment !== null
  ).length;
  const allSubmitted =
    submittedPlayers === connectedPlayers && connectedPlayers > 0;

  if (allSubmitted) {
    console.log('All players submitted, preparing to end round early.');
    clearRoundTimers(); // Use centralized timer clearing
    game.pendingEndRound = true;
    game.allSubmittedTime = Date.now();
  }

  return {
    success: true,
    investment: validInvestment,
    allSubmitted: allSubmitted,
  };
}

/**
 * End a round and process all investments
 */
function endRound(io) {
  // Prevent multiple simultaneous calls
  if (game.state !== CONSTANTS.GAME_STATES.ACTIVE) {
    console.log(
      `Attempted to end round ${game.round} while game state is ${game.state}. Aborting.`
    );
    return { success: false, error: 'Round already ended or game not active.' };
  }
  // Mark round as ending immediately
  game.state = CONSTANTS.GAME_STATES.ROUND_ENDING;

  console.log(`Ending round ${game.round}...`);
  game.pendingEndRound = false;
  clearRoundTimers(); // Centralized clearing

  // Auto-submit for non-submitters
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
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (!player.connected) return; // Skip disconnected players in results

    const newCapital = calculateNewCapital(player.capital, player.investment);
    const newOutput = calculateOutput(newCapital);
    player.capital = newCapital;
    player.output = newOutput;

    results.push({
      playerName,
      investment: player.investment,
      newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      isAutoSubmit: player.isAutoSubmit || false,
    });

    if (io) {
      io.to(getPlayerRoom(playerName)).emit(CONSTANTS.SOCKET.EVENT_ROUND_END, {
        newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      });
    }
    player.isAutoSubmit = false; // Reset for next round
  });

  // Send summaries
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

  game.round++;

  // Check game end condition
  if (game.round > CONSTANTS.ROUNDS) {
    console.log('Game is over - final round reached.');
    // Mark state as completed before calling endGame
    game.state = CONSTANTS.GAME_STATES.COMPLETED;
    getGameLifecycle().endGame(io); // Call endGame from gameLifecycle
    return { success: true, gameOver: true };
  }

  // Mark state as active for the next round before starting it
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  console.log(
    `Round ${game.round - 1} completed. Starting round ${game.round}`
  );
  if (io) {
    // Start next round (recursive/cyclical call within module is okay)
    startRound(io);
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.CANNOT_START_NEXT_ROUND);
  }

  return { success: true, gameOver: false };
}

/**
 * Clears the round timer and interval.
 */
function clearRoundTimers() {
  try {
    if (game.roundTimer) {
      clearTimeout(game.roundTimer);
      game.roundTimer = null;
    }
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
  } catch (timerError) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_CLEARING_TIMERS, timerError);
  }
}

module.exports = {
  startRound,
  submitInvestment,
  endRound,
  clearRoundTimers, // Export timer clearing function
};
