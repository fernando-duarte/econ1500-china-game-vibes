const { 
  calculateOutput, 
  calculateNewCapital, 
  validateInvestment 
} = require('./model');

const CONSTANTS = require('../shared/constants');
const { Errors } = require('./errors');
const socketManager = require('./socketManager');

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
  allSubmittedTime: null, // Time when all players have submitted
  roundStartTime: null,
  roundActive: false
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
    allSubmittedTime: null,
    roundStartTime: null,
    roundActive: false
  });

  return true;
}

/**
 * Add a new player to the game
 */
function addPlayer(playerName, socketId, io) {
  console.log(`[ADD_PLAYER] Attempting to add player: ${playerName}, socketId: ${socketId}`);
  
  // Check if game is running
  if (game.isGameRunning) {
    console.log(`[ADD_PLAYER] Failed: Game already in progress`);
    return { success: false, error: 'Game already in progress' };
  }

  // Check if player name is already taken
  if (game.players[playerName]) {
    console.log(`[ADD_PLAYER] Failed: Player name ${playerName} already taken`);
    return { success: false, error: 'Player name already taken' };
  }

  // Check max players
  if (Object.keys(game.players).length >= CONSTANTS.MAX_PLAYERS) {
    console.log(`[ADD_PLAYER] Failed: Maximum number of players (${CONSTANTS.MAX_PLAYERS}) reached`);
    return { success: false, error: 'Maximum number of players reached' };
  }

  console.log(`[ADD_PLAYER] Adding player ${playerName} to game`);
  
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

  console.log(`[ADD_PLAYER] Player ${playerName} successfully added with capital: ${initialCapital}, output: ${initialOutput}`);
  console.log(`[ADD_PLAYER] Current player count: ${Object.keys(game.players).length}`);

  // Check if the game should auto-start
  const autoStartResult = checkAutoStart(io); // Pass io here
  console.log(`[ADD_PLAYER] Auto-start check result: ${autoStartResult}`);

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
 * Start a round
 */
function startRound(io) {
  console.log('Starting round');
  
  // Set round end time explicitly
  game.roundStartTime = Date.now();
  game.roundEndTime = game.roundStartTime + (CONSTANTS.ROUND_DURATION_SECONDS * 1000);
  game.roundActive = true;
  
  // Reset player investments for the new round
  for (const player of Object.values(game.players)) {
    player.investment = null;
    player.isAutoSubmit = false;
  }
  
  // Set the round timer to end the round after the specified duration
  game.roundTimer = setTimeout(() => {
    // End the round
    endRound(io);
  }, CONSTANTS.ROUND_DURATION_SECONDS * 1000);
  
  // Create a timer interval for second-by-second updates
  game.timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  game.timerInterval = setInterval(() => {
    if (game.timeRemaining > 0) {
      game.timeRemaining--;
      
      // Broadcast timer update to all clients
      io.emit('timer_update', {
        timeRemaining: game.timeRemaining
      });
      
      // Auto-submit for anyone who hasn't submitted with X seconds remaining
      if (game.timeRemaining === CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS) {
        console.log(`Auto-submit threshold reached (${CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS} seconds remaining)`);
        
        // Check all players
        let autoSubmitCount = 0;
        for (const [playerName, player] of Object.entries(game.players)) {
          // Skip players who have already submitted
          if (player.investment !== null) continue;
          
          // Auto-submit for this player (default 0)
          console.log(`Auto-submitting investment for ${playerName}`);
          const investment = 0; // Default to investing nothing
          player.investment = investment;
          player.isAutoSubmit = true;
          autoSubmitCount++;
          
          // Notify the player
          if (player.socketId && player.connected) {
            try {
              const playerSocket = io.sockets.sockets.get(player.socketId);
              if (playerSocket) {
                playerSocket.emit('investment_received', {
                  investment,
                  isAutoSubmit: true
                });
              }
            } catch (err) {
              console.error(`Error notifying player ${playerName} about auto-submission:`, err);
            }
          }
          
          // Notify instructor
          if (game.instructorSocket && game.instructorSocket.connected) {
            game.instructorSocket.emit('investment_received', {
              playerName,
              investment,
              isAutoSubmit: true
            });
          }
          
          // Notify screens
          io.to('screens').emit('investment_received', {
            playerName,
            investment,
            isAutoSubmit: true
          });
        }
        
        if (autoSubmitCount > 0) {
          console.log(`Auto-submitted for ${autoSubmitCount} players`);
        }
        
        // Check if everyone has submitted
        const pendingPlayers = Object.values(game.players).filter(p => p.investment === null);
        if (pendingPlayers.length === 0) {
          console.log('All players have submitted (via auto-submit) - will end round');
          game.pendingEndRound = true;
        }
      }
    }
  }, 1000);
  
  // Send more accurate time remaining
  const timeRemaining = CONSTANTS.ROUND_DURATION_SECONDS;
  
  // Broadcast round start with timestamp
  io.emit('round_start', {
    roundNumber: game.round,
    timeRemaining: timeRemaining,
    serverTimestamp: Date.now() // Include server time for sync
  });
}

/**
 * Process a player's investment
 */
function submitInvestment(playerName, investment, isAutoSubmit = false) {
  // Check if the game is running and in an active round
  if (!game.isGameRunning || game.round < CONSTANTS.FIRST_ROUND_NUMBER) {
    return { 
      success: false, 
      error: Errors.gameNotFound().message
    };
  }
  
  // Check if player exists
  if (!game.players[playerName]) {
    return { 
      success: false, 
      error: Errors.playerNotFound(playerName).message
    };
  }
  
  const player = game.players[playerName];
  
  // Check if player already submitted
  if (player.investment !== null) {
    return { 
      success: false, 
      error: Errors.alreadySubmitted(playerName).message
    };
  }
  
  // Validate investment
  if (typeof investment !== 'number' || isNaN(investment)) {
    return { 
      success: false, 
      error: Errors.invalidInput('investment', 'not a number').message
    };
  }
  
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
  console.log(`Ending round ${game.round}`);
  
  // Process investments for all players, including disconnected ones
  const playerResults = [];
  let allPlayersProcessed = true;
  
  try {
    // Clear round end timer
    clearRoundTimer();
    
    // Set round as inactive
    game.roundActive = false;
    
    // Reset pendingEndRound flag
    game.pendingEndRound = false;
    
    // Process each player
    Object.entries(game.players).forEach(([playerName, player]) => {
      try {
        // Handle players who haven't submitted an investment
        if (player.investment === null) {
          const isDisconnected = !player.connected;
          // Default investment is 0
          const defaultInvestment = 0;
          
          console.log(`Auto-investment for ${isDisconnected ? 'disconnected' : 'timed-out'} player ${playerName}: ${defaultInvestment}`);
          
          // Apply default investment
          player.investment = defaultInvestment;
          player.isAutoSubmit = true;
        }
        
        // Process this player's investment
        const result = processPlayerInvestment(playerName, player);
        playerResults.push(result);
      } catch (playerError) {
        console.error(`Error processing player ${playerName}:`, playerError);
        allPlayersProcessed = false;
      }
    });
    
    // If all processing succeeded, notify clients
    if (allPlayersProcessed) {
      notifyRoundResults(io, playerResults);
    } else {
      console.error('Failed to process all players, round results may be incomplete');
      notifyRoundResults(io, playerResults);
    }
    
    // Check if the game is over
    if (game.round >= CONSTANTS.ROUNDS) {
      console.log('Game is over - final round reached.');
      endGame(io);
      return;
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
  } catch (error) {
    console.error('Critical error in endRound:', error);
    // Still try to continue the game
    if (game.round < CONSTANTS.ROUNDS) {
      console.log('Attempting to continue despite errors');
      game.round++;
      startRound(io);
    } else {
      console.log('Final round reached despite errors, ending game');
      endGame(io);
    }
  }
}

// Helper for fault-tolerant investment processing
function processPlayerInvestment(playerName, player) {
  // Save last investment for history
  player.lastInvestment = player.investment;
  
  // Calculate new capital and output
  const investment = player.investment;
  player.capital = player.capital - investment + player.output;
  
  // Production function: Y = K^α
  player.output = Math.pow(player.capital, CONSTANTS.ALPHA);
  
  // Account for depreciation
  player.capital = player.capital * (1 - CONSTANTS.DEPRECIATION_RATE);
  
  // Reset for next round
  player.investment = null;
  player.isAutoSubmit = false;
  
  // Return this player's result for notification
  return {
    playerName,
    investment: parseFloat(investment.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    newCapital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    newOutput: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    isAutoSubmit: player.isAutoSubmit || false
  };
}

// Clear any existing round timer
function clearRoundTimer() {
  if (game.roundTimer) {
    clearTimeout(game.roundTimer);
    game.roundTimer = null;
  }
  
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
}

// Helper to notify clients about round results
function notifyRoundResults(io, results) {
  // Send to all clients
  try {
    io.emit('round_summary', {
      roundNumber: game.round,
      results
    });
    
    // Also send to specific rooms
    io.to('screens').emit('round_summary', {
      roundNumber: game.round,
      results
    });
  } catch (err) {
    console.error('Error sending round results:', err);
  }
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
      try {
        // Verify the socket is still valid
        const instructorSocketId = game.instructorSocket.id;
        if (!instructorSocketId) {
          console.error('Instructor socket is invalid (no ID) for game_over');
          broadcastGameOver();
        } else if (!io.sockets.sockets.has(instructorSocketId)) {
          console.error(`Instructor socket ID ${instructorSocketId} not found in connected sockets for game_over`);
          broadcastGameOver();
        } else {
          console.log(`Sending game_over directly to instructor socket ${game.instructorSocket.id}`);
          game.instructorSocket.emit('game_over', {
            finalResults,
            winner
          });
        }
      } catch (err) {
        console.error('Error sending game_over to instructor:', err);
        broadcastGameOver();
      }
    } else {
      // Broadcast to everyone as fallback
      broadcastGameOver();
    }
    
    // Helper function to broadcast as fallback
    function broadcastGameOver() {
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
 * Handle a player reconnection
 */
function playerReconnect(socketId, playerName) {
  const reconnectTime = Date.now();
  console.log(`Player ${playerName} reconnecting at ${new Date(reconnectTime).toISOString()}`);
  
  // Check if game exists
  if (!game) {
    console.error('No game exists for reconnection');
    return { 
      success: false, 
      error: Errors.gameNotFound().message 
    };
  }
  
  // Check if player exists
  if (!game.players[playerName]) {
    console.error(`Player ${playerName} not found in game for reconnection`);
    return { 
      success: false, 
      error: Errors.playerNotFound(playerName).message 
    };
  }
  
  const player = game.players[playerName];
  
  // Update socket id and connection status
  player.socketId = socketId;
  player.connected = true;
  player.lastReconnectTime = reconnectTime;
  
  console.log(`Updated socket ID for ${playerName} to ${socketId}`);
  
  // Determine game state and remaining time
  let gameState = 'waiting'; // Default state
  let timeRemaining = 0;
  
  if (game.roundActive) {
    gameState = 'round_active';
    // Calculate remaining time based on current time and round end time
    timeRemaining = Math.max(0, Math.floor((game.roundEndTime - Date.now()) / 1000));
  } else if (game.round > 0) {
    gameState = 'between_rounds';
  }
  
  // Check if player has already invested in the current round
  const lastInvestment = player.investment !== null ? player.investment : null;
  
  // Create game state to send back
  const gameStateInfo = {
    success: true,
    playerName: playerName,
    gameState: gameState,
    roundNumber: game.round,
    capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
    timeRemaining: timeRemaining,
    lastInvestment: lastInvestment,
    isGameRunning: game.isGameRunning,
    submitted: player.investment !== null,
    finalOutput: game.state === CONSTANTS.GAME_STATES.COMPLETED && player.finalOutput !== undefined
      ? parseFloat(player.finalOutput.toFixed(CONSTANTS.DECIMAL_PRECISION))
      : null
  };
  
  console.log(`Sending game state to reconnected player ${playerName}:`, gameStateInfo);
  
  return gameStateInfo;
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