// Connect to Socket.IO server
const socket = io();

// DOM Elements
const joinForm = document.getElementById('joinForm');
const gameUI = document.getElementById('gameUI');
const gameCode = document.getElementById('gameCode');
const playerName = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const joinError = document.getElementById('joinError');
const displayName = document.getElementById('displayName');
const displayCode = document.getElementById('displayCode');
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
  gameCode.maxLength = CONSTANTS.GAME_CODE_LENGTH;
  investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
  investmentValue.min = CONSTANTS.INVESTMENT_MIN;
});

// Game state
let currentPlayerName = '';
let currentGameCode = '';
let timerInterval = null;
let currentOutput = 0;
let hasSubmittedInvestment = false;

// Join game
joinButton.addEventListener('click', () => {
  const code = gameCode.value.trim();
  const name = playerName.value.trim();
  
  if (!code) {
    joinError.textContent = 'Please enter a game code';
    return;
  }
  
  if (!name) {
    joinError.textContent = 'Please enter your name';
    return;
  }
  
  joinError.textContent = '';
  joinButton.disabled = true;
  
  socket.emit('join_game', { code, playerName: name });
});

// Handle investment slider and value sync
investmentSlider.addEventListener('input', () => {
  investmentValue.value = investmentSlider.value;
});

investmentValue.addEventListener('input', () => {
  // Clamp the value between 0 and max output
  const value = parseFloat(investmentValue.value);
  if (!isNaN(value)) {
    const clampedValue = Math.min(Math.max(0, value), currentOutput);
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
  
  socket.emit('submit_investment', { investment });
  submitInvestment.disabled = true;
  investmentSlider.disabled = true;
  investmentValue.disabled = true;
  investmentStatus.textContent = 'Investment submitted. Waiting for other players...';
  hasSubmittedInvestment = true;
});

// Socket event handlers
socket.on('join_ack', (data) => {
  joinButton.disabled = false;
  
  if (!data.success) {
    joinError.textContent = data.error || 'Failed to join the game';
    return;
  }
  
  // Store player name and game code
  currentPlayerName = playerName.value.trim();
  currentGameCode = gameCode.value.trim();
  
  // Update UI
  displayName.textContent = currentPlayerName;
  displayCode.textContent = currentGameCode;
  
  // Set initial capital and output
  capital.textContent = data.initialCapital;
  output.textContent = data.initialOutput;
  
  // Switch from join form to game UI
  joinForm.classList.add('hidden');
  gameUI.classList.remove('hidden');
  
  console.log('Successfully joined the game');
});

socket.on('game_started', () => {
  roundStatus.textContent = 'Game has started. Waiting for first round...';
});

socket.on('round_start', (data) => {
  console.log('Round started:', data);
  
  // Update round number and capital/output
  roundNumber.textContent = data.roundNumber;
  capital.textContent = data.capital;
  output.textContent = data.output;
  currentOutput = data.output;
  
  // Update round status
  roundStatus.textContent = 'Round in progress';
  
  // Reset investment UI
  investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
  investmentSlider.max = data.output;
  investmentSlider.value = 0;
  investmentValue.value = 0;
  maxOutput.textContent = data.output;
  submitInvestment.disabled = false;
  investmentSlider.disabled = false;
  investmentValue.disabled = false;
  investmentStatus.textContent = '';
  hasSubmittedInvestment = false;
  
  // Hide round results and show investment UI
  roundResults.classList.add('hidden');
  investmentUI.classList.remove('hidden');
  
  // Start timer
  startTimer(data.timeRemaining || CONSTANTS.ROUND_DURATION_SECONDS);
});

socket.on('investment_received', (data) => {
  // Update UI to show investment was received
  investmentResult.textContent = data.investment;
});

socket.on('round_end', (data) => {
  console.log('Round ended:', data);
  
  // Stop the timer
  clearInterval(timerInterval);
  
  // Update capital and output
  newCapital.textContent = data.newCapital;
  newOutput.textContent = data.newOutput;
  
  // Hide investment UI and show round results
  investmentUI.classList.add('hidden');
  roundResults.classList.remove('hidden');
  
  // Update round status
  roundStatus.textContent = 'Round completed';
});

socket.on('game_over', (data) => {
  console.log('Game over:', data);
  
  // Update final output
  const playerResult = data.finalResults.find(r => r.playerName === currentPlayerName);
  if (playerResult) {
    finalOutput.textContent = playerResult.finalOutput;
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
});

socket.on('state_snapshot', (data) => {
  console.log('Received state snapshot:', data);
  
  // Update round number and capital/output
  roundNumber.textContent = data.roundNumber;
  capital.textContent = data.capital;
  output.textContent = data.output;
  currentOutput = data.output;
  
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
  
  // If there's time remaining, start the timer
  if (data.timeRemaining) {
    startTimer(data.timeRemaining);
  }
});

socket.on('error', (data) => {
  console.error('Socket error:', data.message);
  
  // Show error message
  if (joinForm.classList.contains('hidden')) {
    investmentStatus.textContent = data.message;
  } else {
    joinError.textContent = data.message;
  }
});

// Utility functions
function startTimer(seconds) {
  // Clear existing timer
  clearInterval(timerInterval);
  
  // Set initial time
  timer.textContent = seconds;
  
  // Start the countdown
  timerInterval = setInterval(() => {
    const currentTime = parseInt(timer.textContent);
    if (currentTime <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS) {
      clearInterval(timerInterval);
      timer.textContent = '0';
      
      // Auto-submit if not submitted yet
      if (!hasSubmittedInvestment) {
        submitInvestment.click();
      }
    } else {
      timer.textContent = currentTime - 1;
    }
  }, CONSTANTS.MILLISECONDS_PER_SECOND);
} 