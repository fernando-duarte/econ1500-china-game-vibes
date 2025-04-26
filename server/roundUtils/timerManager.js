const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');

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
  clearRoundTimers,
};
