const {
  createGame,
  addPlayer,
  startGame,
  startRound,
  submitInvestment,
  playerReconnect,
  playerDisconnect
} = require('./gameLogic');

const CONSTANTS = require('../shared/constants');
const playerManager = require('./playerManager');
const connectionHandler = require('./connectionHandler');
const { Errors } = require('./utils/errorHandler');

/**
 * Set up Socket.IO event handlers
 */
function setupSocketEvents(io) {
  // Store io instance in gameLogic for auto-start functionality
  const gameLogic = require('./gameLogic');
  
  // Save IO instance for game functions
  gameLogic.game.currentIo = io;
  console.log('Stored IO instance for game functions');
  
  // Create a game automatically on server start
  createGame();
  console.log('Game created automatically on server start');
  
  // Handle new socket connections
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    let playerName = null;
    let isInstructor = false;
    let isScreen = false;
    
    // Simple connection check handler
    socket.on('connection_check', (data, callback) => {
      // Just acknowledge receipt to confirm connection is working
      callback();
    });
    
    // Screen client connects
    socket.on('screen_connect', () => {
      try {
        console.log(`Screen connected: ${socket.id}`);
        
        // Mark this socket as a screen
        isScreen = true;
        socket.screen = true;
        socket.gameRole = 'screen';
        
        // Join a special room for screens
        socket.join('screens');
        
        // Send current game state if available
        const gameLogic = require('./gameLogic');
        if (gameLogic.game) {
          const stateData = {
            isGameRunning: gameLogic.game.isGameRunning,
            roundNumber: gameLogic.game.round,
            timeRemaining: gameLogic.game.timeRemaining
          };
          
          // If the game is running and a round is active, send more data
          if (gameLogic.game.isGameRunning && gameLogic.game.round >= CONSTANTS.FIRST_ROUND_NUMBER) {
            socket.emit('state_snapshot', stateData);
          }
        }
      } catch (error) {
        console.error('Error in screen_connect:', error);
        socket.emit('error', { message: 'Error connecting screen' });
      }
    });
    
    // Instructor connects
    socket.on('instructor_connect', (data) => {
      try {
        console.log(`Instructor connection attempt: ${socket.id}`);
        
        // Check if this is a reconnection with token
        const gameLogic = require('./gameLogic');
        const providedToken = data?.token || '';
        const validToken = gameLogic.game && gameLogic.game.instructorToken;
        
        // Either this is a brand new instructor connection (first one wins)
        // or this is a reconnection with a valid token
        const isValidReconnection = validToken && providedToken === validToken;
        const isFirstInstructor = !gameLogic.game.instructorSocket && !validToken;
        
        if (isValidReconnection || isFirstInstructor) {
          // Mark this socket as the instructor
          isInstructor = true;
          socket.instructor = true;
          socket.gameRole = 'instructor';
          
          // Join a special room for instructors
          socket.join('instructor');
          
          // Store this socket as the instructor socket - make sure to re-assign for reconnection
          if (isValidReconnection) {
            console.log(`Instructor reconnected with token. Updating socket ID from ${
              gameLogic.game.instructorSocket ? gameLogic.game.instructorSocket.id : 'null'
            } to ${socket.id}`);
          }
          gameLogic.game.instructorSocket = socket;
          
          // Generate a token if this is the first instructor
          if (!validToken) {
            // Create a secure random token
            const crypto = require('crypto');
            gameLogic.game.instructorToken = crypto.randomBytes(16).toString('hex');
          }
          
          // Send acknowledgment with token
          socket.emit('instructor_ack', { 
            success: true, 
            token: gameLogic.game.instructorToken,
            isReconnection: isValidReconnection
          });
          
          // Send game state if reconnecting
          if (isValidReconnection && gameLogic.game.isGameRunning) {
            console.log('Sending instructor snapshot after reconnection');
            sendInstructorSnapshot(socket, gameLogic);
          }
        } else {
          socket.emit('instructor_ack', { 
            success: false, 
            error: 'Not authorized as instructor'
          });
        }
      } catch (error) {
        console.error('Error in instructor_connect:', error);
        socket.emit('error', { message: 'Error connecting as instructor' });
      }
    });
    
    // Instructor creates a new game (keeping for backward compatibility)
    socket.on('create_game', () => {
      try {
        // Only recreate the game if necessary
        if (!gameLogic.game.instructorSocket) {
          createGame();
          isInstructor = true;
          
          // Store a direct reference to the instructor socket
          gameLogic.game.instructorSocket = socket;
          console.log(`Saved instructor socket with ID ${socket.id}`);
          
          // Map this socket to "instructor" role
          socket.instructor = true;
          socket.gameRole = 'instructor';
          
          console.log('Game created');
        }
        socket.emit('game_created');
        
        // Also notify screens
        io.to('screens').emit('game_created');
      } catch (error) {
        console.error('Error in create_game:', error);
        socket.emit('error', { message: 'Error creating game' });
      }
    });
    
    // Helper function to send instructor state snapshot
    function sendInstructorSnapshot(socket, gameLogic) {
      // Create a comprehensive snapshot of game state
      const gameSnapshot = createInstructorSnapshot(gameLogic);
      
      // Send the snapshot to just this instructor socket
      socket.emit('state_snapshot', gameSnapshot);
    }
    
    // Helper to create a complete instructor snapshot
    function createInstructorSnapshot(gameLogic) {
      const snapshot = {
        isGameRunning: gameLogic.game.isGameRunning,
        round: gameLogic.game.round,
        state: gameLogic.game.state,
        timeRemaining: gameLogic.game.timeRemaining || 0,
        roundActive: gameLogic.game.roundActive || false,
        players: []
      };
      
      // Add complete player information
      Object.entries(gameLogic.game.players).forEach(([name, player]) => {
        snapshot.players.push({
          playerName: name,
          capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
          output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
          submitted: player.investment !== null,
          investment: player.investment !== null ? 
            parseFloat(player.investment.toFixed(CONSTANTS.DECIMAL_PRECISION)) : null,
          connected: player.connected
        });
      });
      
      return snapshot;
    }
    
    // Instructor requests state snapshot
    socket.on('request_state_snapshot', () => {
      try {
        // Verify this is the instructor
        if (!isInstructor) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        const gameLogic = require('./gameLogic');
        sendInstructorSnapshot(socket, gameLogic);
      } catch (error) {
        console.error('Error in request_state_snapshot:', error);
        socket.emit('error', { message: 'Error fetching game state' });
      }
    });
    
    // Instructor starts the game
    socket.on('start_game', () => {
      try {
        if (!isInstructor) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        const result = startGame();
        
        if (result.success) {
          console.log('Game started');
          
          // Broadcast game started to all players and instructors
          io.emit('game_started');
          
          // Start the first round
          startRound(io);
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error in start_game:', error);
        socket.emit('error', { message: 'Error starting game' });
      }
    });
    
    // Student submits investment
    socket.on('submit_investment', ({ investment, isAutoSubmit }) => {
      try {
        console.log(`Received investment submission from socket ${socket.id} (role: ${socket.gameRole || 'unknown'})`);
        
        if (!playerName) {
          console.error(`Cannot process investment: No player name associated with socket ${socket.id}`);
          socket.emit('error', Errors.validation('Not in a game'));
          return;
        }
        
        console.log(`Processing investment from ${playerName}: ${investment}`);
        
        const gameLogic = require('./gameLogic');
        // Debug game state
        console.log('Game state:', {
          isGameRunning: gameLogic.game.isGameRunning,
          round: gameLogic.game.round,
          playerCount: Object.keys(gameLogic.game.players).length,
          hasInstructorSocket: !!gameLogic.game.instructorSocket
        });
        
        // Get the player's current game state
        const player = gameLogic.game.players[playerName];
        if (!player) {
          socket.emit('error', Errors.gameState('Player not found in game'));
          return;
        }
        
        // Use our shared validation
        const { validateInvestment } = require('../shared/gameUtils');
        const validation = validateInvestment(investment, {
          output: player.output
        });
        
        if (!validation.valid) {
          socket.emit('error', { message: validation.error });
          return;
        }
        
        // Use the validated value
        const result = gameLogic.submitInvestment(playerName, validation.value, isAutoSubmit);
        
        if (result.success) {
          console.log(`Investment submitted by ${playerName}: ${result.investment}${isAutoSubmit ? ' (auto-submitted)' : ''}`);
          socket.emit('investment_received', { investment: result.investment, isAutoSubmit });
          
          // Directly send to instructor socket if available
          if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
            try {
              // Verify the socket is still valid
              const instructorSocketId = gameLogic.game.instructorSocket.id;
              if (!instructorSocketId) {
                console.error('Instructor socket is invalid (no ID)');
                broadcastInvestment();
              } else if (!io.sockets.sockets.has(instructorSocketId)) {
                console.error(`Instructor socket ID ${instructorSocketId} not found in connected sockets`);
                broadcastInvestment();
              } else {
                console.log(`Sending investment_received directly to instructor socket ${instructorSocketId}`);
                
                // Log active connections for debugging
                try {
                  // This method is more compatible with newer Socket.IO versions
                  const roomSizes = {
                    players: io.sockets.adapter.rooms.get('players')?.size || 0,
                    instructor: io.sockets.adapter.rooms.get('instructor')?.size || 0,
                    screens: io.sockets.adapter.rooms.get('screens')?.size || 0
                  };
                  console.log(`Active connections by room: `, roomSizes);
                } catch (err) {
                  console.error('Error counting active connections:', err);
                }
                
                // Direct send to instructor
                gameLogic.game.instructorSocket.emit('investment_received', { 
                  playerName, 
                  investment: result.investment,
                  isAutoSubmit 
                });
                console.log('Successfully sent investment_received to instructor');
              }
            } catch (err) {
              console.error('Error sending to instructor socket:', err);
              broadcastInvestment();
            }
          } else {
            console.log('No instructor socket available, broadcasting investment');
            broadcastInvestment();
          }
          
          // Function to broadcast investment as fallback
          function broadcastInvestment() {
            console.log('Broadcasting investment_received to all clients');
            io.emit('investment_received', { 
              playerName, 
              investment: result.investment,
              isAutoSubmit
            });
          }
          
          // Also notify screens about the investment
          io.to('screens').emit('investment_received', {
            playerName,
            investment: result.investment,
            isAutoSubmit
          });
          
          // Check if the round should end (all players submitted)
          if (gameLogic.game.pendingEndRound) {
            console.log('All players have submitted - ending round immediately');
            
            // Prepare notification message
            const notificationData = { 
              message: 'All players have submitted their investments. Round ending early...',
              timeRemaining: 2 // Show message for 2 seconds
            };
            
            try {
              // Send notification to all students
              io.to('players').emit('all_submitted', notificationData);
              
              // Send notification to instructor if available
              if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
                try {
                  // Verify the socket is still valid
                  const instructorSocketId = gameLogic.game.instructorSocket.id;
                  if (!instructorSocketId) {
                    console.error('Instructor socket is invalid (no ID) for all_submitted');
                  } else if (!io.sockets.sockets.has(instructorSocketId)) {
                    console.error(`Instructor socket ID ${instructorSocketId} not found for all_submitted`);
                  } else {
                    gameLogic.game.instructorSocket.emit('all_submitted', notificationData);
                    console.log('Successfully sent all_submitted to instructor');
                  }
                } catch (err) {
                  console.error('Error sending all_submitted to instructor:', err);
                }
              }
              
              // Send notification to screens
              io.to('screens').emit('all_submitted', notificationData);
              
              // Clear timers safely
              try {
                if (gameLogic.game.roundTimer) {
                  clearTimeout(gameLogic.game.roundTimer);
                }
                if (gameLogic.game.timerInterval) {
                  clearInterval(gameLogic.game.timerInterval);
                }
              } catch (timerError) {
                console.error('Error clearing timers:', timerError);
              }
              
              // Add a slight delay before ending the round to allow for UI updates
              setTimeout(() => {
                try {
                  gameLogic.endRound(io);
                } catch (endRoundError) {
                  console.error('Error ending round:', endRoundError);
                }
              }, 2000);
            } catch (notificationError) {
              console.error('Error sending notifications:', notificationError);
            }
          } else if (result.allSubmitted) {
            // This could happen if multiple submissions come in at almost the same time
            console.log('This submission completed all required inputs - will end round shortly');
          }
          
          // Show validation message if investment was clamped
          if (validation.error) {
            socket.emit('notification', { message: validation.error, type: 'warning' });
          }
        } else {
          console.error(`Investment submission failed for ${playerName}:`, result.error);
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error in submit_investment:', error);
        socket.emit('error', { message: 'Error processing investment' });
      }
    });
    
    // Student joins a game
    socket.on('join_game', ({ playerName: name, isReconnect }) => {
      try {
        console.log(`[JOIN] Received join_game event. Data:`, { name, isReconnect, socketId: socket.id });
        
        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
          console.log(`[JOIN] Invalid player name: ${name}`);
          socket.emit('join_ack', { 
            success: false, 
            error: 'Invalid input' 
          });
          return;
        }
        
        playerName = name.trim();
        console.log(`[JOIN] Validated name: ${playerName}`);
        
        // Get game logic reference
        const gameLogic = require('./gameLogic');
        
        // Check if this is a reconnection scenario
        const playerExists = gameLogic.game && 
                             gameLogic.game.players && 
                             gameLogic.game.players[playerName];
        
        // Explicit reconnection requested or player exists
        const shouldReconnect = (isReconnect === true) || playerExists;
        
        console.log(`[JOIN] Player exists: ${playerExists}, shouldReconnect: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          console.log(`[JOIN] Handling player reconnection: ${playerName}`);
          handlePlayerReconnection(socket, playerName, gameLogic, io);
        } else {
          console.log(`[JOIN] Handling new player join: ${playerName}`);
          handleNewPlayerJoin(socket, playerName, io);
        }
      } catch (error) {
        console.error('[JOIN] Error in join_game:', error);
        socket.emit('join_ack', { 
          success: false, 
          error: 'Server error processing join request' 
        });
      }
    });
    
    // Helper for reconnection logic
    function handlePlayerReconnection(socket, playerName, gameLogic, io) {
      console.log(`Player ${playerName} reconnection attempt at ${new Date().toISOString()}`);
      
      // Use our new connection handler
      const connectionHandler = require('./connectionHandler');
      const result = connectionHandler.handlePlayerReconnection(io, socket, playerName, gameLogic);
      
      if (result.success) {
        // Send acknowledgment with reconnect flag
        socket.emit('join_ack', { 
          ...result,
          isReconnect: true
        });
        
        // Also send game_joined for client compatibility
        socket.emit('game_joined', {
          playerName: playerName,
          initialCapital: result.capital,
          initialOutput: result.output
        });
        
        // Send current game state to the player
        sendPlayerStateSnapshot(socket, result, gameLogic);
        
        // Notify others about reconnection
        notifyAboutReconnection(socket, playerName, io);
      } else {
        // Failed to reconnect
        socket.emit('join_ack', result);
      }
    }
    
    // Helper for new player join logic
    function handleNewPlayerJoin(socket, playerName, io) {
      console.log(`[JOIN] New player joining: ${playerName}`);
      
      // Normal join flow for new players
      console.log(`[JOIN] Adding player ${playerName} to game`);
      const result = addPlayer(playerName, socket.id, io);
      console.log(`[JOIN] addPlayer result:`, result);
      
      if (result.success) {
        // Track this socket using our new playerManager
        console.log(`[JOIN] Tracking socket ${socket.id} for player ${playerName}`);
        playerManager.trackPlayerSocket(socket.id, playerName);
        
        // Set socket properties
        socket.playerName = playerName;
        socket.gameRole = 'player';
        
        // Join the players room
        console.log(`[JOIN] Adding socket to 'players' room`);
        socket.join('players');
        
        // Send acknowledgment
        console.log(`[JOIN] Sending join_ack success to ${socket.id}`);
        socket.emit('join_ack', { 
          success: true,
          isReconnect: false
        });
        
        // Announce to the player they've joined successfully
        console.log(`[JOIN] Sending game_joined to ${socket.id}`);
        socket.emit('game_joined', {
          playerName: playerName,
          initialCapital: result.initialCapital,
          initialOutput: result.initialOutput
        });
        
        // Notify others about this new player
        console.log(`[JOIN] Notifying screens and instructor about new player`);
        io.to('screens').emit('player_joined', { 
          playerName,
          isReconnect: false
        });
        
        // Notify instructor if available
        if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
          gameLogic.game.instructorSocket.emit('player_joined', {
            playerName,
            isReconnect: false
          });
        }
      } else {
        console.log(`[JOIN] Failed to add player ${playerName}: ${result.error}`);
        socket.emit('join_ack', result);
      }
    }
    
    // Send state snapshot to reconnected player
    function sendPlayerStateSnapshot(socket, playerState, gameLogic) {
      // Check for successful reconnection and valid game state
      if (playerState.success) {
        // Send snapshot with all needed info
        socket.emit('state_snapshot', {
          roundNumber: playerState.roundNumber,
          capital: playerState.capital,
          output: playerState.output,
          submitted: playerState.lastInvestment !== null,
          timeRemaining: playerState.timeRemaining || 0,
          gameState: playerState.gameState,
          lastInvestment: playerState.lastInvestment,
          isGameRunning: gameLogic.game.isGameRunning
        });
      }
    }
    
    // Notify other clients about reconnection
    function notifyAboutReconnection(socket, playerName, io) {
      console.log(`Notifying others about player ${playerName} reconnection`);
      
      // Notify screens
      socket.to('screens').emit('player_joined', { 
        playerName,
        isReconnect: true
      });
      
      // Notify instructor - get a fresh reference to ensure we have the latest
      const gameLogic = require('./gameLogic');
      
      // If instructor socket exists, try to notify
      if (gameLogic.game.instructorSocket) {
        try {
          console.log(`Attempting to notify instructor about ${playerName} reconnection`);
          // Check if socket is connected before emitting
          if (io.sockets.sockets.has(gameLogic.game.instructorSocket.id)) {
            gameLogic.game.instructorSocket.emit('player_joined', { 
              playerName,
              isReconnect: true
            });
            console.log(`Successfully notified instructor about ${playerName} reconnection`);
          } else {
            console.log('Instructor socket exists but not in connected sockets list');
          }
        } catch (err) {
          console.error('Error notifying instructor about player reconnection:', err);
        }
      } else {
        console.log('No instructor socket available to notify about reconnection');
      }
    }
    
    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        console.log(`Disconnected: ${socket.id}`);
        
        // Use our new connection handler for player disconnection
        const connectionHandler = require('./connectionHandler');
        connectionHandler.handlePlayerDisconnection(io, socket.id, require('./gameLogic'));
        
        // Check if this was the instructor socket
        const gameLogic = require('./gameLogic');
        if (isInstructor && gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.id === socket.id) {
          console.log('Instructor disconnected');
          // Don't clear the instructor socket, just mark as disconnected
          // This way we can still keep track of which socket is the instructor
          if (gameLogic.game.instructorSocket) {
            gameLogic.game.instructorSocket.connected = false;
            console.log('Instructor socket marked as disconnected, waiting for reconnect');
          }
        }
        
        // Handle screen disconnect
        if (isScreen) {
          console.log('Screen disconnected');
          io.emit('screen_disconnected');
        }
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });
    
    // Add support for state snapshot requests
    socket.on('request_state_snapshot', (data) => {
      try {
        const playerName = data.playerName;
        if (!playerName) return;
        
        console.log(`State snapshot requested for ${playerName}`);
        
        const gameLogic = require('./gameLogic');
        
        // Check if this player exists
        if (gameLogic.game && 
            gameLogic.game.players && 
            gameLogic.game.players[playerName]) {
          
          // Create a state snapshot for this player
          const player = gameLogic.game.players[playerName];
          
          // Send the current state
          const snapshot = {
            roundNumber: gameLogic.game.round,
            capital: parseFloat(player.capital.toFixed(CONSTANTS.DECIMAL_PRECISION)),
            output: parseFloat(player.output.toFixed(CONSTANTS.DECIMAL_PRECISION)),
            submitted: player.investment !== null,
            timeRemaining: gameLogic.game.timeRemaining || 0,
            gameState: gameLogic.game.roundActive ? 'active' : 'results',
            lastInvestment: player.lastInvestment !== undefined 
              ? parseFloat(player.lastInvestment.toFixed(CONSTANTS.DECIMAL_PRECISION)) 
              : null
          };
          
          socket.emit('state_snapshot', snapshot);
        }
      } catch (error) {
        console.error('Error handling state snapshot request:', error);
      }
    });
  });
}

module.exports = { setupSocketEvents }; 