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
  // Handle new socket connections
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    let playerName = null;
    let isInstructor = false;
    let isScreen = false;
    
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
            round: gameLogic.game.round
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
    
    // Instructor creates a new game
    socket.on('create_game', () => {
      try {
        createGame();
        isInstructor = true;
        
        // Store a direct reference to the instructor socket
        const gameLogic = require('./gameLogic');
        gameLogic.game.instructorSocket = socket;
        console.log(`Saved instructor socket with ID ${socket.id} in ${typeof gameLogic.game.instructorSocket}`);
        
        // Map this socket to "instructor" role
        socket.instructor = true;
        socket.gameRole = 'instructor';
        
        console.log('Game created');
        socket.emit('game_created');
        
        // Also notify screens
        io.to('screens').emit('game_created');
      } catch (error) {
        console.error('Error in create_game:', error);
        socket.emit('error', { message: 'Error creating game' });
      }
    });
    
    // Student joins a game
    socket.on('join_game', ({ playerName: name }) => {
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
        
        // Try to add the player to the game
        const result = addPlayer(playerName, socket.id);
        
        if (result.success) {
          // Join the players room
          socket.join('players');
          
          // Mark this socket as a student
          socket.student = true;
          socket.gameRole = 'student';
          socket.playerName = playerName;
          
          console.log(`Player joined: ${playerName} with socket ID ${socket.id}`);
          
          // Notify all players about the new player
          io.to('players').emit('player_joined', { playerName });
          
          // Notify instructor directly if available
          const gameLogic = require('./gameLogic');
          if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
            console.log(`Sending player_joined directly to instructor socket ${gameLogic.game.instructorSocket.id}`);
            gameLogic.game.instructorSocket.emit('player_joined', { playerName });
          } else {
            console.log('No instructor socket available for player_joined notification');
          }
          
          // Also notify screens
          io.to('screens').emit('player_joined', { playerName });
        }
        
        // Send acknowledgment to the client
        socket.emit('join_ack', result);
      } catch (error) {
        console.error('Error in join_game:', error);
        socket.emit('join_ack', { 
          success: false, 
          error: 'Server error joining game' 
        });
      }
    });
    
    // Handle reconnection with existing name
    socket.on('reconnect_game', ({ playerName: name }) => {
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
        
        // Try to reconnect the player
        const result = playerReconnect(playerName, socket.id);
        
        if (result.success) {
          // Join the players room
          socket.join('players');
          
          console.log(`Player reconnected: ${playerName}`);
          
          // Send current game state to the player
          if (result.isGameRunning && result.round >= CONSTANTS.FIRST_ROUND_NUMBER) {
            socket.emit('state_snapshot', {
              roundNumber: result.round,
              capital: result.capital,
              output: result.output,
              submitted: result.submitted,
              timeRemaining: null // Server doesn't track exact time remaining
            });
          }
          
          // Also notify screens about reconnection
          io.to('screens').emit('player_joined', { 
            playerName,
            isReconnect: true
          });
        }
        
        // Send acknowledgment to the client
        socket.emit('join_ack', result);
      } catch (error) {
        console.error('Error in reconnect_game:', error);
        socket.emit('join_ack', { 
          success: false, 
          error: 'Server error reconnecting to game' 
        });
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
          
          // Directly send to instructor socket
          if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
            try {
              // Verify the socket is still valid
              const instructorSocketId = gameLogic.game.instructorSocket.id;
              if (!instructorSocketId) {
                console.error('Instructor socket is invalid (no ID)');
              } else {
                console.log(`Sending investment_received directly to instructor socket ${instructorSocketId}`);
                
                // Log active connections for debugging
                const activeSockets = Object.keys(io.sockets.sockets).length;
                console.log(`Active socket connections: ${activeSockets}`);
                
                // Direct send to instructor - removed redundant test broadcast
                gameLogic.game.instructorSocket.emit('investment_received', { 
                  playerName, 
                  investment: result.investment,
                  isAutoSubmit 
                });
                console.log('Successfully sent investment_received to instructor');
              }
            } catch (err) {
              console.error('Error sending to instructor socket:', err);
            }
          } else {
            console.error('Cannot notify instructor: No valid instructor socket reference found');
            // Fallback to broadcasting
            console.log('Broadcasting investment_received as fallback');
            io.emit('investment_received', { 
              playerName, 
              investment: result.investment,
              isAutoSubmit,
              isFallback: true
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
            
            // Send notification to all students
            io.to('players').emit('all_submitted', notificationData);
            
            // Send notification to instructor if available
            if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
              gameLogic.game.instructorSocket.emit('all_submitted', notificationData);
            }
            
            // Send notification to screens
            io.to('screens').emit('all_submitted', notificationData);
            
            // Add a slight delay before ending the round to allow for UI updates
            setTimeout(() => {
              gameLogic.endRound(io);
            }, 2000);
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