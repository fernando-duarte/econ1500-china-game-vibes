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
  round: 0,
  players: {},
  roundTimer: null
};

/**
 * Create a new game session
 */
function createGame() {
  // Reset game to initial state
  game = {
    isGameRunning: false,
    state: CONSTANTS.GAME_STATES.WAITING,
    round: 0,
    players: {},
    roundTimer: null
  };
  
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
  
  return { 
    success: true, 
    initialCapital, 
    initialOutput: parseFloat(initialOutput.toFixed(CONSTANTS.DECIMAL_PRECISION))
  };
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
    endRound(io);
  }, CONSTANTS.ROUND_DURATION_SECONDS * CONSTANTS.MILLISECONDS_PER_SECOND);
  
  return { success: true };
}

/**
 * Process a player's investment
 */
function submitInvestment(playerName, investment) {
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
  
  // Check if all players have submitted their investments
  const allSubmitted = Object.values(game.players).every(
    player => player.investment !== null || !player.connected
  );
  
  // If all players have submitted, end the round early
  if (allSubmitted) {
    clearTimeout(game.roundTimer);
    endRound(null); // Will be called with io in the actual implementation
  }
  
  return { success: true, investment: validInvestment };
}

/**
 * End a round and process all investments
 */
function endRound(io) {
  // For players who didn't submit, set investment to 0
  Object.values(game.players).forEach(player => {
    if (player.investment === null) {
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
      newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION))
    });
    
    // Send round end event to the player
    if (player.connected && io) {
      io.to(player.socketId).emit('round_end', {
        newCapital: parseFloat(newCapital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
        newOutput: parseFloat(newOutput.toFixed(CONSTANTS.DECIMAL_PRECISION))
      });
    }
  });
  
  // Send round summary to all instructor sockets
  if (io) {
    io.to('instructor').emit('round_summary', {
      roundNumber: game.round,
      results
    });
  }
  
  // Check if the game is over
  if (game.round >= CONSTANTS.ROUNDS) {
    endGame(io);
    return { success: true, gameOver: true };
  }
  
  // Increment the round
  game.round++;
  
  // Start the next round
  if (io) {
    startRound(io);
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
    io.to('players').emit('game_over', {
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

module.exports = {
  createGame,
  addPlayer,
  startGame,
  startRound,
  submitInvestment,
  endRound,
  endGame,
  playerReconnect,
  playerDisconnect
}; 