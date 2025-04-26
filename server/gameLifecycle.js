const { game } = require('./gameState');
const CONSTANTS = require('../shared/constants');
const roundManager = require('./roundManager');
const { calculateOutput } = require('./model'); // Needed for endGame player reset

/**
 * Create a new game session
 */
function createGame() {
  Object.assign(game, {
    isGameRunning: false,
    state: CONSTANTS.GAME_STATES.WAITING,
    round: CONSTANTS.FIRST_ROUND_NUMBER - 1,
    players: {},
    roundTimer: null,
    timerInterval: null,
    timeRemaining: 0,
    roundEndTime: null,
    currentIo: null,
    pendingEndRound: false,
    allSubmittedTime: null,
    manualStartEnabled: !CONSTANTS.AUTO_START_ENABLED,
  });
  console.log('Game created/reset', { manualStart: game.manualStartEnabled });
  return true;
}

/**
 * Start a game
 */
function startGame() {
  if (Object.keys(game.players).length === 0) {
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.NO_PLAYERS_IN_GAME,
    };
  }
  game.isGameRunning = true;
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  game.round = CONSTANTS.FIRST_ROUND_NUMBER;
  console.log('Game started');
  return { success: true };
}

/**
 * Check if the game should auto-start and start it if conditions are met
 * Returns true if game auto-started, false otherwise.
 */
function checkAutoStart(io) {
  const connectedPlayerCount = Object.values(game.players).filter(
    (p) => p.connected
  ).length;

  if (
    !game.manualStartEnabled &&
    CONSTANTS.AUTO_START_ENABLED &&
    connectedPlayerCount >= CONSTANTS.AUTO_START_PLAYERS &&
    !game.isGameRunning
  ) {
    console.log(`Auto-starting game with ${connectedPlayerCount} players`);
    const startResult = startGame(); // Calls startGame in this module

    if (startResult.success && io) {
      console.log('Game started successfully via auto-start');
      io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED
      );
      console.log('Starting first round immediately due to auto-start');
      roundManager.startRound(io); // Calls startRound from roundManager
      return true; // Indicate auto-start happened
    } else if (!startResult.success) {
      console.error(
        CONSTANTS.DEBUG_MESSAGES.AUTO_START_FAILED,
        startResult.error
      );
    } else if (!io) {
      console.error(CONSTANTS.DEBUG_MESSAGES.AUTO_START_FAILED_NO_IO);
    }
  }
  return false; // Indicate auto-start did not happen
}

/**
 * End the game and determine the winner
 */
function endGame(io) {
  // Prevent multiple calls if already completed or inactive
  if (
    game.state === CONSTANTS.GAME_STATES.COMPLETED ||
    game.state === CONSTANTS.GAME_STATES.INACTIVE
  ) {
    console.log(
      `Attempted to end game while state is ${game.state}. Aborting.`
    );
    return { success: false, error: 'Game already ended or not active.' };
  }
  console.log('Ending game normally...');
  game.isGameRunning = false;
  game.state = CONSTANTS.GAME_STATES.COMPLETED;
  roundManager.clearRoundTimers(); // Ensure timers are stopped

  let maxOutput = CONSTANTS.NEGATIVE_INITIAL_VALUE;
  let winner = null;
  const finalResults = [];

  Object.entries(game.players).forEach(([playerName, player]) => {
    const finalOutput = parseFloat(
      player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)
    );
    finalResults.push({ playerName, finalOutput });
    if (finalOutput > maxOutput) {
      maxOutput = finalOutput;
      winner = playerName;
    }
  });

  finalResults.sort((a, b) => b.finalOutput - a.finalOutput);

  if (io) {
    const gameOverData = { finalResults, winner };
    io.to(CONSTANTS.SOCKET_ROOMS.PLAYERS).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      gameOverData
    );
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      gameOverData
    );
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      gameOverData
    );
    console.log('Sent game_over events');
  }

  // Reset players (keep connected ones, reset stats)
  const preservedPlayers = {};
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected) {
      preservedPlayers[playerName] = {
        ...player, // Keep socketId, name, connected status
        capital: CONSTANTS.INITIAL_CAPITAL,
        output: calculateOutput(CONSTANTS.INITIAL_CAPITAL),
        investment: null,
        isAutoSubmit: false,
      };
    }
  });
  game.players = preservedPlayers;
  console.log(
    `Game ended. Winner: ${winner}. Preserved ${Object.keys(preservedPlayers).length} players.`
  );

  return { success: true, finalResults, winner };
}

/**
 * Force end the game immediately
 */
function forceEndGame(io) {
  if (!game.isGameRunning) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.GAME_NOT_RUNNING };
  }
  console.log('Force ending game by instructor request');
  roundManager.clearRoundTimers(); // Use centralized timer clearing

  // Auto-submit min investment for any players mid-round
  Object.values(game.players).forEach((player) => {
    if (
      player.connected &&
      player.investment === null &&
      game.state === CONSTANTS.GAME_STATES.ACTIVE
    ) {
      player.investment = CONSTANTS.INVESTMENT_MIN;
      player.isAutoSubmit = true;
    }
  });

  if (io) {
    io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
      CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION,
      {
        message: CONSTANTS.NOTIFICATION_MESSAGES.GAME_ENDING,
        type: CONSTANTS.NOTIFICATION.TYPE_WARNING,
      }
    );
  }

  // Call the normal endGame function to calculate results and reset state
  const result = endGame(io);
  return { success: true, ...result };
}

/**
 * Set manual start mode
 */
function setManualStartMode(enabled) {
  game.manualStartEnabled = enabled;
  console.log(`Manual start mode set to: ${enabled}`);
  return { success: true, manualStartEnabled: game.manualStartEnabled };
}

module.exports = {
  createGame,
  startGame,
  checkAutoStart,
  endGame,
  forceEndGame,
  setManualStartMode,
};
