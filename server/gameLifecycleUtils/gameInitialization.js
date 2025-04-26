const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');

/**
 * Create a new game session or reset the existing one.
 */
function createGame() {
  Object.assign(game, {
    isGameRunning: false,
    state: CONSTANTS.GAME_STATES.WAITING,
    round: CONSTANTS.FIRST_ROUND_NUMBER - 1, // Start at round 0 essentially
    players: {}, // Reset players
    roundTimer: null,
    timerInterval: null,
    timeRemaining: 0,
    roundEndTime: null,
    currentIo: null,
    pendingEndRound: false,
    allSubmittedTime: null,
    manualStartEnabled: !CONSTANTS.AUTO_START_ENABLED, // Set initial manual start based on config
  });
  console.log('Game created/reset.', {
    manualStart: game.manualStartEnabled,
    autoStartConfig: CONSTANTS.AUTO_START_ENABLED,
  });
  return true; // Indicate success
}

/**
 * Set manual start mode.
 * @param {boolean} enabled - Whether manual start should be enabled.
 */
function setManualStartMode(enabled) {
  game.manualStartEnabled = enabled;
  console.log(`Manual start mode explicitly set to: ${enabled}`);
  return { success: true, manualStartEnabled: game.manualStartEnabled };
}

module.exports = {
  createGame,
  setManualStartMode,
};
