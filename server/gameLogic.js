const {
  calculateOutput,
  calculateNewCapital,
  validateInvestment,
} = require('./model');

const CONSTANTS = require('../shared/constants');

/**
 * Get the room identifier for a specific player
 * @param {string} playerName - The name of the player
 * @return {string} The room identifier for the player
 */
function getPlayerRoom(playerName) {
  return `${CONSTANTS.SOCKET_ROOMS.PLAYER_PREFIX}${playerName}`;
}

// In-memory game state - single game instead of multiple games
let game = {
  isGameRunning: false,
  state: CONSTANTS.GAME_STATES.INACTIVE,
  round: CONSTANTS.FIRST_ROUND_NUMBER - 1,
  players: {},
  roundTimer: null,
  timerInterval: null,
  timeRemaining: 0,
  roundEndTime: null,
  currentIo: null,
  pendingEndRound: false,
  allSubmittedTime: null, // Time when all players have submitted
  manualStartEnabled: false, // Add flag for manual start mode
};

// Export game object for other modules to use
module.exports = {
  game,
  createGame,
  addPlayer,
  startGame,
  startRound,
  submitInvestment,
  playerReconnect,
  playerDisconnect,
  endRound,
  endGame,
  forceEndGame,
  setManualStartMode,
  checkAutoStart,
};

/**
 * Create a new game session
 */
function createGame() {
  // Reset game to initial state without reassigning the object
  Object.assign(game, {
    isGameRunning: false,
    state: CONSTANTS.GAME_STATES.WAITING,
    round: CONSTANTS.FIRST_ROUND_NUMBER - 1,
    players: {}, // Completely reset players object
    roundTimer: null,
    timerInterval: null,
    timeRemaining: 0,
    roundEndTime: null,
    currentIo: null,
    pendingEndRound: false,
    allSubmittedTime: null,
    manualStartEnabled: !CONSTANTS.AUTO_START_ENABLED, // Initialize based on constants
  });

  return true;
}

/**
 * Add a new player to the game
 */
function addPlayer(playerName, socketId, io) {
  // No longer require instructor to have joined first
  // if (!game.instructorSocket) {
  //   return { success: false, error: 'Instructor has not joined yet' };
  // }

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
    name: playerName, // Store player name to use with player-specific rooms
    capital: initialCapital,
    output: initialOutput,
    investment: null, // Initialize investment to null
    connected: true,
    isAutoSubmit: false, // Track auto-submissions
  };

  // Only check for auto-start if manual start is not enabled
  const autoStartResult = game.manualStartEnabled ? false : checkAutoStart(io);

  return {
    success: true,
    initialCapital: parseFloat(
      initialCapital.toFixed(CONSTANTS.DECIMAL_PRECISION),
    ),
    initialOutput: parseFloat(
      initialOutput.toFixed(CONSTANTS.DECIMAL_PRECISION),
    ),
    autoStart: autoStartResult,
    manualStartEnabled: game.manualStartEnabled, // Send manual start mode status to client
  };
}

/**
 * Check if the game should auto-start and start it if conditions are met
 */
function checkAutoStart(io) {
  // Accept io here
  // Only count connected players
  const connectedPlayerCount = Object.values(game.players).filter(
    (player) => player.connected,
  ).length;

  // Only proceed with auto-start if manual start is NOT enabled
  if (
    !game.manualStartEnabled &&
    CONSTANTS.AUTO_START_ENABLED &&
    connectedPlayerCount >= CONSTANTS.AUTO_START_PLAYERS &&
    !game.isGameRunning
  ) {
    console.log(
      'Auto-starting game with',
      connectedPlayerCount,
      'connected players',
    );
    const startResult = startGame();

    if (startResult.success && io) {
      // Check if io exists
      console.log('Game started successfully via auto-start');
      // Broadcast game started to all players and instructors
      io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED,
      );

      // Start the first round immediately instead of scheduling it
      console.log('Starting first round immediately due to auto-start');
      startRound(io);
      return true;
    } else if (!startResult.success) {
      console.error(
        CONSTANTS.DEBUG_MESSAGES.AUTO_START_FAILED,
        startResult.error,
      );
    } else if (!io) {
      console.error(CONSTANTS.DEBUG_MESSAGES.AUTO_START_FAILED_NO_IO);
    }
  }

  return false;
}

/**
 * Start a game
 */
function startGame() {
  // Check if there are any players
  if (Object.keys(game.players).length === 0) {
    return {
      success: false,
      error: CONSTANTS.ERROR_MESSAGES.NO_PLAYERS_IN_GAME,
    };
  }

  // Start the game
  game.isGameRunning = true;
  game.state = CONSTANTS.GAME_STATES.ACTIVE;
  game.round = CONSTANTS.FIRST_ROUND_NUMBER;

  return { success: true };
}

/**
 * Start a new round
 */
function startRound(io) {
  // Reset all investments
  Object.values(game.players).forEach((player) => {
    player.investment = null;
  });

  // Store the io reference for this round
  game.currentIo = io;

  // Set up the centralized timer
  game.timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  game.roundEndTime =
    Date.now() +
    CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND;

  // Clear any existing timers safely
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
    console.error(
      CONSTANTS.DEBUG_MESSAGES.ERROR_CLEARING_TIMERS_START_ROUND,
      timerError,
    );
  }

  try {
    // Start the centralized timer interval
    game.timerInterval = setInterval(() => {
      try {
        // Calculate time remaining
        game.timeRemaining = Math.max(
          0,
          Math.ceil(
            (game.roundEndTime - Date.now()) /
              CONSTANTS.MILLISECONDS_PER_SECOND,
          ),
        );

        // Emit timer update to all clients
        if (io) {
          io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
            CONSTANTS.SOCKET.EVENT_TIMER_UPDATE,
            { timeRemaining: game.timeRemaining },
          );
        }

        // If time has run out, end the round
        if (game.timeRemaining <= 0) {
          clearInterval(game.timerInterval);
          game.timerInterval = null;
          endRound(io);
        }
      } catch (intervalError) {
        console.error(
          CONSTANTS.DEBUG_MESSAGES.ERROR_TIMER_INTERVAL,
          intervalError,
        );
      }
    }, CONSTANTS.MILLISECONDS_PER_SECOND); // Update every second

    // Set a backup timer to ensure the round ends
    game.roundTimer = setTimeout(() => {
      try {
        // Clear the interval timer
        if (game.timerInterval) {
          clearInterval(game.timerInterval);
          game.timerInterval = null;
        }

        // When timer expires, use the stored io reference
        endRound(game.currentIo);
      } catch (timeoutError) {
        console.error(
          CONSTANTS.DEBUG_MESSAGES.ERROR_ROUND_END_TIMEOUT,
          timeoutError,
        );
      }
    }, CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND);
  } catch (timerSetupError) {
    console.error(
      CONSTANTS.DEBUG_MESSAGES.ERROR_SETTING_UP_TIMERS,
      timerSetupError,
    );
  }

  // Emit round start event to all players with the initial timeRemaining
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected) {
      io.to(getPlayerRoom(playerName)).emit(
        CONSTANTS.SOCKET.EVENT_ROUND_START,
        {
          roundNumber: game.round,
          capital: parseFloat(
            player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION),
          ),
          output: parseFloat(
            player.output.toFixed(CONSTANTS.DECIMAL_PRECISION),
          ),
          timeRemaining: game.timeRemaining,
        },
      );
    }
  });

  // Notify instructor of round start
  const instructorData = {
    roundNumber: game.round,
    timeRemaining: game.timeRemaining,
  };
  // Always broadcast to the instructor room
  io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
    CONSTANTS.SOCKET.EVENT_ROUND_START,
    instructorData,
  );

  return { success: true };
}

/**
 * Process a player's investment
 */
function submitInvestment(playerName, investment, isAutoSubmit = false) {
  // Check if the game is running and in an active round
  if (!game.isGameRunning || game.round < CONSTANTS.FIRST_ROUND_NUMBER) {
    return {
      success: false,
      error: CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START,
    };
  }

  // Check if game is over (round exceeds total rounds)
  if (game.round > CONSTANTS.ROUNDS) {
    return { success: false, error: CONSTANTS.UI_TEXT.STATUS_GAME_OVER };
  }

  // Check if player exists
  if (!game.players[playerName]) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.PLAYER_NOT_FOUND };
  }

  const player = game.players[playerName];

  // Validate investment
  const validInvestment = validateInvestment(investment, player.output);

  // Store the player's investment
  player.investment = validInvestment;
  player.isAutoSubmit = isAutoSubmit; // Track whether this was auto-submitted

  // Count connected players and submitted investments
  const connectedPlayers = Object.values(game.players).filter(
    (p) => p.connected,
  ).length;
  const submittedPlayers = Object.values(game.players).filter(
    (p) => p.connected && p.investment !== null,
  ).length;

  console.log(
    `Investment submission status: ${submittedPlayers}/${connectedPlayers} players have submitted`,
  );

  // Check if all connected players have submitted their investments
  const allSubmitted = submittedPlayers === connectedPlayers;

  // If all players have submitted, end the round early
  if (allSubmitted) {
    console.log(
      'All players have submitted investments - preparing to end round early',
    );
    clearTimeout(game.roundTimer);
    // Set the flag to end the round on next IO event
    game.pendingEndRound = true;
    // Store when all submissions were completed (for potential auto-advance timeout)
    game.allSubmittedTime = Date.now();
  }

  return {
    success: true,
    investment: validInvestment,
    allSubmitted: allSubmitted, // Return this flag to the caller
  };
}

/**
 * End a round and process all investments
 */
function endRound(io) {
  // Reset pendingEndRound flag
  game.pendingEndRound = false;

  // Clear any existing timers
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
    console.error(
      CONSTANTS.DEBUG_MESSAGES.ERROR_CLEARING_TIMERS_END_ROUND,
      timerError,
    );
  }

  console.log(`Ending round ${game.round}...`);

  // For players who didn't submit, set investment to their last slider value if available
  // or INVESTMENT_MIN if no slider value was ever recorded (this shouldn't happen with the client changes)
  Object.values(game.players).forEach((player) => {
    if (player.investment === null) {
      // We use INVESTMENT_MIN as a fallback since we can't know the slider position from the server
      // The client-side changes ensure auto-submission of current slider value
      player.investment = CONSTANTS.INVESTMENT_MIN;
    }
  });

  // Process all investments and calculate new capital and output
  const results = [];

  Object.entries(game.players).forEach(([playerName, player]) => {
    // Calculate new capital and output
    const newCapital = calculateNewCapital(player.capital, player.investment);
    const newOutput = calculateOutput(newCapital);

    // Update player stats
    player.capital = newCapital;
    player.output = newOutput;

    // Prepare result for this player
    results.push({
      playerName,
      investment: player.investment,
      newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      isAutoSubmit: player.isAutoSubmit || false, // Include auto-submit flag
    });

    // Send round end event to the player
    if (player.connected && io) {
      io.to(getPlayerRoom(playerName)).emit(CONSTANTS.SOCKET.EVENT_ROUND_END, {
        newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
      });
    }

    // Reset the auto-submit flag for next round
    player.isAutoSubmit = false;
  });

  // Send round summary to instructor room
  if (io) {
    // Send to instructor room
    console.log('Sending round_summary to instructor room');
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      {
        roundNumber: game.round,
        results,
      },
    );

    // Also send round summary to screen clients
    console.log('Sending round_summary to screens room');
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      {
        roundNumber: game.round,
        results,
      },
    );
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.NO_IO_AVAILABLE_END_ROUND);
  }

  // Increment the round counter first
  game.round++;

  // Check if the game is over (next round would exceed max rounds)
  if (game.round > CONSTANTS.ROUNDS) {
    console.log('Game is over - final round reached.');
    endGame(io);
    return { success: true, gameOver: true };
  }

  // We haven't reached the last round yet, so start the next round
  console.log(
    `Round ${game.round - 1} completed. Advancing to round ${game.round}`,
  );

  // Start the next round
  if (io) {
    startRound(io);
  } else {
    console.error(CONSTANTS.DEBUG_MESSAGES.CANNOT_START_NEXT_ROUND);
  }

  return { success: true, gameOver: false };
}

/**
 * End the game and determine the winner
 */
function endGame(io) {
  // Find the player with the highest output
  let maxOutput = CONSTANTS.NEGATIVE_INITIAL_VALUE;
  let winner = null;

  const finalResults = [];

  Object.entries(game.players).forEach(([playerName, player]) => {
    const finalOutput = parseFloat(
      player.output.toFixed(CONSTANTS.DECIMAL_PRECISION),
    );

    finalResults.push({
      playerName,
      finalOutput,
    });

    if (finalOutput > maxOutput) {
      maxOutput = finalOutput;
      winner = playerName;
    }
  });

  // Sort final results by output (descending)
  finalResults.sort((a, b) => b.finalOutput - a.finalOutput);

  // Send game over event to all sockets
  if (io) {
    // Send to all players
    io.to(CONSTANTS.SOCKET_ROOMS.PLAYERS).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      {
        finalResults,
        winner,
      },
    );

    // Send to instructor room
    console.log('Sending game_over to instructor room');
    io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      {
        finalResults,
        winner,
      },
    );

    // Send to screen clients
    console.log('Sending game_over to screens room');
    io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      {
        finalResults,
        winner,
      },
    );
  }

  // Reset game state
  game.isGameRunning = false;
  game.state = CONSTANTS.GAME_STATES.COMPLETED;

  // Preserve connected player information but reset their game data
  const preservedPlayers = {};

  Object.entries(game.players).forEach(([playerName, player]) => {
    // Only keep connected players, and reset their game data
    if (player.connected) {
      preservedPlayers[playerName] = {
        socketId: player.socketId,
        name: playerName,
        capital: CONSTANTS.INITIAL_CAPITAL,
        output: calculateOutput(CONSTANTS.INITIAL_CAPITAL),
        investment: null,
        connected: true,
        isAutoSubmit: false,
      };
    }
  });

  // Replace players with preserved data
  game.players = preservedPlayers;

  return { success: true, finalResults, winner };
}

/**
 * Force end the game immediately
 */
function forceEndGame(io) {
  // Check if game is running
  if (!game.isGameRunning) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.GAME_NOT_RUNNING };
  }

  console.log('Force ending game by instructor request');

  // Clear any existing timers
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
    console.error(
      CONSTANTS.DEBUG_MESSAGES.ERROR_CLEARING_TIMERS_FORCE_END,
      timerError,
    );
  }

  // For any players who haven't submitted investments in this round,
  // set investment to INVESTMENT_MIN to avoid null values
  Object.values(game.players).forEach((player) => {
    if (player.investment === null) {
      player.investment = CONSTANTS.INVESTMENT_MIN;
    }
  });

  // Send notification to all clients
  if (io) {
    io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
      CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION,
      {
        message: CONSTANTS.NOTIFICATION_MESSAGES.GAME_ENDING,
        type: CONSTANTS.NOTIFICATION.TYPE_WARNING,
      },
    );
  }

  // Call endGame function to determine winner and send game_over events
  const result = endGame(io);

  return { success: true, ...result };
}

/**
 * Handle player reconnection
 */
function playerReconnect(playerName, socketId) {
  // Check if player exists
  if (!game.players[playerName]) {
    return { success: false, error: CONSTANTS.ERROR_MESSAGES.PLAYER_NOT_FOUND };
  }

  const player = game.players[playerName];

  // Update player's socket ID and connection status
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
  // Find player by socket ID
  for (const [playerName, player] of Object.entries(game.players)) {
    if (player.socketId === socketId) {
      console.log(`Player ${playerName} disconnected`);
      player.connected = false;
      break;
    }
  }
}

/**
 * Set manual start mode
 */
function setManualStartMode(enabled) {
  game.manualStartEnabled = enabled;
  return { success: true, manualStartEnabled: game.manualStartEnabled };
}
