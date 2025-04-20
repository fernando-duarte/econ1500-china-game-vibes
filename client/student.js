// Connect to Socket.IO server with explicit reconnection settings
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

// Storage utility with feature detection and fallbacks
const Storage = {
  available: null,
  
  // Test if storage is actually available (handles private browsing)
  checkAvailability() {
    if (this.available !== null) return this.available;
    
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.available = true;
      return true;
    } catch (e) {
      this.available = false;
      console.log('Local storage not available, using memory storage');
      return false;
    }
  },
  
  // Memory fallback for private browsing mode
  memoryStorage: {},
  
  setItem(key, value) {
    if (this.checkAvailability()) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
  },
  
  getItem(key) {
    if (this.checkAvailability()) {
      return localStorage.getItem(key);
    }
    return this.memoryStorage[key] || null;
  },
  
  removeItem(key) {
    if (this.checkAvailability()) {
      localStorage.removeItem(key);
    } else {
      delete this.memoryStorage[key];
    }
  }
};

// Storage keys as constants
const STORAGE_KEYS = {
  PLAYER_NAME: 'solowGame_playerName',
  PLAYER_STATE: 'solowGame_playerState',
};

// Helper functions using the robust storage system
function savePlayerData(name) {
  if (name && name.trim()) {
    Storage.setItem(STORAGE_KEYS.PLAYER_NAME, name.trim());
  }
}

function getStoredPlayerData() {
  return {
    playerName: Storage.getItem(STORAGE_KEYS.PLAYER_NAME) || '',
  };
}

function clearStoredPlayerData() {
  Storage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  Storage.removeItem(STORAGE_KEYS.PLAYER_STATE);
}

// Functions for player state persistence
/**
 * Saves the current player state to localStorage for potential reconnection
 * @param {Object} stateData - The state data received from the server
 */
function savePlayerState(stateData) {
  try {
    // Make sure we have required data
    if (!stateData) stateData = {};
    
    // Get current values from DOM if not provided in stateData
    const currentRoundNumber = stateData.roundNumber || (roundNumber ? roundNumber.textContent : '1');
    const currentCapital = stateData.capital || lastCapital || 0;
    const currentOutput = stateData.output || lastOutput || 0;
    
    // Store essential game state in localStorage
    const savedState = {
      socketId: socket.id, // Use socketId instead of playerId
      playerName: currentPlayerName,
      roundNumber: currentRoundNumber,
      capital: currentCapital,
      output: currentOutput,
      gamePhase: stateData.gamePhase || 'unknown',
      timestamp: Date.now()
    };
    
    localStorage.setItem('playerGameState', JSON.stringify(savedState));
    console.log('Player state saved to localStorage:', savedState);
  } catch (error) {
    console.error('Failed to save player state:', error);
  }
}

/**
 * Validates required fields in the stored player state
 * @param {Object} state - The state object to validate
 * @returns {boolean} Whether the state is valid
 */
function validateStoredState(state) {
  if (!state) return false;
  
  // Check for required fields
  if (!state.playerName || typeof state.playerName !== 'string') {
    console.warn('Stored player state is missing valid playerName');
    return false;
  }
  
  // Ensure numeric types for numbers
  if (state.capital && isNaN(parseFloat(state.capital))) {
    state.capital = 0;
  }
  
  if (state.output && isNaN(parseFloat(state.output))) {
    state.output = 0;
  }
  
  // Check if state is too old (older than 24 hours)
  if (state.timestamp) {
    const ageInHours = (Date.now() - state.timestamp) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      console.warn('Stored player state is too old (> 24 hours)');
      clearStoredPlayerData();
      return false;
    }
  }
  
  return true;
}

function getStoredPlayerState() {
  try {
    const stateString = localStorage.getItem('playerGameState');
    if (!stateString) return null;
    
    const state = JSON.parse(stateString);
    
    // Validate the parsed state
    if (!validateStoredState(state)) {
      return null;
    }
    
    return state;
  } catch (err) {
    console.error('Failed to parse stored player state:', err);
    return null;
  }
}

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

// Get connection indicator element
const connectionIndicator = document.getElementById('connectionIndicator');

// Debounced update to prevent flickering
let connectionUpdateTimeout;
function updateConnectionStatus(status, immediate = false) {
  if (!connectionIndicator) return;
  
  // Clear any pending update
  if (connectionUpdateTimeout) {
    clearTimeout(connectionUpdateTimeout);
  }
  
  // Update immediately or after a short delay
  const updateFn = () => {
    // Clear previous classes
    connectionIndicator.classList.remove('connected', 'disconnected', 'connecting');
    
    // Set appropriate class
    switch (status) {
      case 'connected':
        connectionIndicator.classList.add('connected');
        connectionIndicator.setAttribute('data-status', 'Connected');
        break;
      case 'disconnected':
        connectionIndicator.classList.add('disconnected');
        connectionIndicator.setAttribute('data-status', 'Disconnected');
        break;
      case 'connecting':
        connectionIndicator.classList.add('connecting');
        connectionIndicator.setAttribute('data-status', 'Connecting...');
        break;
      default:
        connectionIndicator.classList.add('connecting');
        connectionIndicator.setAttribute('data-status', status);
    }
  };
  
  if (immediate) {
    updateFn();
  } else {
    // Delay update to prevent flickering on quick status changes
    connectionUpdateTimeout = setTimeout(updateFn, 300);
  }
}

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
let isConnected = false;
let connectionEstablished = false;

// Track the important game events we've already processed
const processedEvents = {
  gameJoined: false,
  roundStarted: false,
  roundNumber: 0,
  
  // Reset processed events (for a new connection)
  reset() {
    this.gameJoined = false;
    this.roundStarted = false;
    this.roundNumber = 0;
  },
  
  // Mark an event as processed
  markProcessed(event, data = {}) {
    switch(event) {
      case 'game_joined':
        this.gameJoined = true;
        break;
      case 'round_start':
        this.roundStarted = true;
        this.roundNumber = data.roundNumber || 0;
        break;
    }
  }
};

// Join game
joinButton.addEventListener('click', () => {
  const name = playerName.value.trim();
  
  if (!name) {
    joinError.textContent = 'Please enter your name';
    return;
  }
  
  joinError.textContent = '';
  joinButton.disabled = true;
  
  socket.emit('join_game', { playerName: name });
});

// Function to handle reconnection attempts
function attemptReconnection(name) {
  if (!isConnected) {
    joinError.textContent = 'Waiting for connection...';
    return false;
  }
  
  joinError.textContent = '';
  joinButton.disabled = true;
  
  // Clear any previous game state to avoid conflicts
  resetGameState();
  
  // Emit reconnection event
  socket.emit('join_game', { playerName: name, isReconnect: true });
  
  return true;
}

// Helper to reset game state
function resetGameState() {
  hasSubmittedInvestment = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

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
socket.on('connect', () => {
  console.log('Socket connected');
  isConnected = true;
  updateConnectionStatus('connected', true);
  
  if (wasDisconnected) {
    showNotification('Connection restored');
    wasDisconnected = false;
  }
  
  // Mark when first connection is fully established
  socket.emit('connection_check', {}, () => {
    connectionEstablished = true;
    
    // Now safe to check for stored credentials and attempt reconnection
    const storedData = getStoredPlayerData();
    if (storedData.playerName) {
      // Auto-fill form first without auto-reconnection
      playerName.value = storedData.playerName;
      
      // Add a reconnect notice and button
      const reconnectContainer = document.createElement('div');
      reconnectContainer.className = 'reconnect-notice';
      reconnectContainer.innerHTML = `
        <p>You were previously playing as "${storedData.playerName}"</p>
        <button id="reconnectBtn" class="button">Reconnect</button>
      `;
      joinForm.appendChild(reconnectContainer);
      
      // Add click handler for manual reconnection
      document.getElementById('reconnectBtn').addEventListener('click', () => {
        attemptReconnection(storedData.playerName);
      });
    }
  });
});

socket.on('game_joined', (data) => {
  processedEvents.markProcessed('game_joined');
  
  // Store player name from server data
  currentPlayerName = data.playerName;
  
  // Save player data to localStorage for reconnection (async to avoid blocking)
  setTimeout(() => {
    savePlayerData(currentPlayerName);
  }, 0);
  
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

socket.on('game_started', () => {
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

socket.on('round_start', (data) => {
  processedEvents.markProcessed('round_start', data);
  
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
  
  // Initialize timer with the server's time
  timer.textContent = data.timeRemaining;
});

socket.on('investment_received', (data) => {
  // Update UI to show investment was received
  investmentResult.textContent = data.investment;
});

socket.on('all_submitted', (data) => {
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

socket.on('round_end', (data) => {
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

socket.on('game_over', (data) => {
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
});

socket.on('state_snapshot', (data) => {
  console.log('Received state snapshot:', data);
  
  // Validate the snapshot before using
  if (!data || typeof data !== 'object') {
    console.error('Invalid state snapshot received');
    return;
  }
  
  // Save player state for potential reconnection
  savePlayerState(data);
  
  // Reset the processed events since we're getting a fresh state
  processedEvents.reset();
  
  // Reset any existing timers
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Show game UI and hide join form
  joinForm.classList.add('hidden');
  gameUI.classList.remove('hidden');
  
  // Update round number and capital/output with safeguards
  if (data.roundNumber !== undefined) {
    roundNumber.textContent = data.roundNumber;
    processedEvents.roundNumber = data.roundNumber;
  }
  
  if (data.capital !== undefined) {
    capital.textContent = data.capital;
    lastCapital = data.capital;
  }
  
  if (data.output !== undefined) {
    output.textContent = data.output;
    currentOutput = data.output;
    lastOutput = data.output;
    
    // Also update investment slider max value
    if (investmentSlider) {
      investmentSlider.max = data.output;
      maxOutput.textContent = data.output;
    }
  }
  
  // If the player has already submitted their investment
  hasSubmittedInvestment = !!data.submitted;
  
  // Show the appropriate UI based on game phase
  updateUIForGamePhase(data);
  
  // Handle timer synchronization if round is active
  if (data.timeRemaining && data.timeRemaining > 0 && !data.submitted) {
    // Use server-provided time
    startTimer(Math.max(1, data.timeRemaining));
  }
});

// Helper to update UI based on game phase
function updateUIForGamePhase(data) {
  // Set investment UI state
  if (data.submitted) {
    investmentStatus.textContent = 'You have already submitted your investment for this round';
    submitInvestment.disabled = true;
    investmentSlider.disabled = true;
    investmentValue.disabled = true;
  } else {
    submitInvestment.disabled = false;
    investmentSlider.disabled = false;
    investmentValue.disabled = false;
  }
  
  // Show correct phase UI based on game state
  if (data.gameState === 'round_active') {
    // Active round - show investment UI
    investmentUI.classList.remove('hidden');
    roundResults.classList.add('hidden');
    waitingNextRound.classList.add('hidden');
    gameOverUI.classList.add('hidden');
  } else if (data.gameState === 'results') {
    // Results phase
    investmentUI.classList.add('hidden');
    roundResults.classList.remove('hidden');
    waitingNextRound.classList.add('hidden');
    gameOverUI.classList.add('hidden');
    
    // Update results data if available
    if (data.lastInvestment !== undefined) {
      investmentResult.textContent = data.lastInvestment;
    }
  } else if (data.gameState === 'between_rounds') {
    // Waiting for next round
    investmentUI.classList.add('hidden');
    roundResults.classList.add('hidden');
    waitingNextRound.classList.remove('hidden');
    gameOverUI.classList.add('hidden');
  } else if (data.gameState === 'completed') {
    // Game over
    investmentUI.classList.add('hidden');
    roundResults.classList.add('hidden');
    waitingNextRound.classList.add('hidden');
    gameOverUI.classList.remove('hidden');
    
    if (data.finalOutput !== undefined) {
      finalOutput.textContent = data.finalOutput;
    }
  } else {
    // Default/waiting state
    investmentUI.classList.remove('hidden');
    roundResults.classList.add('hidden');
    waitingNextRound.classList.add('hidden');
    gameOverUI.classList.add('hidden');
  }
}

// Add handler for timer updates from the server
socket.on('timer_update', (data) => {
  // Update timer display with server time
  timer.textContent = data.timeRemaining;
  
  // Auto-submit if time is below threshold and no submission yet
  if (data.timeRemaining <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS && !hasSubmittedInvestment) {
    const currentInvestment = parseFloat(investmentSlider.value);
    socket.emit('submit_investment', { investment: currentInvestment, isAutoSubmit: true });
    submitInvestment.disabled = true;
    investmentSlider.disabled = true;
    investmentValue.disabled = true;
    investmentStatus.textContent = 'Time expired. Current investment value submitted automatically.';
    hasSubmittedInvestment = true;
  }
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  if (typeof error === 'object' && error.message) {
    joinError.textContent = error.message;
    showNotification(`Connection error: ${error.message}`, 'error');
  } else if (typeof error === 'string') {
    joinError.textContent = error;
    showNotification(`Connection error: ${error}`, 'error');
  } else {
    joinError.textContent = 'An error occurred with the connection';
    showNotification('Connection error occurred', 'error');
  }
  
  joinButton.disabled = false;
});

// Debounce reconnection attempts to prevent UI thrashing
let lastReconnectTimestamp = 0;
socket.on('reconnect_attempt', (attemptNumber) => {
  // Limit updates to max once per second for multiple attempts
  const now = Date.now();
  if (now - lastReconnectTimestamp > 1000 || attemptNumber === 1) {
    updateConnectionStatus(`Reconnecting (${attemptNumber})...`);
    lastReconnectTimestamp = now;
  }
});

// Replace redundant 'reconnect' handler with cleaner implementation
// Socket.io emits this event directly, not on socket.io
socket.on('reconnect', (attempt) => {
  console.log(`Reconnected to server after ${attempt} attempts`);
  updateConnectionStatus('connected', true);
  wasDisconnected = false;
  window.reconnectAttempts = 0;
  showNotification('Connection restored!', 'info');
  
  // Give Socket.io connection a moment to stabilize before trying to rejoin
  setTimeout(() => {
    // Try to rejoin the game after reconnection
    const rejoined = tryRejoinGameAfterReconnect();
    
    if (!rejoined) {
      console.log('No stored game session found to reconnect to');
    }
  }, 500);
});

socket.on('reconnect_error', () => {
  updateConnectionStatus('reconnection error');
});

socket.on('reconnect_failed', () => {
  updateConnectionStatus('reconnection failed', true);
  showNotification('Failed to reconnect. Please try the reconnect button below.', 'error');
});

socket.on('disconnect', (reason) => {
  console.log(`Disconnected from server. Reason: ${reason}`);
  updateConnectionStatus('disconnected', true);
  wasDisconnected = true;
  
  // Different handling based on disconnect reason
  if (reason === 'io server disconnect') {
    // The server has forcefully disconnected the socket
    showNotification('Disconnected from server. Connection closed by server.', 'warning');
    // Need to manually reconnect
    setTimeout(() => reconnectToServer(), 1000);
  } else {
    // All other reasons (transport close, io client disconnect, ping timeout)
    showNotification('Connection lost. Attempting to reconnect...', 'warning');
    // Socket.io will automatically try to reconnect
  }
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Save current state before disconnect is complete
  if (currentPlayerName) {
    savePlayerState({
      roundNumber: roundNumber.textContent,
      capital: lastCapital,
      output: lastOutput
    });
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
    
    // When 5 seconds or less are left, add warning class
    if (seconds <= 5) {
      timer.classList.add('timer-warning');
    }
    
    if (seconds <= 0) {
      clearInterval(timerInterval);
      
      // Auto-submit if not already submitted
      if (!hasSubmittedInvestment) {
        const investment = parseFloat(investmentValue.value) || 0;
        socket.emit('submit_investment', { investment, isAutoSubmit: true });
        investmentStatus.textContent = 'Time\'s up! Your investment was auto-submitted.';
        submitInvestment.disabled = true;
        investmentSlider.disabled = true;
        investmentValue.disabled = true;
        hasSubmittedInvestment = true;
      }
    }
  }, 1000);
}

// Notification manager to prevent overlap and stacking
const NotificationManager = {
  container: null,
  queue: [],
  processing: false,
  
  init() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  },
  
  add(message, type = 'info') {
    // Initialize if needed
    this.init();
    
    // Add to queue
    this.queue.push({ message, type });
    
    // Start processing if not already
    if (!this.processing) {
      this.processQueue();
    }
  },
  
  processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const { message, type } = this.queue.shift();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    this.container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('visible');
      
      // Remove from DOM after fade out
      setTimeout(() => {
        notification.remove();
        // Process next notification
        this.processQueue();
      }, 500);
    }, 3000);
  }
};

// Helper function to show notifications
function showNotification(message, type = 'info') {
  NotificationManager.add(message, type);
}

// Add styles for notifications
const style = document.createElement('style');
style.textContent = `
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 300px;
    z-index: 1000;
  }
  
  .notification {
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 4px;
    background-color: #4CAF50;
    color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .notification.visible {
    transform: translateX(0);
    opacity: 1;
  }
  
  .notification.error {
    background-color: #F44336;
  }
  
  .notification.warning {
    background-color: #FF9800;
  }
`;
document.head.appendChild(style);

// Track if we were disconnected
let wasDisconnected = false;

// Attempt reconnection with exponential backoff
function reconnectToServer() {
  // Socket.io should handle reconnection automatically,
  // but if needed we can manually try to reconnect
  
  if (!socket.connected) {
    console.log('Manually attempting to reconnect...');
    
    try {
      // First try using the Socket.io built-in reconnect
      socket.connect();
      
      // After a short delay, check if connection attempt was successful
      setTimeout(() => {
        if (!socket.connected) {
          console.log('Socket.io automatic reconnection failed, refreshing page...');
          showNotification('Reconnection failed. Refreshing page...', 'warning');
          
          // As a last resort, refresh the page after a delay
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }, 5000);
    } catch (err) {
      console.error('Error during manual reconnection:', err);
    }
  }
}

function tryRejoinGameAfterReconnect() {
  // Only try to rejoin if we were previously in a game
  if (currentPlayerName) {
    console.log('Attempting to rejoin game as', currentPlayerName);
    socket.emit('join_game', { 
      playerName: currentPlayerName,
      isReconnect: true,
      socketId: socket.id // Use socketId for consistency
    });
    return true;
  }
  
  // Otherwise check if we have saved state
  const savedState = getStoredPlayerState();
  if (savedState && savedState.playerName) {
    console.log('Attempting to rejoin game with saved state:', savedState.playerName);
    socket.emit('join_game', { 
      playerName: savedState.playerName,
      isReconnect: true,
      socketId: socket.id, // Always use current socket.id
      previousSocketId: savedState.socketId // Include previous ID for the server
    });
    return true;
  }
  
  return false;
} 