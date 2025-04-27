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
// Import the roundEvents module
const { roundEvents, EVENTS } = require('./roundUtils/roundEvents');

// Set up event listeners to handle round transitions
// This breaks the circular dependency between startRound and endRound
roundEvents.on(EVENTS.ROUND_END, (io) => {
  console.log('Round end event received, calling endRound handler');
  endRound(io);
});

roundEvents.on(EVENTS.ROUND_START, (io) => {
  console.log('Round start event received, calling startRound handler');
  startRound(io);
});

module.exports = {
  startRound, // from roundLifecycle
  submitInvestment, // from investmentProcessor
  endRound, // from roundLifecycle
  clearRoundTimers, // from timerManager
};
