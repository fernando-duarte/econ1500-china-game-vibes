// Connect to Socket.IO server
const socket = io();

// Debug socket connection
socket.on(CONSTANTS.SOCKET.EVENT_CONNECT, () => {
  console.log('Screen connected to server with socket ID:', socket.id);
  // Announce this client as a screen
  socket.emit('screen_connect');
  addEvent('connect', 'Connected to server');
});

// DOM Elements
const gameStatus = document.getElementById('gameStatus');
const roundNumber = document.getElementById('roundNumber');
const totalRounds = document.getElementById('totalRounds');
const timer = document.getElementById('timer');
const eventLog = document.getElementById('eventLog');
const playerList = document.getElementById('playerList');
const playerCount = document.getElementById('playerCount');
const submissionCount = document.getElementById('submissionCount');
const avgCapital = document.getElementById('avgCapital');
const avgOutput = document.getElementById('avgOutput');

// Initialize values from constants
document.addEventListener('DOMContentLoaded', () => {
  if (CONSTANTS && CONSTANTS.ROUNDS) {
    totalRounds.textContent = CONSTANTS.ROUNDS;
  }
});

// Game state
let players = [];
let submittedPlayers = [];
let autoSubmittedPlayers = [];
let roundInvestments = {};
let gameState = 'waiting';
let timerInterval = null;
let capitalValues = [];
let outputValues = [];

// Helper function to add an event to the log
function addEvent(type, message, highlight = false) {
  const eventElement = document.createElement('div');
  eventElement.classList.add('event');
  if (highlight) {
    eventElement.classList.add('highlight');
  }

  // Format timestamp
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  eventElement.innerHTML = `
    <div class="event-time">${timeString}</div>
    <div class="event-message">${message}</div>
  `;

  // Add the event to the top of the log
  eventLog.insertBefore(eventElement, eventLog.firstChild);

  // Auto-scroll to the top
  eventLog.scrollTop = 0;

  // Cleanup old events if there are too many
  if (eventLog.children.length > CONSTANTS.MAX_EVENT_LOG_SIZE) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

// Helper function to update player list
function updatePlayerList() {
  // Clear existing player list
  playerList.innerHTML = '';

  // Update player count
  playerCount.textContent = players.length;

  // Update submission count
  submissionCount.textContent = `${submittedPlayers.length}/${players.length}`;

  // Add all players to the list
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add(CONSTANTS.CSS.PLAYER_ITEM);

    const isSubmitted = submittedPlayers.includes(player);
    const isAutoSubmitted = autoSubmittedPlayers.includes(player);

    // Add submitted class if the player has submitted their investment
    if (isSubmitted) {
      playerElement.classList.add(CONSTANTS.CSS.PLAYER_SUBMITTED);

      // Add auto-submitted class if the player's investment was auto-submitted
      if (isAutoSubmitted) {
        playerElement.classList.add(CONSTANTS.CSS.PLAYER_AUTO_SUBMITTED);
        playerElement.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
      }
    }

    // Add player name
    playerElement.textContent = player;

    playerList.appendChild(playerElement);
  });
}

// Helper function to calculate averages
function updateAverages() {
  // Calculate average capital
  if (capitalValues.length > 0) {
    const total = capitalValues.reduce((sum, value) => sum + parseFloat(value), 0);
    const average = total / capitalValues.length;
    avgCapital.textContent = average.toFixed(CONSTANTS.DECIMAL_PRECISION);
  }

  // Calculate average output
  if (outputValues.length > 0) {
    const total = outputValues.reduce((sum, value) => sum + parseFloat(value), 0);
    const average = total / outputValues.length;
    avgOutput.textContent = average.toFixed(CONSTANTS.DECIMAL_PRECISION);
  }
}

// Helper function to start timer
function startTimer(seconds) {
  // Set initial time
  timer.textContent = seconds;
}

// Socket event handlers
socket.on(CONSTANTS.SOCKET.EVENT_DISCONNECT, () => {
  console.log('Disconnected from server');
  gameStatus.textContent = 'Disconnected';
  addEvent('disconnect', 'Disconnected from server', true);
});

socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, (data) => {
  console.log('Player joined:', data);

  // Add player to the list if not already there
  if (!players.includes(data.playerName)) {
    players.push(data.playerName);
  }

  // Update player list
  updatePlayerList();

  // Log event
  addEvent('player_joined', `Player joined: ${data.playerName}`);
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_CREATED, () => {
  console.log('Game created');
  gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_PLAYERS;
  gameState = CONSTANTS.GAME_STATES.WAITING;

  // Reset state
  players = [];
  submittedPlayers = [];
  autoSubmittedPlayers = [];
  roundInvestments = {};
  capitalValues = [];
  outputValues = [];

  // Update display
  updatePlayerList();
  updateAverages();

  // Log event
  addEvent('game_created', 'Game has been created', true);
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
  console.log('Game started');
  gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTING;
  gameState = CONSTANTS.GAME_STATES.ACTIVE;

  // Reset for new game
  submittedPlayers = [];
  autoSubmittedPlayers = [];
  roundInvestments = {};

  // Set initial round number to 1 when the game starts
  roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;

  // Update display
  updatePlayerList();

  // Log event
  addEvent('game_started', 'Game has started', true);
});

socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
  console.log('Round started:', data);

  // Update round number
  roundNumber.textContent = data.roundNumber;

  // Update game status
  gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;

  // Reset submitted players for this round
  submittedPlayers = [];
  autoSubmittedPlayers = [];
  roundInvestments = {};

  // Initialize timer with the server's time remaining
  timer.textContent = data.timeRemaining;

  // Update display
  updatePlayerList();

  // Log event
  addEvent('round_start', `Round ${data.roundNumber} started`, true);
});

socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
  console.log('Investment received:', data);

  // Make sure we have the data we need
  if (!data || !data.playerName) {
    return;
  }

  // Store the investment
  if (data.investment !== undefined) {
    roundInvestments[data.playerName] = {
      investment: data.investment,
      isAutoSubmit: data.isAutoSubmit || false
    };
  }

  // Mark player as submitted
  if (!submittedPlayers.includes(data.playerName)) {
    submittedPlayers.push(data.playerName);

    // Track auto-submitted investments
    if (data.isAutoSubmit) {
      autoSubmittedPlayers.push(data.playerName);
    }
  }

  // Update display
  updatePlayerList();

  // Log event
  const autoText = data.isAutoSubmit ? ' (auto-submitted)' : '';
  addEvent('investment', `${data.playerName} invested ${data.investment}${autoText}`);
});

socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
  console.log('All students have submitted:', data);

  // Update game status
  gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;

  // Log event
  addEvent('all_submitted', data.message, true);
});

socket.on(CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY, (data) => {
  console.log('Round summary:', data);

  // Get the next round number (making sure not to exceed max rounds)
  const nextRound = Math.min(data.roundNumber + 1, CONSTANTS.ROUNDS);

  // Update round number - making sure not to exceed max rounds
  roundNumber.textContent = nextRound;

  // Update game status
  gameStatus.textContent = CONSTANTS.UI_TEXT.ROUND_COMPLETED_FORMAT.replace('{0}', data.roundNumber);

  // Reset timer display
  timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;

  // Collect capital and output values for averaging
  capitalValues = [];
  outputValues = [];
  data.results.forEach(result => {
    capitalValues.push(result.newCapital);
    outputValues.push(result.newOutput);
  });

  // Update averages
  updateAverages();

  // Log event
  addEvent('round_end', `Round ${data.roundNumber} completed`, true);
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
  console.log('Game over:', data);

  // Ensure round number shows the final round
  roundNumber.textContent = CONSTANTS.ROUNDS;

  // Update game status
  gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
  gameState = CONSTANTS.GAME_STATES.COMPLETED;

  // Clear timer
  clearInterval(timerInterval);
  timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;

  // Log event
  addEvent('game_over', `Game over! Winner: ${data.winner}`, true);
});

socket.on(CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT, (data) => {
  console.log('Received state snapshot:', data);

  // Update round number
  if (data.roundNumber) {
    roundNumber.textContent = data.roundNumber;
  }

  // Update game status based on round
  if (data.roundNumber > 0) {
    gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
    gameState = CONSTANTS.GAME_STATES.ACTIVE;
  }

  // If there's time remaining, initialize timer display
  if (data.timeRemaining) {
    timer.textContent = data.timeRemaining;
  }
});

// Add handler for timer updates from the server
socket.on(CONSTANTS.SOCKET.EVENT_TIMER_UPDATE, (data) => {
  // Update timer display with the server's time
  timer.textContent = data.timeRemaining;
});

socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
  console.error('Socket error:', data.message);
  addEvent('error', `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`, true);
});

// Add initial event when page loads
addEvent('init', 'Screen dashboard initialized', true);

// Initialize game status text
gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME;