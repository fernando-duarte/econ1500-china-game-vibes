// /modules/screen/socket.js

// Expose socket functionality through window object
window.screenSocket = {};

// Connect to Socket.IO server
const socket = io();

// Initialize socket connection
window.screenSocket.init = function() {
  // Debug socket connection
  socket.on(CONSTANTS.SOCKET.EVENT_CONNECT, () => {
    console.log('Screen connected to server with socket ID:', socket.id);
    // Announce this client as a screen
    socket.emit('screen_connect');
    window.screenDOM.addEvent('connect', 'Connected to server');
  });

  // Socket event handlers
  socket.on(CONSTANTS.SOCKET.EVENT_DISCONNECT, () => {
    console.log('Disconnected from server');
    window.screenDOM.elements.gameStatus.textContent = 'Disconnected';
    window.screenDOM.addEvent('disconnect', 'Disconnected from server', true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, (data) => {
    console.log('Player joined:', data);

    // Add player to the list
    window.screenGame.addPlayer(data.playerName);

    // Update player list
    window.screenDOM.updatePlayerList();

    // Log event with appropriate message for join or reconnect
    const eventType = data.isReconnect ? 'player_reconnected' : 'player_joined';
    const message = data.isReconnect ? 
      `Player ${data.playerName} reconnected` : 
      `Player ${data.playerName} joined`;
    window.screenDOM.addEvent(eventType, message);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_GAME_CREATED, () => {
    console.log('Game created');
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_PLAYERS;
    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.WAITING);

    // Reset state
    window.screenGame.resetForNewGame();

    // Update display
    window.screenDOM.updatePlayerList();
    window.screenDOM.updateAverages();

    // Log event
    window.screenDOM.addEvent('game_created', 'Game has been created', true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
    console.log('Game started');
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTING;
    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);

    // Reset for new game
    window.screenGame.resetForNewRound();

    // Set initial round number to 1 when the game starts
    window.screenDOM.elements.roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;

    // Update display
    window.screenDOM.updatePlayerList();

    // Log event
    window.screenDOM.addEvent('game_started', 'Game has started', true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
    console.log('Round started:', data);

    // Update round number
    window.screenDOM.elements.roundNumber.textContent = data.roundNumber;

    // Update game status
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;

    // Reset submitted players for this round
    window.screenGame.resetForNewRound();

    // Initialize timer with the server's time remaining
    window.screenDOM.elements.timer.textContent = data.timeRemaining;

    // Update display
    window.screenDOM.updatePlayerList();

    // Log event
    window.screenDOM.addEvent('round_start', `Round ${data.roundNumber} started`, true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
    console.log('Investment received:', data);

    // Make sure we have the data we need
    if (!data || !data.playerName) {
      return;
    }

    // Record the investment
    window.screenGame.recordInvestment(data.playerName, data.investment, data.isAutoSubmit);

    // Update display
    window.screenDOM.updatePlayerList();

    // Log event
    const autoText = data.isAutoSubmit ? ' (auto-submitted)' : '';
    window.screenDOM.addEvent('investment', `${data.playerName} invested ${data.investment}${autoText}`);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
    console.log('All students have submitted:', data);

    // Update game status
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;

    // Log event
    window.screenDOM.addEvent('all_submitted', data.message, true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY, (data) => {
    console.log('Round summary:', data);

    // Get the next round number (making sure not to exceed max rounds)
    const nextRound = Math.min(data.roundNumber + 1, CONSTANTS.ROUNDS);

    // Update round number - making sure not to exceed max rounds
    window.screenDOM.elements.roundNumber.textContent = nextRound;

    // Update game status
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.ROUND_COMPLETED_FORMAT.replace('{0}', data.roundNumber);

    // Reset timer display
    window.screenDOM.elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;

    // Update capital and output values
    window.screenGame.updateCapitalAndOutput(data.results);

    // Update averages
    window.screenDOM.updateAverages();

    // Log event
    window.screenDOM.addEvent('round_end', `Round ${data.roundNumber} completed`, true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
    console.log('Game over:', data);

    // Ensure round number shows the final round
    window.screenDOM.elements.roundNumber.textContent = CONSTANTS.ROUNDS;

    // Update game status
    window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.COMPLETED);

    // Clear timer
    clearInterval(window.screenGame.getState().timerInterval);
    window.screenDOM.elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;

    // Log event
    window.screenDOM.addEvent('game_over', `Game over! Winner: ${data.winner}`, true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT, (data) => {
    console.log('Received state snapshot:', data);

    // Update round number
    if (data.roundNumber) {
      window.screenDOM.elements.roundNumber.textContent = data.roundNumber;
    }

    // Update game status based on round
    if (data.roundNumber >= CONSTANTS.FIRST_ROUND_NUMBER) {
      window.screenDOM.elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    }

    // If there's time remaining, initialize timer display
    if (data.timeRemaining) {
      window.screenDOM.elements.timer.textContent = data.timeRemaining;
    }
  });

  socket.on(CONSTANTS.SOCKET.EVENT_TIMER_UPDATE, (data) => {
    // Update timer display with the server's time
    window.screenDOM.elements.timer.textContent = data.timeRemaining;
  });

  socket.on(CONSTANTS.SOCKET.EVENT_INSTRUCTOR_DISCONNECTED, () => {
    console.log('Instructor disconnected from server');
    window.screenDOM.addEvent('instructor_disconnected', 'Instructor disconnected from server', true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED, (data) => {
    console.log('Player disconnected:', data.playerName);
    window.screenDOM.addEvent('player_disconnected', `Player ${data.playerName} disconnected`, true);
  });

  socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
    console.error('Socket error:', data.message);
    window.screenDOM.addEvent('error', `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`, true);
  });
}; 