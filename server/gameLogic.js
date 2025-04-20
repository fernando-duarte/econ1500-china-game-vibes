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
    currentIo: null,
    pendingEndRound: false,
    instructorSocket: null,
    allSubmittedTime: null
  });

  return true;
}

/**
 * Add a player to a game
 */
function addPlayer(playerName, socketId) {
  // Don't allow joins if no game exists or game is already running
  if (game.state === CONSTANTS.GAME_STATES.INACTIVE) {
    return { success: false, error: 'No active game' };
  }
  
  if (game.isGameRunning) {
    return { success: false, error: 'Game already started' };
  }
  
  // Check if player name is already taken
  if (Object.keys(game.players).some(name => name.toLowerCase() === playerName.toLowerCase())) {
    return { success: false, error: 'Player name already taken' };
  }
  
  // Add the player to the game
  const initialCapital = CONSTANTS.INITIAL_CAPITAL;
  const initialOutput = calculateOutput(initialCapital);
  
  game.players[playerName] = {
    socketId,
    capital: initialCapital,
    output: initialOutput,
    investment: null,
    connected: true
  };
  
  // Check if auto-start is enabled and enough players have joined
  const autoStartResult = checkAutoStart();
  
  return { 
    success: true, 
    initialCapital, 
    initialOutput: parseFloat(initialOutput.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    autoStart: autoStartResult
  };
}

/**
 * Check if the game should auto-start and start it if conditions are met
 */
function checkAutoStart() {
  if (CONSTANTS.AUTO_START_ENABLED && 
      Object.keys(game.players).length >= CONSTANTS.AUTO_START_PLAYERS && 
      !game.isGameRunning) {
    
    console.log('Auto-starting game with', Object.keys(game.players).length, 'players');
    const startResult = startGame();
    
    if (startResult.success && game.currentIo) {
      // Start the first round immediately instead of scheduling it
      console.log('Starting first round immediately due to auto-start');
      startRound(game.currentIo);
      return true;
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
  
  // Emit round start event to all players
  Object.entries(game.players).forEach(([playerName, player]) => {
    if (player.connected) {
      io.to(player.socketId).emit('round_start', {
        roundNumber: game.round,
        capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        timeRemaining: CONSTANTS.ROUND_DURATION_SECONDS
      });
    }
  });
  
  // Start the round timer
  game.roundTimer = setTimeout(() => {
    // When timer expires, use the stored io reference
    endRound(game.currentIo);
  }, CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND);
  
  // Notify instructor of round start
  const instructorData = { roundNumber: game.round, timeRemaining: CONSTANTS.ROUND_DURATION_SECONDS };
  if (game.instructorSocket && game.instructorSocket.connected) {
    game.instructorSocket.emit('round_start', instructorData);
  } else {
    console.error('Cannot notify instructor: No valid instructor socket for round_start');
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
      // Fallback to room-based messaging
      console.log('Sending round_summary to instructor room');
      io.to('instructor').emit('round_summary', {
        roundNumber: game.round,
        results
      });
    }
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
    }
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