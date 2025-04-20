// Connect to Socket.IO server
const socket = io();

// DOM Elements
const joinForm = document.getElementById('joinForm');
const gameUI = document.getElementById('gameUI');
const playerName = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const joinError = document.getElementById('joinError');
const displayName = document.getElementById('displayName');
const roundNumber = document.getElementById('roundNumber');
const totalRounds = document.getElementById('totalRounds');
const roundStatus = document.getElementById('roundStatus');
const capital = document.getElementById('capital');
const output = document.getElementById('output');
const investmentUI = document.getElementById('investmentUI');
const timer = document.getElementById('timer');
const investmentSlider = document.getElementById('investmentSlider');
const investmentValue = document.getElementById('investmentValue');
const maxOutput = document.getElementById('maxOutput');
const submitInvestment = document.getElementById('submitInvestment');
const investmentStatus = document.getElementById('investmentStatus');
const roundResults = document.getElementById('roundResults');
const investmentResult = document.getElementById('investmentResult');
const newCapital = document.getElementById('newCapital');
const newOutput = document.getElementById('newOutput');
const waitingNextRound = document.getElementById('waitingNextRound');
const gameOverUI = document.getElementById('gameOverUI');
const finalOutput = document.getElementById('finalOutput');
const winner = document.getElementById('winner');
const finalRankings = document.getElementById('finalRankings');

// Initialize values from constants
document.addEventListener('DOMContentLoaded', () => {
  totalRounds.textContent = CONSTANTS.ROUNDS;
  investmentSlider.step = CONSTANTS.INVESTMENT_STEP;
  investmentValue.step = CONSTANTS.INVESTMENT_STEP;
  timer.textContent = CONSTANTS.ROUND_DURATION_SECONDS;
  // Input constraints from constants
  investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
  investmentValue.min = CONSTANTS.INVESTMENT_MIN;
});

// Game state
let currentPlayerName = '';
let timerInterval = null;
let currentOutput = 0;
let hasSubmittedInvestment = false;
let lastCapital = 0;
let lastOutput = 0;

// Join game
joinButton.addEventListener('click', () => {
  const name = playerName.value.trim();

  if (!name) {
    joinError.textContent = 'Please enter your name';
    return;
  }

  joinError.textContent = '';
  joinButton.disabled = true;

  socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_GAME, { playerName: name });
});

// Handle investment slider and value sync
investmentSlider.addEventListener('input', () => {
  investmentValue.value = investmentSlider.value;
});

investmentValue.addEventListener('input', () => {
  // Clamp the value between 0 and max output
  const value = parseFloat(investmentValue.value);
  if (!isNaN(value)) {
    const clampedValue = Math.min(Math.max(CONSTANTS.INVESTMENT_MIN, value), currentOutput);
    investmentValue.value = clampedValue;
    investmentSlider.value = clampedValue;
  }
});

// Submit investment
submitInvestment.addEventListener('click', () => {
  if (hasSubmittedInvestment) return;

  const investment = parseFloat(investmentValue.value);
  if (isNaN(investment)) {
    investmentStatus.textContent = 'Please enter a valid number';
    return;
  }

  socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, { investment });
  submitInvestment.disabled = true;
  investmentSlider.disabled = true;
  investmentValue.disabled = true;
  investmentStatus.textContent = 'Investment submitted. Waiting for other players...';
  hasSubmittedInvestment = true;
});

// Socket event handlers
socket.on('game_joined', (data) => { // TODO: Add constant for this event
  // Store player name from server data
  currentPlayerName = data.playerName;

  // Update UI with player name
  displayName.textContent = currentPlayerName;

  // Set initial capital and output
  if (data.initialCapital !== undefined) {
    capital.textContent = data.initialCapital;
    lastCapital = data.initialCapital;
  }

  if (data.initialOutput !== undefined) {
    output.textContent = data.initialOutput;
    currentOutput = data.initialOutput;
    lastOutput = data.initialOutput;
  }

  console.log(`Successfully joined game as ${currentPlayerName}`);

  // Hide join form and show game interface
  joinForm.classList.add('hidden');
  gameUI.classList.remove('hidden');
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
  console.log('Game has started event received');
  roundStatus.textContent = 'Game has started. Waiting for first round...';

  // Ensure K and Y are still displayed
  if (capital.textContent === '-' && lastCapital) {
    capital.textContent = lastCapital;
  }
  if (output.textContent === '-' && lastOutput) {
    output.textContent = lastOutput;
  }
});

socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
  console.log('Round started:', data);

  // Update round number and capital/output
  roundNumber.textContent = data.roundNumber;

  // Make sure we update capital and output values clearly
  if (data.capital !== undefined) {
    capital.textContent = data.capital;
    lastCapital = data.capital;
  }

  if (data.output !== undefined) {
    output.textContent = data.output;
    currentOutput = data.output;
    lastOutput = data.output;
  }

  // Update round status
  roundStatus.textContent = 'Round in progress';

  // Reset investment UI
  investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
  investmentSlider.max = data.output;
  investmentSlider.value = CONSTANTS.INVESTMENT_MIN;
  investmentValue.value = CONSTANTS.INVESTMENT_MIN;
  maxOutput.textContent = data.output;
  submitInvestment.disabled = false;
  investmentSlider.disabled = false;
  investmentValue.disabled = false;
  investmentStatus.textContent = '';
  hasSubmittedInvestment = false;

  // Hide round results and show investment UI
  roundResults.classList.add('hidden');
  investmentUI.classList.remove('hidden');

  // Initialize timer with the server's time
  timer.textContent = data.timeRemaining;
});

socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
  // Update UI to show investment was received
  investmentResult.textContent = data.investment;
});

socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
  console.log('All students have submitted:', data);

  // Show message that round is ending early
  investmentStatus.innerHTML = `<span class="all-submitted-message">${data.message}</span>`;

  // Disable controls if not already submitted
  if (!hasSubmittedInvestment) {
    submitInvestment.disabled = true;
    investmentSlider.disabled = true;
    investmentValue.disabled = true;
  }

  // Adjust timer display
  timer.classList.add('timer-ending');
  timer.textContent = 'Ending...';

  // Stop the current timer
  clearInterval(timerInterval);
});

socket.on('round_end', (data) => { // TODO: Add constant for this event
  console.log('Round ended:', data);

  // Stop the timer
  clearInterval(timerInterval);

  // Update capital and output with new values
  if (data.newCapital !== undefined) {
    capital.textContent = data.newCapital;
    lastCapital = data.newCapital;
  }

  if (data.newOutput !== undefined) {
    output.textContent = data.newOutput;
    currentOutput = data.newOutput;
    lastOutput = data.newOutput;
  }

  // Also update the results section
  newCapital.textContent = data.newCapital;
  newOutput.textContent = data.newOutput;

  // Hide investment UI and show round results
  investmentUI.classList.add('hidden');
  roundResults.classList.remove('hidden');

  // Update round status
  roundStatus.textContent = 'Round completed';
});

socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
  console.log('Game over:', data);

  // Update final output
  const playerResult = data.finalResults.find(r => r.playerName === currentPlayerName);
  if (playerResult) {
    finalOutput.textContent = playerResult.finalOutput;

    // Also update the main capital/output display
    if (playerResult.finalCapital || playerResult.capital) {
      capital.textContent = playerResult.finalCapital || playerResult.capital;
      lastCapital = playerResult.finalCapital || playerResult.capital;
    }

    if (playerResult.finalOutput) {
      output.textContent = playerResult.finalOutput;
      lastOutput = playerResult.finalOutput;
    }
  }

  // Update winner
  winner.textContent = data.winner;

  // Generate rankings
  let rankingsHTML = '<ol>';
  data.finalResults.forEach(result => {
    const isCurrentPlayer = result.playerName === currentPlayerName;
    rankingsHTML += `<li${isCurrentPlayer ? ' class="current-player"' : ''}>${result.playerName}: ${result.finalOutput}</li>`;
  });
  rankingsHTML += '</ol>';
  finalRankings.innerHTML = rankingsHTML;

  // Hide round content and show game over UI
  roundResults.classList.add('hidden');
  gameOverUI.classList.remove('hidden');

  // Update round status
  roundStatus.textContent = 'Game over';

  // Disable all investment controls
  submitInvestment.disabled = true;
  investmentSlider.disabled = true;
  investmentValue.disabled = true;
  investmentStatus.textContent = 'Game is over. No more investments can be made.';
});

socket.on('state_snapshot', (data) => { // TODO: Add constant for this event
  console.log('Received state snapshot:', data);

  // Update round number and capital/output
  roundNumber.textContent = data.roundNumber;

  if (data.capital !== undefined) {
    capital.textContent = data.capital;
    lastCapital = data.capital;
  }

  if (data.output !== undefined) {
    output.textContent = data.output;
    currentOutput = data.output;
    lastOutput = data.output;
  }

  // If the player has already submitted their investment
  if (data.submitted) {
    investmentStatus.textContent = 'You have already submitted your investment for this round';
    submitInvestment.disabled = true;
    investmentSlider.disabled = true;
    investmentValue.disabled = true;
    hasSubmittedInvestment = true;
  }

  // Show the appropriate UI
  investmentUI.classList.remove('hidden');

  // Initialize timer display from state
  if (data.timeRemaining) {
    timer.textContent = data.timeRemaining;
  }
});

// Add handler for timer updates from the server
socket.on('timer_update', (data) => {
  // Update timer display with server time
  timer.textContent = data.timeRemaining;

  // Auto-submit if time is below threshold and no submission yet
  if (data.timeRemaining <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS && !hasSubmittedInvestment) {
    const currentInvestment = parseFloat(investmentSlider.value);
    socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, { investment: currentInvestment, isAutoSubmit: true });
    submitInvestment.disabled = true;
    investmentSlider.disabled = true;
    investmentValue.disabled = true;
    investmentStatus.textContent = 'Time expired. Current investment value submitted automatically.';
    hasSubmittedInvestment = true;
  }
});

socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
  joinError.textContent = data.message;
  joinButton.disabled = false;
});

// Add handler for admin notifications
socket.on('admin_notification', (data) => {
  console.log('Admin notification:', data);

  // Display notification to user
  const notification = document.createElement('div');
  notification.textContent = data.message;
  notification.classList.add('admin-notification', `admin-notification-${data.type || 'info'}`);
  document.body.appendChild(notification);

  // Remove notification after specified time
  setTimeout(() => {
    notification.remove();
  }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
});

socket.on(CONSTANTS.SOCKET.EVENT_DISCONNECT, () => {
  console.log('Disconnected from server');
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Function to start the round timer
function startTimer(seconds) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timer.classList.remove('timer-ending');
  timer.textContent = seconds;

  timerInterval = setInterval(() => {
    seconds--;
    timer.textContent = seconds;

    // When timer reaches warning threshold or less, add warning class
    if (seconds <= CONSTANTS.TIMER_WARNING_THRESHOLD_SECONDS) {
      timer.classList.add('timer-warning');
    }

    if (seconds <= 0) {
      clearInterval(timerInterval);

      // Auto-submit if not already submitted
      if (!hasSubmittedInvestment) {
        const investment = parseFloat(investmentValue.value) || CONSTANTS.INVESTMENT_MIN;
        socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, { investment, isAutoSubmit: true });
        investmentStatus.textContent = 'Time\'s up! Your investment was auto-submitted.';
        submitInvestment.disabled = true;
        investmentSlider.disabled = true;
        investmentValue.disabled = true;
        hasSubmittedInvestment = true;
      }
    }
  }, CONSTANTS.MILLISECONDS_PER_SECOND);
}