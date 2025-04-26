// Purpose: Aggregates and exports round management functionality.
// Description: This module serves as the central point for accessing functions
// related to starting rounds, submitting investments, ending rounds, and managing timers,
// delegating the actual implementation to specialized modules within the roundUtils directory.

const { clearRoundTimers } = require('./roundUtils/timerManager');
const { submitInvestment } = require('./roundUtils/investmentProcessor');
const { startRound } = require('./roundUtils/startRound');
const { endRound } = require('./roundUtils/endRound');
// const { game } = require('./gameState'); // Not directly used in exports
// const { initializePlayers } = require('./playerManager'); // Moved to game setup logic
// const { resetTeams } = require('./teamManager'); // Moved to game setup logic

module.exports = {
  startRound, // from roundLifecycle
  submitInvestment, // from investmentProcessor
  endRound, // from roundLifecycle
  clearRoundTimers, // from timerManager
};
