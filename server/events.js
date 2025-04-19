const {
  createGame,
  addPlayer,
  startGame,
  startRound,
  submitInvestment,
  playerReconnect,
  playerDisconnect
} = require('./gameLogic');

/**
 * Set up Socket.IO event handlers
 */
function setupSocketEvents(io) {
  // Handle new socket connections
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    let gameCode = null;
    let playerName = null;
    let isInstructor = false;
    
    // Instructor creates a new game
    socket.on('create_game', () => {
      gameCode = createGame();
      isInstructor = true;
      
      // Join the instructor room
      socket.join(gameCode + '_instructor');
      
      console.log(`Game created: ${gameCode}`);
      socket.emit('game_created', { code: gameCode });
    });
    
    // Student joins a game
    socket.on('join_game', ({ code, playerName: name }) => {
      // Validate input
      if (!code || !name || typeof name !== 'string' || name.trim() === '') {
        socket.emit('join_ack', { 
          success: false, 
          error: 'Invalid input' 
        });
        return;
      }
      
      gameCode = code;
      playerName = name.trim();
      
      // Try to add the player to the game
      const result = addPlayer(gameCode, playerName, socket.id);
      
      if (result.success) {
        // Join the game room
        socket.join(gameCode);
        
        console.log(`Player joined: ${playerName} in game ${gameCode}`);
        
        // Notify all clients about the new player
        io.to(gameCode).emit('player_joined', { playerName });
        io.to(gameCode + '_instructor').emit('player_joined', { playerName });
      }
      
      // Send acknowledgment to the client
      socket.emit('join_ack', result);
    });
    
    // Handle reconnection with existing name
    socket.on('reconnect_game', ({ code, playerName: name }) => {
      // Validate input
      if (!code || !name || typeof name !== 'string' || name.trim() === '') {
        socket.emit('join_ack', { 
          success: false, 
          error: 'Invalid input' 
        });
        return;
      }
      
      gameCode = code;
      playerName = name.trim();
      
      // Try to reconnect the player
      const result = playerReconnect(gameCode, playerName, socket.id);
      
      if (result.success) {
        // Join the game room
        socket.join(gameCode);
        
        console.log(`Player reconnected: ${playerName} in game ${gameCode}`);
        
        // Send current game state to the player
        if (result.isGameRunning && result.round > 0) {
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
    });
    
    // Instructor starts the game
    socket.on('start_game', () => {
      if (!gameCode || !isInstructor) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }
      
      const result = startGame(gameCode);
      
      if (result.success) {
        console.log(`Game started: ${gameCode}`);
        io.to(gameCode).emit('game_started');
        startRound(gameCode, io);
      } else {
        socket.emit('error', { message: result.error });
      }
    });
    
    // Student submits investment
    socket.on('submit_investment', ({ investment }) => {
      if (!gameCode || !playerName) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }
      
      const result = submitInvestment(gameCode, playerName, investment);
      
      if (result.success) {
        console.log(`Investment submitted by ${playerName}: ${result.investment}`);
        socket.emit('investment_received', { investment: result.investment });
        
        // Optionally, notify the instructor
        io.to(gameCode + '_instructor').emit('investment_received', { playerName });
      } else {
        socket.emit('error', { message: result.error });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      
      // Mark player as disconnected
      playerDisconnect(socket.id);
    });
  });
}

module.exports = { setupSocketEvents }; 