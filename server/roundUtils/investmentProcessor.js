const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const { validateInvestment } = require('../model');
const { clearRoundTimers } = require('./timerManager');

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
    // Allow resubmission but log it
    // console.log(`Player ${playerName} resubmitted investment.`);
    // Keep existing behavior: return success indicating already submitted
    return {
      success: true,
      investment: player.investment,
      allSubmitted: false, // Assuming resubmit doesn't trigger early end
      alreadySubmitted: true,
    };
  }

  const validInvestment = validateInvestment(investment, player.output);
  player.investment = validInvestment;
  player.isAutoSubmit = isAutoSubmit;

  // Check if all *connected* players have submitted
  const connectedPlayers = Object.values(game.players).filter(
    (p) => p.connected
  );
  const submittedConnectedPlayers = connectedPlayers.filter(
    (p) => p.investment !== null
  );

  const allSubmitted =
    submittedConnectedPlayers.length === connectedPlayers.length &&
    connectedPlayers.length > 0;

  if (allSubmitted) {
    console.log(
      'All connected players submitted, preparing to end round early.'
    );
    clearRoundTimers(); // Stop the regular timer
    game.pendingEndRound = true; // Signal that the round should end
    game.allSubmittedTime = Date.now(); // Record time for potential UI delay
  }

  return {
    success: true,
    investment: validInvestment,
    allSubmitted: allSubmitted, // Inform caller if this submission completed the set
    alreadySubmitted: false, // Explicitly false for a new submission
  };
}

module.exports = {
  submitInvestment,
};
