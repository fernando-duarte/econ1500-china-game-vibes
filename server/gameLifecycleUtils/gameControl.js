const { game } = require('../gameState');
const CONSTANTS = require('../../shared/constants');
const roundManager = require('../roundManager'); // Needs access to startRound, clearRoundTimers
const { calculateOutput } = require('../model'); // Needed for resetting player output in endGame

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

/**
 * End the game normally, calculate results, notify clients, and reset player states.
 * @param {object} io - The Socket.IO server instance.
 */
function endGame(io) {
  // Prevent ending if not active or already completed/inactive
  if (
    game.state !== CONSTANTS.GAME_STATES.ACTIVE &&
    game.state !== CONSTANTS.GAME_STATES.ROUND_ENDING // Allow ending if currently in round end process
  ) {
    console.log(
      `Attempted to end game while state is ${game.state}. Aborting.`
    );
    return { success: false, error: 'Game not active or already ended.' };
  }

  console.log('Ending game normally...');
  game.isGameRunning = false;
  game.state = CONSTANTS.GAME_STATES.COMPLETED;
  roundManager.clearRoundTimers(); // Ensure timers are stopped

  let maxOutput = CONSTANTS.NEGATIVE_INITIAL_VALUE;
  let winner = null;
  const finalResults = [];

  // Calculate final results for all players who were ever in the game
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

  // Sort results descending by output
  finalResults.sort((a, b) => b.finalOutput - a.finalOutput);

  // Notify all connected clients
  if (io) {
    const gameOverData = { finalResults, winner };
    console.log('Sending game_over events');
    io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      gameOverData
    );
    // Specific rooms are redundant if sending to ALL
    // io.to(CONSTANTS.SOCKET_ROOMS.PLAYERS).emit(CONSTANTS.SOCKET.EVENT_GAME_OVER, gameOverData);
    // io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(CONSTANTS.SOCKET.EVENT_GAME_OVER, gameOverData);
    // io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(CONSTANTS.SOCKET.EVENT_GAME_OVER, gameOverData);
  } else {
    console.error('Cannot send game_over events: io object missing.');
  }

  // Prepare for potential next game: Reset stats for connected players,
  // remove disconnected players.
  const preservedPlayers = {};
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected) {
      preservedPlayers[playerName] = {
        ...player, // Keep socketId, name, connected status, team info
        capital: CONSTANTS.INITIAL_CAPITAL,
        output: calculateOutput(CONSTANTS.INITIAL_CAPITAL), // Reset output
        investment: null,
        isAutoSubmit: false,
      };
    }
    // Disconnected players are implicitly removed by not being added here
  });
  game.players = preservedPlayers;
  console.log(
    `Game ended. Winner: ${winner || 'None'}. Preserved ${Object.keys(preservedPlayers).length} connected players.`
  );

  // Return results (useful if called directly, e.g., by forceEndGame)
  return { success: true, finalResults, winner };
}

/**
 * Force end the game immediately, typically triggered by an admin/instructor.
 * Emits notifications and calls the normal endGame function.
 * @param {object} io - The Socket.IO server instance.
 */
function forceEndGame(io) {
  // Allow forcing end even if waiting or round ending, but not if already completed/inactive
  if (
    game.state === CONSTANTS.GAME_STATES.COMPLETED ||
    game.state === CONSTANTS.GAME_STATES.INACTIVE
  ) {
    console.log(`Attempted to force end game while state is ${game.state}.`);
    return { success: false, error: 'Game already ended or inactive.' };
  }

  console.log('Force ending game by instructor request...');
  roundManager.clearRoundTimers(); // Stop any active timers

  // No need to auto-submit here, as endGame calculates final results based on current state.

  if (io) {
    console.log('Sending force game end notification.');
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
  console.log('Force end game process completed.');
  // Return success along with the results from endGame
  return { success: true, ...result };
}

module.exports = {
  startGame,
  checkAutoStart,
  endGame,
  forceEndGame,
}; 