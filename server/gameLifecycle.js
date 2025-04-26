// Purpose: Aggregates and exports game lifecycle management functionality.
// Description: This module serves as the central point for accessing functions
// related to creating, starting, controlling (auto-start, force end),
// and ending games, delegating the actual implementation to specialized modules
// within the gameLifecycleUtils directory.

const {
  createGame,
  setManualStartMode,
} = require('./gameLifecycleUtils/gameInitialization');
const {
  startGame,
  checkAutoStart,
  endGame,
  forceEndGame,
} = require('./gameLifecycleUtils/gameControl');

module.exports = {
  createGame, // from gameInitialization
  setManualStartMode, // from gameInitialization
  startGame, // from gameControl
  checkAutoStart, // from gameControl
  endGame, // from gameControl
  forceEndGame, // from gameControl
};
