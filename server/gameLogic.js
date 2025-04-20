const { 
  calculateOutput, 
  calculateNewCapital, 
  validateInvestment 
} = require('./model');

const CONSTANTS = require('../shared/constants');

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
  instructorSocket: null, // Add reference to instructor socket
  allSubmittedTime: null // Time when all players have submitted
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
    players: {},
    roundTimer: null,
    timerInterval: null,
    timeRemaining: 0,
    roundEndTime: null,
    currentIo: null,
    pendingEndRound: false,
    instructorSocket: null,
    allSubmittedTime: null
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
    return { success: false, error: 'Game already in progress' };
  }

  // Check if player name is already taken
  if (game.players[playerName]) {
    return { success: false, error: 'Player name already taken' };
  }

  // Check max players
  if (Object.keys(game.players).length >= CONSTANTS.MAX_PLAYERS) {
    return { success: false, error: 'Maximum number of players reached' };
  }

  // Add player to the game
  const initialCapital = CONSTANTS.INITIAL_CAPITAL;
  const initialOutput = calculateOutput(initialCapital);
  
  game.players[playerName] = {
    socketId,
    capital: initialCapital,
    output: initialOutput,
    investment: null, // Initialize investment to null
    connected: true,
    isAutoSubmit: false // Track auto-submissions
  };

  // Check if the game should auto-start
  const autoStartResult = checkAutoStart(io); // Pass io here

  return { 
    success: true, 
    initialCapital: parseFloat(initialCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)), 
    initialOutput: parseFloat(initialOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    autoStart: autoStartResult
  };
}

/**
 * Check if the game should auto-start and start it if conditions are met
 */
function checkAutoStart(io) { // Accept io here
  if (CONSTANTS.AUTO_START_ENABLED && 
      Object.keys(game.players).length >= CONSTANTS.AUTO_START_PLAYERS && 
      !game.isGameRunning) {
    
    console.log('Auto-starting game with', Object.keys(game.players).length, 'players');
    const startResult = startGame();
    
    if (startResult.success && io) { // Check if io exists
      console.log('Game started successfully via auto-start');
      // Broadcast game started to all players and instructors
      io.emit('game_started'); // <<< ADDED THIS LINE
      
      // Start the first round immediately instead of scheduling it
      console.log('Starting first round immediately due to auto-start');
      startRound(io);
      return true;
    } else if (!startResult.success) {
      console.error('Auto-start failed:', startResult.error);
    } else if (!io) {
      console.error('Auto-start failed: io object is missing');
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
    return { success: false, error: 'No players in the game' };
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
  Object.values(game.players).forEach(player => {
    player.investment = null;
  });
  
  // Store the io reference for this round
  game.currentIo = io;
  
  // Set up the centralized timer
  game.timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  game.roundEndTime = Date.now() + (CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND);
  
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
    console.error('Error clearing existing timers in startRound:', timerError);
  }
  
  try {
    // Start the centralized timer interval
    game.timerInterval = setInterval(() => {
      try {
        // Calculate time remaining
        game.timeRemaining = Math.max(0, Math.ceil((game.roundEndTime - Date.now()) / CONSTANTS.MILLISECONDS_PER_SECOND));
        
        // Emit timer update to all clients
        if (io) {
          io.emit('timer_update', { timeRemaining: game.timeRemaining });
        }
        
        // If time has run out, end the round
        if (game.timeRemaining <= 0) {
          clearInterval(game.timerInterval);
          game.timerInterval = null;
          endRound(io);
        }
      } catch (intervalError) {
        console.error('Error in timer interval:', intervalError);
      }
    }, 1000); // Update every second
    
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
        console.error('Error in round end timeout:', timeoutError);
      }
    }, CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND);
  } catch (timerSetupError) {
    console.error('Error setting up timers:', timerSetupError);
  }
  
  // Emit round start event to all players with the initial timeRemaining
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected) {
      io.to(player.socketId).emit('round_start', {
        roundNumber: game.round,
        capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        timeRemaining: game.timeRemaining
      });
    }
  });
  
  // Notify instructor of round start
  const instructorData = { roundNumber: game.round, timeRemaining: game.timeRemaining };
  if (game.instructorSocket && game.instructorSocket.connected) {
    game.instructorSocket.emit('round_start', instructorData);
  } else {
    // Just broadcast to everyone if no instructor socket available
    io.emit('round_start', instructorData);
  }
  
  return { success: true };
}

/**
 * Process a player's investment
 */
function submitInvestment(playerName, investment, isAutoSubmit = false) {
  // Check if the game is running and in an active round
  if (!game.isGameRunning || game.round < CONSTANTS.FIRST_ROUND_NUMBER) {
    return { success: false, error: 'Game not running' };
  }
  
  // Check if player exists
  if (!game.players[playerName]) {
    return { success: false, error: 'Player not found' };
  }
  
  const player = game.players[playerName];
  
  // Validate investment
  const validInvestment = validateInvestment(investment, player.output);
  
  // Store the player's investment
  player.investment = validInvestment;
  player.isAutoSubmit = isAutoSubmit; // Track whether this was auto-submitted
  
  // Count connected players and submitted investments
  const connectedPlayers = Object.values(game.players).filter(p => p.connected).length;
  const submittedPlayers = Object.values(game.players).filter(p => p.connected && p.investment !== null).length;
  
  console.log(`Investment submission status: ${submittedPlayers}/${connectedPlayers} players have submitted`);
  
  // Check if all connected players have submitted their investments
  const allSubmitted = submittedPlayers === connectedPlayers;
  
  // If all players have submitted, end the round early
  if (allSubmitted) {
    console.log('All players have submitted investments - preparing to end round early');
    clearTimeout(game.roundTimer);
    // Set the flag to end the round on next IO event
    game.pendingEndRound = true;
    // Store when all submissions were completed (for potential auto-advance timeout)
    game.allSubmittedTime = Date.now();
  }
  
  return { 
    success: true, 
    investment: validInvestment,
    allSubmitted: allSubmitted  // Return this flag to the caller
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
    console.error('Error clearing timers in endRound:', timerError);
  }
  
  console.log(`Ending round ${game.round}...`);
  
  // For players who didn't submit, set investment to their last slider value if available
  // or 0 if no slider value was ever recorded (this shouldn't happen with the client changes)
  Object.values(game.players).forEach(player => {
    if (player.investment === null) {
      // We use 0 as a fallback since we can't know the slider position from the server
      // The client-side changes ensure auto-submission of current slider value
      player.investment = 0;
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
      isAutoSubmit: player.isAutoSubmit || false // Include auto-submit flag
    });
    
    // Send round end event to the player
    if (player.connected && io) {
      io.to(player.socketId).emit('round_end', {
        newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION))
      });
    }
    
    // Reset the auto-submit flag for next round
    player.isAutoSubmit = false;
  });
  
  // Send round summary to all instructor sockets
  if (io) {
    // Send to instructor using direct socket reference if available
    if (game.instructorSocket && game.instructorSocket.connected) {
      console.log(`Sending round_summary directly to instructor socket ${game.instructorSocket.id}`);
      game.instructorSocket.emit('round_summary', {
        roundNumber: game.round,
        results
      });
    } else {
      // Fallback to broadcasting if no instructor socket
      console.log('Broadcasting round_summary to all clients');
      io.emit('round_summary', {
        roundNumber: game.round,
        results
      });
    }
    
    // Also send round summary to screen clients
    console.log('Sending round_summary to screens room');
    io.to('screens').emit('round_summary', {
      roundNumber: game.round,
      results
    });
  } else {
    console.error('No io object available when ending round!');
  }
  
  // Check if the game is over
  if (game.round >= CONSTANTS.ROUNDS) {
    console.log('Game is over - final round reached.');
    endGame(io);
    return { success: true, gameOver: true };
  }
  
  // Increment the round
  console.log(`Round ${game.round} completed. Advancing to round ${game.round + 1}`);
  game.round++;
  
  // Start the next round
  if (io) {
    startRound(io);
  } else {
    console.error('Cannot start next round - no io object available!');
  }
  
  return { success: true, gameOver: false };
}

/**
 * End the game and determine the winner
 */
function endGame(io) {
  // Find the player with the highest output
  let maxOutput = -1;
  let winner = null;
  
  const finalResults = [];
  
  Object.entries(game.players).forEach(([playerName, player]) => {
    const finalOutput = parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION));
    
    finalResults.push({
      playerName,
      finalOutput
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
    io.to('players').emit('game_over', {
      finalResults,
      winner
    });
    
    // Send directly to instructor if available
    if (game.instructorSocket && game.instructorSocket.connected) {
      console.log(`Sending game_over directly to instructor socket ${game.instructorSocket.id}`);
      game.instructorSocket.emit('game_over', {
        finalResults,
        winner
      });
    } else {
      // Broadcast to everyone as fallback
      console.log('Broadcasting game_over to all clients');
      io.emit('game_over', {
        finalResults,
        winner
      });
    }
    
    // Send to screen clients
    console.log(`Sending game_over to screens room`);
    io.to('screens').emit('game_over', {
      finalResults,
      winner
    });
  }
  
  // Reset game state
  game.isGameRunning = false;
  game.state = CONSTANTS.GAME_STATES.COMPLETED;
  
  return { success: true, finalResults, winner };
}

/**
 * Handle player reconnection
 */
function playerReconnect(playerName, socketId) {
  // Check if game is inactive
  if (game.state === CONSTANTS.GAME_STATES.INACTIVE) {
    return { success: false, error: 'No active game' };
  }
  
  // Check if player exists
  if (!game.players[playerName]) {
    return { success: false, error: 'Player not found' };
  }
  
  const player = game.players[playerName];
  
  // Update socket ID and connection status
  player.socketId = socketId;
  player.connected = true;
  
  // Return current game state for the player
  return {
    success: true,
    isGameRunning: game.isGameRunning,
    round: game.round,
    capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    submitted: player.investment !== null
  };
}

/**
 * Mark player as disconnected
 */
function playerDisconnect(socketId) {
  // Find player with this socket ID
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.socketId === socketId) {
      player.connected = false;
    }
  });
}

// Export the game functions
module.exports = {
  createGame,
  addPlayer,
  startGame,
  startRound,
  submitInvestment,
  endRound,
  endGame,
  playerReconnect,
  playerDisconnect,
  game  // Export the game object for external use
}; 