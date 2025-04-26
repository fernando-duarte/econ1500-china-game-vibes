const { game } = require('./gameState');
const CONSTANTS = require('../shared/constants');
const { calculateOutput } = require('./model');
// Note: checkAutoStart dependency will be handled later when gameLifecycle is created
// const { checkAutoStart } = require('./gameLifecycle'); // Placeholder

/**
 * Add a new player to the game
 * Important: This function currently calls checkAutoStart which lives in gameLogic.js
 * This dependency needs to be resolved by either passing checkAutoStart in, or moving the call
 * back to events.js after this function returns successfully.
 * Let's remove the call for now and assume events.js will handle it.
 */
function addPlayer(playerName, socketId /*, io */) {
  // Check if game is running
  if (game.isGameRunning) {
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.GAME_ALREADY_IN_PROGRESS,
    };
  }

  // Check if player name is already taken
  if (game.players[playerName]) {
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.PLAYER_NAME_TAKEN,
    };
  }

  // Check max players
  if (Object.keys(game.players).length >= CONSTANTS.MAX_PLAYERS) {
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.MAX_PLAYERS_REACHED,
    };
  }

  // Add player to the game
  const initialCapital = CONSTANTS.INITIAL_CAPITAL;
  const initialOutput = calculateOutput(initialCapital);

  game.players[playerName] = {
    socketId,
    name: playerName,
    capital: initialCapital,
    output: initialOutput,
    investment: null,
    connected: true,
    isAutoSubmit: false,
  };

  // const autoStartResult = game.manualStartEnabled ? false : checkAutoStart(io);
  // ^^^ This call needs to be handled by the caller (events.js) ^^^

  return {
    success: true,
    initialCapital: parseFloat(
      initialCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)
    ),
    initialOutput: parseFloat(
      initialOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)
    ),
    // autoStart: autoStartResult, // Caller needs to handle this
    manualStartEnabled: game.manualStartEnabled,
  };
}

/**
 * Handle player reconnection
 */
function playerReconnect(playerName, socketId) {
  if (!game.players[playerName]) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.PLAYER_NOT_FOUND };
  }

  const player = game.players[playerName];
  player.socketId = socketId;
  player.connected = true;

  return {
    success: true,
    isGameRunning: game.isGameRunning,
    round: game.round,
    capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    submitted: player.investment !== null,
  };
}

/**
 * Handle player disconnection
 */
function playerDisconnect(socketId) {
  for (const [playerName, player] of Object.entries(game.players)) {
    if (player.socketId === socketId) {
      console.log(`Player ${playerName} disconnected`);
      player.connected = false;
      break;
    }
  }
  // No return value needed, just updates state
}

module.exports = {
  addPlayer,
  playerReconnect,
  playerDisconnect,
};
