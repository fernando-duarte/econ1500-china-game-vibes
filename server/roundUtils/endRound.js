const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const { calculateOutput, calculateNewCapital } = require('../model');
const { getPlayerRoom } = require('../gameUtils');
const { clearRoundTimers } = require('./timerManager');
// Import round events
const { roundEvents, EVENTS } = require('./roundEvents');

// Lazy load gameLifecycle to handle circular dependency with endGame
let gameLifecycle;
function getGameLifecycle() {
  if (!gameLifecycle) {
    // Adjusted path relative to endRound.js
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
    // Use the lazy-loaded gameLifecycle module
    getGameLifecycle().endGame(io);
    return { success: true, gameOver: true };
  }

  // Prepare for the next round
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  console.log(
    `Round ${game.round - 1} completed. Preparing to start round ${game.round}`
  );
  if (io) {
    // Remove direct import and call to startRound
    // const { startRound } = require('./startRound');
    // startRound(io);

    // Instead, emit an event to start the next round
    roundEvents.emit(EVENTS.ROUND_START, io);
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.CANNOT_START_NEXT_ROUND);
  }

  return { success: true, gameOver: false };
}

module.exports = {
  endRound,
};
