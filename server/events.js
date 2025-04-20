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
          
          // Store this socket as the instructor socket
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
          socket.emit('error', { message: 'Not in a game' });
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
        
        const result = gameLogic.submitInvestment(playerName, investment, isAutoSubmit);
        
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
                gameLogic.game.instructorSocket.emit('all_submitted', notificationData);
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
        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
          socket.emit('join_ack', { 
            success: false, 
            error: 'Invalid input' 
          });
          return;
        }
        
        playerName = name.trim();
        
        // Get game logic reference
        const gameLogic = require('./gameLogic');
        
        // Check if this is a reconnection scenario
        const playerExists = gameLogic.game && 
                             gameLogic.game.players && 
                             gameLogic.game.players[playerName];
        
        // Explicit reconnection requested or player exists
        const shouldReconnect = (isReconnect === true) || playerExists;
        
        if (shouldReconnect) {
          handlePlayerReconnection(socket, playerName, gameLogic, io);
        } else {
          handleNewPlayerJoin(socket, playerName, io);
        }
      } catch (error) {
        console.error('Error in join_game:', error);
        socket.emit('join_ack', { 
          success: false, 
          error: 'Server error processing join request' 
        });
      }
    });
    
    // Helper for reconnection logic
    function handlePlayerReconnection(socket, playerName, gameLogic, io) {
      console.log(`Player ${playerName} reconnection attempt`);
      
      // Attempt to reconnect the player
      const result = gameLogic.playerReconnect(socket.id, playerName);
      
      if (result.success) {
        // Join the players room
        socket.join('players');
        
        console.log(`Player reconnected: ${playerName}`);
        
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
      console.log(`New player joining: ${playerName}`);
      
      // Normal join flow for new players
      const result = addPlayer(playerName, socket.id, io);
      
      if (result.success) {
        // Join the players room
        socket.join('players');
        
        // Send acknowledgment
        socket.emit('join_ack', { 
          success: true,
          isReconnect: false
        });
        
        // Announce to the player they've joined successfully
        socket.emit('game_joined', {
          playerName: playerName,
          initialCapital: result.initialCapital,
          initialOutput: result.initialOutput
        });
        
        // Existing notification code...
      } else {
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
      // Notify screens
      socket.to('screens').emit('player_joined', { 
        playerName,
        isReconnect: true
      });
      
      // Notify instructor
      const gameLogic = require('./gameLogic');
      if (gameLogic.game.instructorSocket && 
          gameLogic.game.instructorSocket.connected) {
        gameLogic.game.instructorSocket.emit('player_joined', { 
          playerName,
          isReconnect: true
        });
      }
    }
    
    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        console.log(`Disconnected: ${socket.id}`);
        
        // Check if this was the instructor socket
        const gameLogic = require('./gameLogic');
        if (isInstructor && gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.id === socket.id) {
          console.log('Instructor disconnected');
          gameLogic.game.instructorSocket = null;
        }
        
        // Handle screen disconnect
        if (isScreen) {
          console.log('Screen disconnected');
        }
        
        // Mark player as disconnected
        playerDisconnect(socket.id);
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });
  });
}

module.exports = { setupSocketEvents }; 