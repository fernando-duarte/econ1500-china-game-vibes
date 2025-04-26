const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const roundManager = require('../roundManager'); // Needs access to startRound

/**
 * Start the game if conditions are met.
 */
function startGame() {
  // Check if there are any connected players
  const connectedPlayerCount = Object.values(game.players).filter(
    (p) => p.connected
  ).length;

  if (connectedPlayerCount === 0) {
    console.log('Attempted to start game with 0 connected players.');
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.NO_PLAYERS_IN_GAME,
    };
  }

  // Prevent starting if already running
  if (game.isGameRunning) {
    console.log('Attempted to start game that is already running.');
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.GAME_ALREADY_RUNNING,
    };
  }

  game.isGameRunning = true;
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  game.round = CONSTANTS.FIRST_ROUND_NUMBER;
  console.log(`Game started with ${connectedPlayerCount} connected players.`);
  return { success: true };
}

/**
 * Check if the game should auto-start and start it if conditions are met.
 * Emits events and starts the first round via roundManager if successful.
 * @param {object} io - The Socket.IO server instance.
 * @returns {boolean} True if game auto-started, false otherwise.
 */
function checkAutoStart(io) {
  const connectedPlayerCount = Object.values(game.players).filter(
    (p) => p.connected
  ).length;

  if (
    !game.manualStartEnabled && // Manual start is disabled
    CONSTANTS.AUTO_START_ENABLED && // Global auto-start is enabled
    connectedPlayerCount >= CONSTANTS.AUTO_START_PLAYERS && // Enough players connected
    !game.isGameRunning // Game isn't already running
  ) {
    console.log(`Auto-starting game with ${connectedPlayerCount} players.`);
    const startResult = startGame(); // Attempt to start the game

    if (startResult.success) {
      console.log('Game started successfully via auto-start.');
      if (io) {
        io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
          CONSTANTS.SOCKET.EVENT_GAME_STARTED
        );
        console.log('Starting first round immediately due to auto-start.');
        roundManager.startRound(io); // Start the first round
      } else {
        console.error(
          'Auto-start succeeded but cannot start round: io object missing.'
        );
      }
      return true; // Indicate auto-start happened
    } else {
      console.error(
        CONSTANTS.DEBUG_MESSAGES.AUTO_START_FAILED,
        startResult.error || 'Unknown start error'
      );
    }
  } else {
    // Log why auto-start didn't happen (optional)
    // console.log(`Auto-start conditions not met: manual=${game.manualStartEnabled}, autoCfg=${CONSTANTS.AUTO_START_ENABLED}, players=${connectedPlayerCount}, running=${game.isGameRunning}`);
  }
  return false; // Indicate auto-start did not happen
}

module.exports = {
  startGame,
  checkAutoStart,
};
