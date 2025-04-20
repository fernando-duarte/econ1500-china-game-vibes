// Connect to Socket.IO server
const socket = io();

// Debug socket connection
socket.on(CONSTANTS.SOCKET.EVENT_CONNECT, () => {
  console.log('Instructor connected to server with socket ID:', socket.id);
});

// DOM Elements
const gameStatus = document.getElementById('gameStatus');
const playerCount = document.getElementById('playerCount');
const gameControls = document.getElementById('gameControls');
const playerListSection = document.getElementById('playerListSection');
const playerList = document.getElementById('playerList');
const roundNumber = document.getElementById('roundNumber');
const totalRounds = document.getElementById('totalRounds');
const roundStatus = document.getElementById('roundStatus');
const currentInvestmentsSection = document.getElementById('currentInvestmentsSection');
const currentInvestmentsBody = document.getElementById('currentInvestmentsBody');
const roundResultsSection = document.getElementById('roundResultsSection');
const roundResultsBody = document.getElementById('roundResultsBody');
const gameOverSection = document.getElementById('gameOverSection');
const winnerName = document.getElementById('winnerName');
const finalResultsBody = document.getElementById('finalResultsBody');
const resetGameButton = document.getElementById('resetGameButton');
const roundTimer = document.getElementById('roundTimer');
const forceEndGameButton = document.getElementById('forceEndGameButton');
const startGameButton = document.getElementById('startGameButton');
const manualStartToggle = document.getElementById('manualStartToggle');
const manualStartStatus = document.getElementById('manualStartStatus');
const gameSetup = document.getElementById('gameSetup');

// --- Local Constants ---
// Now defined in shared/constants.js as CONSTANTS.INVESTMENTS_TABLE_COLUMN_COUNT

// Initialize values from constants
document.addEventListener('DOMContentLoaded', () => {
  totalRounds.textContent = CONSTANTS.ROUNDS;

  // Debug DOM elements
  console.log('DOM Elements check:');
  console.log('currentInvestmentsSection found:', !!currentInvestmentsSection);
  console.log('currentInvestmentsBody found:', !!currentInvestmentsBody);

  // Style check
  console.log('currentInvestmentsSection classes:', currentInvestmentsSection.className);
});

// Game state
let players = [];
let submittedPlayers = [];
let autoSubmittedPlayers = [];
let currentRoundInvestments = {};

// Reset the game
resetGameButton.addEventListener('click', () => {
  // Show the game setup section again before reloading
  gameSetup.classList.remove(CONSTANTS.CSS.HIDDEN);

  location.reload();
});

// Force end game button
forceEndGameButton.addEventListener('click', () => {
  if (confirm(CONSTANTS.UI_TEXT.CONFIRM_FORCE_END)) {
    socket.emit(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME);
    console.log('Force end game request sent');
  }
});

// Manual start toggle
manualStartToggle.addEventListener('change', () => {
  const enabled = manualStartToggle.checked;
  socket.emit(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, { enabled });

  // Update UI immediately for responsiveness
  manualStartStatus.textContent = enabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
  startGameButton.disabled = !enabled;
});

// Start game button
startGameButton.addEventListener('click', () => {
  if (players.length === 0) {
    alert(CONSTANTS.UI_TEXT.ALERT_NO_PLAYERS);
    return;
  }

  if (confirm(`${CONSTANTS.UI_TEXT.CONFIRM_START_GAME_PREFIX}${players.length}${CONSTANTS.UI_TEXT.CONFIRM_START_GAME_SUFFIX}`)) {
    socket.emit(CONSTANTS.SOCKET.EVENT_START_GAME);
    console.log('Start game request sent');
    startGameButton.disabled = true;
  }
});

// Socket event handlers
socket.on(CONSTANTS.SOCKET.EVENT_GAME_CREATED, (data) => {
  console.log('Game created event received by instructor client', data);

  // Update manual start controls if info is provided
  if (data && data.manualStartEnabled !== undefined) {
    manualStartToggle.checked = data.manualStartEnabled;
    manualStartStatus.textContent = data.manualStartEnabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
    startGameButton.disabled = !data.manualStartEnabled;
  }
});

socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, (data) => {
  console.log('Player joined event received:', data);

  // Add player to the list if not already there
  if (!players.includes(data.playerName)) {
    console.log(`Adding ${data.playerName} to players array`);
    players.push(data.playerName);
    console.log('Updated players array:', players);
  } else {
    console.log(`Player ${data.playerName} already in list`);
  }

  // Update player list
  updatePlayerList();

  // Update player count
  const countText = `${players.length} player${players.length !== 1 ? 's' : ''} have joined`;
  console.log(`Updating player count to: ${countText}`);
  playerCount.textContent = countText;

  // If data includes manual start info, update the controls
  if (data.manualStartEnabled !== undefined) {
    manualStartToggle.checked = data.manualStartEnabled;
    manualStartStatus.textContent = data.manualStartEnabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
    startGameButton.disabled = !data.manualStartEnabled;
  }
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
  console.log('Game started');

  // Hide game setup section (auto-start toggle and start game button)
  gameSetup.classList.add(CONSTANTS.CSS.HIDDEN);

  // Show game controls and player list
  gameControls.classList.remove(CONSTANTS.CSS.HIDDEN);
  playerListSection.classList.remove(CONSTANTS.CSS.HIDDEN);

  // Make sure current investments section is visible
  currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
  console.log('Made current investments section visible');
  console.log('Current investments section classes:', currentInvestmentsSection.className);

  // Display first round immediately when game starts
  roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
  roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
});

socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
  console.log('Round started:', data);

  // Update round number
  roundNumber.textContent = data.roundNumber;

  // Update round status - change from "Game starting..." to "Round in progress" for any round ≥ 1
  roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;

  // Initialize timer with server time
  if (roundTimer) {
    roundTimer.textContent = data.timeRemaining;
  }

  // Reset submitted players list
  submittedPlayers = [];
  autoSubmittedPlayers = [];
  currentRoundInvestments = {};
  updatePlayerList();
  updateCurrentInvestmentsTable();

  // Show round results section if it's not the first round
  if (data.roundNumber > CONSTANTS.FIRST_ROUND_NUMBER) {
    roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
  }

  // Show current investments section
  currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
});

socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
  console.log('Investment received event on instructor client:', data);

  // Make sure we have the data we need
  if (!data || !data.playerName) {
    console.error('Invalid investment_received data:', data);
    return;
  }

  // Debugging
  console.log('Before update - currentRoundInvestments:', JSON.stringify(currentRoundInvestments));
  console.log('Current investments section visibility:', !currentInvestmentsSection.classList.contains(CONSTANTS.CSS.HIDDEN));

  // Store the investment value for the current round
  if (data.investment !== undefined) {
    currentRoundInvestments[data.playerName] = {
      investment: data.investment,
      isAutoSubmit: data.isAutoSubmit || false
    };
    console.log('Updated currentRoundInvestments:', JSON.stringify(currentRoundInvestments));

    // Ensure investments section is visible
    if (currentInvestmentsSection.classList.contains(CONSTANTS.CSS.HIDDEN)) {
      console.log('Current investments section was hidden, making visible');
      currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
    }

    // Call function to update the table with a slight delay to ensure DOM updates
    setTimeout(() => {
      console.log('Calling updateCurrentInvestmentsTable after delay');
      updateCurrentInvestmentsTable();
    }, CONSTANTS.MEDIUM_UI_DELAY_MS);
  }

  // Mark player as submitted
  if (!submittedPlayers.includes(data.playerName)) {
    submittedPlayers.push(data.playerName);
    console.log('Updated submittedPlayers:', submittedPlayers);

    // Track auto-submitted investments
    if (data.isAutoSubmit) {
      autoSubmittedPlayers.push(data.playerName);
      console.log('Updated autoSubmittedPlayers:', autoSubmittedPlayers);
    }
  } else {
    console.log('Player already in submittedPlayers list');
  }

  // Force UI update
  updatePlayerList();

  // Format investment with consistent decimal precision
  const formattedInvestment = parseFloat(data.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);

  // Add an indicator message to confirm submission was received
  const statusElement = document.createElement('div');
  statusElement.textContent = `${data.playerName} submitted their investment: ${formattedInvestment}`;
  statusElement.classList.add(CONSTANTS.CSS.STATUS_MESSAGE);
  document.body.appendChild(statusElement);

  // Remove the message after a specified time
  setTimeout(() => {
    statusElement.remove();
  }, CONSTANTS.STATUS_MESSAGE_DISPLAY_MS);

  // Check for all submitted
  if (submittedPlayers.length === players.length) {
    console.log('All players have submitted - round should end soon');

    // If we're in round 0 and all players submitted, update the UI to "Round 1" proactively
    if (roundNumber.textContent === '0') {
      roundNumber.textContent = '1';
      roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
    }
  }
});

socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
  console.log('All students have submitted, round ending early:', data);

  // Update round status
  const oldText = roundStatus.textContent;
  roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
  roundStatus.classList.add(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);

  // Restore previous status after the early end
  setTimeout(() => {
    roundStatus.classList.remove(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);
  }, data.timeRemaining * CONSTANTS.MILLISECONDS_PER_SECOND);
});

socket.on(CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY, (data) => {
  console.log('Round summary:', data);

  // Update numeric round display
  roundNumber.textContent = data.roundNumber;
  // Update round status
  roundStatus.textContent = `${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_PREFIX}${data.roundNumber}${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_SUFFIX}`;

  // Clear existing rows
  roundResultsBody.innerHTML = '';

  // Add results to the table
  data.results.forEach(result => {
    const row = document.createElement('tr');

    // Add auto-submitted class if needed
    if (result.isAutoSubmit) {
      row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
      row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
    }

    // Format investment with consistent decimal precision
    const formattedInvestment = parseFloat(result.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);

    row.innerHTML = `
      <td>${result.playerName}</td>
      <td>${formattedInvestment}${result.isAutoSubmit ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX : ''}</td>
      <td>${result.newCapital}</td>
      <td>${result.newOutput}</td>
    `;
    roundResultsBody.appendChild(row);
  });

  // Show round results section
  roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
  console.log('Game over:', data);

  // Update winner
  winnerName.textContent = data.winner;

  // Clear existing rows
  finalResultsBody.innerHTML = '';

  // Add final results to the table
  data.finalResults.forEach((result, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + CONSTANTS.DISPLAY_INDEX_OFFSET}</td>
      <td>${result.playerName}</td>
      <td>${result.finalOutput}</td>
    `;
    finalResultsBody.appendChild(row);
  });

  // Show game over section
  gameOverSection.classList.remove(CONSTANTS.CSS.HIDDEN);

  // Update round status
  roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
});

socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
  console.error('Socket error:', data.message);
  alert(CONSTANTS.UI_TEXT.ERROR_PREFIX + data.message);
});

// Handle manual start mode updates
socket.on(CONSTANTS.SOCKET.EVENT_MANUAL_START_MODE, (data) => {
  console.log('Manual start mode update:', data);
  manualStartToggle.checked = data.enabled;
  manualStartStatus.textContent = data.enabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
  startGameButton.disabled = !data.enabled;
});

// Add handler for admin notifications
socket.on(CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION, (data) => {
  console.log('Admin notification:', data);

  // Display notification to user
  const notification = document.createElement('div');
  notification.textContent = data.message;
  notification.classList.add(CONSTANTS.CSS.ADMIN_NOTIFICATION, `${CONSTANTS.CSS.ADMIN_NOTIFICATION_PREFIX}${data.type || CONSTANTS.NOTIFICATION.DEFAULT_TYPE}`);
  document.body.appendChild(notification);

  // Remove notification after specified time
  setTimeout(() => {
    notification.remove();
  }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
});

// Add handler for timer updates from the server
socket.on(CONSTANTS.SOCKET.EVENT_TIMER_UPDATE, (data) => {
  // Update timer display if element exists
  if (roundTimer) {
    roundTimer.textContent = data.timeRemaining;
  }
});

// Utility functions
function updatePlayerList() {
  console.log('Updating player list - players:', players);
  console.log('Submitted players:', submittedPlayers);
  console.log('Auto-submitted players:', autoSubmittedPlayers);

  // Clear existing player list
  playerList.innerHTML = '';

  // Add all players to the list
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add(CONSTANTS.CSS.PLAYER_ITEM);

    const isSubmitted = submittedPlayers.includes(player);
    const isAutoSubmitted = autoSubmittedPlayers.includes(player);

    // Add submitted class if the player has submitted their investment
    if (isSubmitted) {
      console.log(`Marking player ${player} as submitted`);
      playerElement.classList.add(CONSTANTS.CSS.PLAYER_SUBMITTED);

      // Add auto-submitted class if the player's investment was auto-submitted
      if (isAutoSubmitted) {
        console.log(`Marking player ${player} as auto-submitted`);
        playerElement.classList.add(CONSTANTS.CSS.PLAYER_AUTO_SUBMITTED);
        playerElement.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
      }
    }

    // Create a more informative player display
    playerElement.innerHTML = `
      <span class="${CONSTANTS.CSS.PLAYER_NAME}">${player}</span>
      ${isSubmitted ?
          `<span class="${CONSTANTS.CSS.PLAYER_STATUS}">${CONSTANTS.UI_TEXT.STATUS_PLAYER_SUBMITTED}</span>` :
          `<span class="${CONSTANTS.CSS.PLAYER_STATUS} ${CONSTANTS.CSS.PLAYER_STATUS_PENDING}">${CONSTANTS.UI_TEXT.STATUS_PLAYER_PENDING}</span>`}
    `;

    playerList.appendChild(playerElement);
  });

  // Force a re-paint - sometimes needed to make sure the UI updates
  playerList.style.opacity = CONSTANTS.REPAINT_HACK_OPACITY;
  setTimeout(() => {
    playerList.style.opacity = '1';
  }, CONSTANTS.SHORT_UI_DELAY_MS);
}

function updateCurrentInvestmentsTable() {
  console.log('Updating current investments table');

  // Ensure the section is visible
  currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);

  // Clear existing rows
  currentInvestmentsBody.innerHTML = '';

  // Check if we have any investments to display
  const investmentCount = Object.keys(currentRoundInvestments).length;
  console.log(`Have ${investmentCount} investments to display`);

  if (investmentCount === 0) {
    // Add a placeholder row
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="${CONSTANTS.INVESTMENTS_TABLE_COLUMN_COUNT}" class="${CONSTANTS.CSS.PLACEHOLDER_TEXT}">${CONSTANTS.UI_TEXT.PLACEHOLDER_INVESTMENT_SUBMITTED}</td>`;
    currentInvestmentsBody.appendChild(row);
    return;
  }

  // Add investments to the table
  Object.entries(currentRoundInvestments).forEach(([playerName, data]) => {
    const row = document.createElement('tr');

    // Add auto-submitted class if needed
    if (data.isAutoSubmit) {
      row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
      row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
    }

    // Format investment with consistent decimal precision
    const formattedInvestment = parseFloat(data.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);

    row.innerHTML = `
      <td>${playerName}</td>
      <td>${formattedInvestment}${data.isAutoSubmit ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX : ''}</td>
    `;
    currentInvestmentsBody.appendChild(row);
  });

  // Add visual highlight to show the table updated
  currentInvestmentsSection.style.animation = 'none';
  setTimeout(() => {
    currentInvestmentsSection.style.animation = `flashUpdate ${CONSTANTS.CSS_ANIMATION_DURATION_SECONDS}s`;
  }, CONSTANTS.SHORT_UI_DELAY_MS);
}