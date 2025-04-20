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
    
    // Check if connection is from instructor page
    const isInstructorPage = socket.handshake.headers.referer && 
                            socket.handshake.headers.referer.endsWith('/instructor');
    
    // Automatically set up instructor socket if it's from instructor page
    if (isInstructorPage) {
      isInstructor = true;
      
      // Store a direct reference to the instructor socket if not already set
      if (!gameLogic.game.instructorSocket) {
        gameLogic.game.instructorSocket = socket;
        console.log(`Saved instructor socket with ID ${socket.id}`);
      }
      
      // Map this socket to "instructor" role
      socket.instructor = true;
      socket.gameRole = 'instructor';
      
      // Notify the instructor client that a game is already created
      socket.emit('game_created');
    }
    
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
      } catch (error) {
        console.error('Error in create_game:', error);
        socket.emit('error', { message: 'Error creating game' });
      }
    });
    
    // Student joins a game
    socket.on('join_game', ({ playerName: name }) => {
      try {
        if (!name) {
          socket.emit('error', { message: 'Player name is required' });
          return;
        }

        // Assign to the outer scope variable
        playerName = name.trim();

        // Store player name and role on socket
        socket.playerName = playerName;
        socket.gameRole = 'player';
        socket.join('players');

        console.log(`Player ${playerName} attempting to join`);

        // Use the io instance from the outer scope
        const result = addPlayer(playerName, socket.id, io); // Pass io here

        if (result.success) {
          console.log(`Player joined: ${playerName} with socket ID ${socket.id}`);
          socket.emit('game_joined', {
            playerName: playerName,
            initialCapital: result.initialCapital,
            initialOutput: result.initialOutput,
            isGameRunning: gameLogic.game.isGameRunning,
            round: gameLogic.game.round,
            autoStart: result.autoStart
          });

          // Send player_joined directly to instructor if available
          if (gameLogic.game.instructorSocket && gameLogic.game.instructorSocket.connected) {
            console.log(`Sending player_joined directly to instructor socket ${gameLogic.game.instructorSocket.id}`);
            gameLogic.game.instructorSocket.emit('player_joined', {
              playerName: playerName,
              initialCapital: result.initialCapital,
              initialOutput: result.initialOutput
            });
          } else {
            console.warn('Cannot send player_joined to instructor: No valid instructor socket.');
            // Optional: Broadcast to instructor room as fallback, though direct is preferred
            // io.to('instructor').emit('player_joined', { ... });
          }
        } else {
          console.error(`Player join failed for ${playerName}:`, result.error);
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error in join_game:', error);
        socket.emit('error', { message: 'Error joining game' });
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
        
        // Mark player as disconnected
        playerDisconnect(socket.id);
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });
  });
}

module.exports = { setupSocketEvents }; 