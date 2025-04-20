// Connect to Socket.IO server
const socket = io();

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

// Debug socket connection
socket.on('connect', () => {
  console.log('Instructor connected to server with socket ID:', socket.id);
  updateConnectionStatus('connected', true);
  
  if (wasDisconnected) {
    showNotification('Connection restored');
    wasDisconnected = false;
  }
  
  // Check if we have a stored token
  instructorToken = getStoredInstructorToken();
  if (instructorToken) {
    // Show reconnecting status
    updateInstructorStatus('Reconnecting as instructor...');
    
    // Delay slightly to ensure socket is ready
    setTimeout(() => {
      socket.emit('instructor_connect', { token: instructorToken });
    }, 100);
  }
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

// Local storage keys for persistence with session-based approach
const STORAGE_KEYS = {
  INSTRUCTOR_TOKEN: 'solowGame_instructorToken',
};

// Helper functions for storage with security measures
function saveInstructorToken(token) {
  if (token) {
    Storage.setItem(STORAGE_KEYS.INSTRUCTOR_TOKEN, token);
  }
}

function getStoredInstructorToken() {
  return Storage.getItem(STORAGE_KEYS.INSTRUCTOR_TOKEN) || '';
}

function clearStoredInstructorToken() {
  Storage.removeItem(STORAGE_KEYS.INSTRUCTOR_TOKEN);
}

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

// Initialize values from constants
document.addEventListener('DOMContentLoaded', () => {
  totalRounds.textContent = CONSTANTS.ROUNDS;
  
  // Debug DOM elements
  console.log('DOM Elements check:');
  console.log('currentInvestmentsSection found:', !!currentInvestmentsSection);
  console.log('currentInvestmentsBody found:', !!currentInvestmentsBody);
  
  // Style check
  console.log('currentInvestmentsSection classes:', currentInvestmentsSection.className);
  
  // Add refresh capability
  addRefreshButton();
  
  // Add reset game button
  addResetGameButton();
  
  // Set up periodic recovery check
  setInterval(recoverInstructorUI, 10000); // Check every 10 seconds
});

// Game state
let players = [];
let submittedPlayers = [];
let autoSubmittedPlayers = [];
let currentRoundInvestments = {};
let isInstructorAuthenticated = false;
let instructorToken = '';

// Reset the game
resetGameButton.addEventListener('click', () => {
  location.reload();
});

// Socket event handlers
socket.on('state_snapshot', (data) => {
  console.log('Received state snapshot:', data);
  
  // Validate the snapshot
  if (!data || typeof data !== 'object') {
    console.error('Invalid state snapshot received');
    return;
  }
  
  // Ensure UI elements are visible
  gameControls.classList.remove('hidden');
  playerListSection.classList.remove('hidden');
  
  // Update round number with validation
  if (data.round !== undefined && roundNumber) {
    roundNumber.textContent = data.round;
  }
  
  // Update round status with phase awareness
  if (roundStatus) {
    if (data.state === CONSTANTS.GAME_STATES.COMPLETED) {
      roundStatus.textContent = 'Game over';
    } else if (data.roundActive) {
      roundStatus.textContent = 'Round in progress';
    } else if (data.isGameRunning) {
      roundStatus.textContent = 'Waiting for next round...';
    } else {
      roundStatus.textContent = 'Waiting for game to start';
    }
  }
  
  // Synchronize player list
  if (data.players && Array.isArray(data.players)) {
    // Reset player tracking
    players = data.players.map(p => p.playerName);
    
    // Identify submitted players with validation
    submittedPlayers = data.players
      .filter(p => p.submitted)
      .map(p => p.playerName);
    
    // Track auto-submitted players if that info is available
    if (data.players.some(p => p.isAutoSubmit !== undefined)) {
      autoSubmittedPlayers = data.players
        .filter(p => p.submitted && p.isAutoSubmit)
        .map(p => p.playerName);
    } else {
      autoSubmittedPlayers = [];
    }
    
    // Update UI components
    updatePlayerList();
    updateCurrentInvestmentsTable(data.players);
    
    // Update player count with validation
    if (playerCount) {
      const countText = `${players.length} player${players.length !== 1 ? 's' : ''} have joined`;
      playerCount.textContent = countText;
    }
  }
  
  // Update timer if available
  if (data.timeRemaining !== undefined && roundTimer) {
    roundTimer.textContent = data.timeRemaining;
  }
  
  // Show appropriate sections based on game state
  updateInstructorUI(data);
});

socket.on('game_created', () => {
  console.log('Game created event received by instructor client');
});

socket.on('player_joined', (data) => {
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
});

socket.on('game_started', () => {
  console.log('Game started');
  
  // Show game controls and player list
  gameControls.classList.remove('hidden');
  playerListSection.classList.remove('hidden');
  
  // Make sure current investments section is visible
  currentInvestmentsSection.classList.remove('hidden');
  console.log('Made current investments section visible');
  console.log('Current investments section classes:', currentInvestmentsSection.className);

  // Display first round immediately when game starts
  roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
  roundStatus.textContent = 'Round in progress';
});

socket.on('round_start', (data) => {
  console.log('Round started:', data);
  
  // Update round number
  roundNumber.textContent = data.roundNumber;
  
  // Update round status - change from "Game starting..." to "Round in progress" for any round ≥ 1
  roundStatus.textContent = 'Round in progress';
  
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
    roundResultsSection.classList.remove('hidden');
  }
  
  // Show current investments section
  currentInvestmentsSection.classList.remove('hidden');
});

socket.on('investment_received', (data) => {
  console.log('Investment received event on instructor client:', data);
  
  // Make sure we have the data we need
  if (!data || !data.playerName) {
    console.error('Invalid investment_received data:', data);
    return;
  }
  
  // Debugging
  console.log('Before update - currentRoundInvestments:', JSON.stringify(currentRoundInvestments));
  console.log('Current investments section visibility:', !currentInvestmentsSection.classList.contains('hidden'));
  
  // Store the investment value for the current round
  if (data.investment !== undefined) {
    currentRoundInvestments[data.playerName] = {
      investment: data.investment,
      isAutoSubmit: data.isAutoSubmit || false
    };
    console.log('Updated currentRoundInvestments:', JSON.stringify(currentRoundInvestments));
    
    // Ensure investments section is visible
    if (currentInvestmentsSection.classList.contains('hidden')) {
      console.log('Current investments section was hidden, making visible');
      currentInvestmentsSection.classList.remove('hidden');
    }
    
    // Call function to update the table with a slight delay to ensure DOM updates
    setTimeout(() => {
      console.log('Calling updateCurrentInvestmentsTable after delay');
      updateCurrentInvestmentsTable();
    }, 50);
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
  statusElement.classList.add('status-message');
  document.body.appendChild(statusElement);
  
  // Remove the message after 3 seconds
  setTimeout(() => {
    statusElement.remove();
  }, 3000);
  
  // Check for all submitted
  if (submittedPlayers.length === players.length) {
    console.log('All players have submitted - round should end soon');
    
    // If we're in round 0 and all players submitted, update the UI to "Round 1" proactively
    if (roundNumber.textContent === '0') {
      roundNumber.textContent = '1';
      roundStatus.textContent = 'Round in progress';
    }
  }
});

socket.on('all_submitted', (data) => {
  console.log('All students have submitted, round ending early:', data);
  
  // Update round status
  const oldText = roundStatus.textContent;
  roundStatus.textContent = 'All students submitted. Round ending...';
  roundStatus.classList.add('all-submitted-status');
  
  // Restore previous status after the early end
  setTimeout(() => {
    roundStatus.classList.remove('all-submitted-status');
  }, data.timeRemaining * 1000);
});

socket.on('round_summary', (data) => {
  console.log('Round summary:', data);
  
  // Update numeric round display
  roundNumber.textContent = data.roundNumber;
  // Update round status
  roundStatus.textContent = `Round ${data.roundNumber} completed`;
  
  // Clear existing rows
  roundResultsBody.innerHTML = '';
  
  // Add results to the table
  data.results.forEach(result => {
    const row = document.createElement('tr');
    
    // Add auto-submitted class if needed
    if (result.isAutoSubmit) {
      row.classList.add('auto-submitted-row');
      row.title = 'Auto-submitted (current slider value)';
    }
    
    // Format investment with consistent decimal precision
    const formattedInvestment = parseFloat(result.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);
    
    row.innerHTML = `
      <td>${result.playerName}</td>
      <td>${formattedInvestment}${result.isAutoSubmit ? ' (auto)' : ''}</td>
      <td>${result.newCapital}</td>
      <td>${result.newOutput}</td>
    `;
    roundResultsBody.appendChild(row);
  });
  
  // Show round results section
  roundResultsSection.classList.remove('hidden');
});

socket.on('game_over', (data) => {
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
  gameOverSection.classList.remove('hidden');
  
  // Update round status
  roundStatus.textContent = 'Game over';
});

socket.on('error', (data) => {
  console.error('Socket error:', data.message);
  alert('Error: ' + data.message);
});

// Add handler for timer updates from the server
socket.on('timer_update', (data) => {
  // Update timer display if element exists
  if (roundTimer) {
    roundTimer.textContent = data.timeRemaining;
  }
});

socket.on('instructor_ack', (data) => {
  if (data.success) {
    isInstructorAuthenticated = true;
    
    // Save the token for reconnection
    if (data.token) {
      instructorToken = data.token;
      saveInstructorToken(data.token);
    }
    
    // Update status appropriately
    updateInstructorStatus(data.isReconnection ? 
      'Reconnected as instructor' : 'Connected as instructor');
    
    // Show UI elements for instructor
    if (gameControls) gameControls.classList.remove('hidden');
    if (playerListSection) playerListSection.classList.remove('hidden');
  } else {
    isInstructorAuthenticated = false;
    updateInstructorStatus('Not authorized as instructor');
    
    // Clear any stored token if authentication failed
    clearStoredInstructorToken();
  }
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

socket.on('reconnect', () => {
  updateConnectionStatus('connected', true);
  showNotification('Reconnected successfully');
});

socket.on('reconnect_error', () => {
  updateConnectionStatus('reconnection error');
});

socket.on('reconnect_failed', () => {
  updateConnectionStatus('reconnection failed', true);
  showNotification('Failed to reconnect. Please refresh page.', 'error');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  updateConnectionStatus('disconnected', true);
  wasDisconnected = true;
  showNotification('Connection lost. Attempting to reconnect...', 'warning');
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
    playerElement.classList.add('player-item');
    
    const isSubmitted = submittedPlayers.includes(player);
    const isAutoSubmitted = autoSubmittedPlayers.includes(player);
    
    // Add submitted class if the player has submitted their investment
    if (isSubmitted) {
      console.log(`Marking player ${player} as submitted`);
      playerElement.classList.add('player-submitted');
      
      // Add auto-submitted class if the player's investment was auto-submitted
      if (isAutoSubmitted) {
        console.log(`Marking player ${player} as auto-submitted`);
        playerElement.classList.add('player-auto-submitted');
        playerElement.title = 'Auto-submitted (current slider value)';
      }
    }
    
    // Create a more informative player display
    playerElement.innerHTML = `
      <span class="player-name">${player}</span>
      ${isSubmitted ? '<span class="player-status">✓ Submitted</span>' : '<span class="player-status pending">Pending</span>'}
    `;
    
    playerList.appendChild(playerElement);
  });
  
  // Force a re-paint - sometimes needed to make sure the UI updates
  playerList.style.opacity = '0.99';
  setTimeout(() => {
    playerList.style.opacity = '1';
  }, 10);
}

function updateCurrentInvestmentsTable(players) {
  console.log('Updating current investments table');
  
  // Ensure the section is visible
  currentInvestmentsSection.classList.remove('hidden');
  
  // Clear existing rows
  currentInvestmentsBody.innerHTML = '';
  
  // Get submitted investments
  const submittedPlayers = players.filter(p => p.submitted);
  
  // Check if we have any investments to display
  if (submittedPlayers.length === 0) {
    // Add a placeholder row
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="2" class="placeholder-text">No investments submitted yet</td>';
    currentInvestmentsBody.appendChild(row);
    return;
  }
  
  // Add investments to the table
  submittedPlayers.forEach(player => {
    const row = document.createElement('tr');
    
    // Add auto-submitted class if needed
    if (player.isAutoSubmit) {
      row.classList.add('auto-submitted-row');
      row.title = 'Auto-submitted (default value)';
    }
    
    // Format investment with consistent decimal precision
    const formattedInvestment = player.investment !== null ? 
      parseFloat(player.investment).toFixed(CONSTANTS.DECIMAL_PRECISION) : '-';
    
    row.innerHTML = `
      <td>${player.playerName}</td>
      <td>${formattedInvestment}${player.isAutoSubmit ? ' (auto)' : ''}</td>
    `;
    currentInvestmentsBody.appendChild(row);
  });
  
  // Add visual highlight to show the table updated
  currentInvestmentsSection.style.animation = 'none';
  setTimeout(() => {
    currentInvestmentsSection.style.animation = 'flashUpdate 0.5s';
  }, 10);
}

// Update instructor status display
function updateInstructorStatus(message) {
  if (gameStatus) {
    gameStatus.textContent = message;
  }
}

// Helper to update instructor UI based on game state
function updateInstructorUI(data) {
  // Show/hide sections based on game phase
  if (data.round > CONSTANTS.FIRST_ROUND_NUMBER && roundResultsSection) {
    roundResultsSection.classList.remove('hidden');
  }
  
  if (data.isGameRunning && currentInvestmentsSection) {
    currentInvestmentsSection.classList.remove('hidden');
  }
  
  if (data.state === CONSTANTS.GAME_STATES.COMPLETED && gameOverSection) {
    gameOverSection.classList.remove('hidden');
  }
}

// Add a method to recover from partial UI state
function recoverInstructorUI() {
  // If we're authenticated but UI isn't showing, force show it
  if (isInstructorAuthenticated) {
    if (gameControls) gameControls.classList.remove('hidden');
    if (playerListSection) playerListSection.classList.remove('hidden');
    
    // Request a fresh state snapshot if we seem to be missing data
    if (players.length === 0 && socket.connected) {
      socket.emit('request_state_snapshot');
    }
  }
}

// Add a refresh button for manual state refresh
function addRefreshButton() {
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Refresh Game Data';
  refreshBtn.className = 'button refresh-button';
  refreshBtn.addEventListener('click', () => {
    try {
      if (socket && socket.connected) {
        if (isInstructorAuthenticated) {
          console.log('Requesting fresh game state');
          socket.emit('request_state_snapshot', {});
          showNotification('Refreshing game data...', 'info');
        } else {
          console.warn('Cannot refresh - not authenticated as instructor');
          showNotification('Not authenticated as instructor', 'error');
        }
      } else {
        console.error('Cannot refresh - socket not connected');
        showNotification('Connection error. Try reloading the page.', 'error');
      }
    } catch (error) {
      console.error('Error refreshing game data:', error);
      showNotification('Failed to refresh game data', 'error');
    }
  });
  
  // Add to the controls section
  if (gameControls) {
    gameControls.appendChild(refreshBtn);
  }
}

// Add a reset game button for emergency recovery
function addResetGameButton() {
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Game';
  resetBtn.className = 'button reset-button warning';
  resetBtn.style.marginLeft = '10px';
  resetBtn.style.backgroundColor = '#FF9800';
  
  resetBtn.addEventListener('click', () => {
    try {
      if (confirm('Are you sure you want to reset the game? This will clear all player data and start fresh.')) {
        if (socket && socket.connected) {
          if (isInstructorAuthenticated) {
            console.log('Requesting game reset');
            socket.emit('reset_game');
            showNotification('Resetting game...', 'warning');
          } else {
            console.warn('Cannot reset - not authenticated as instructor');
            showNotification('Not authenticated as instructor', 'error');
          }
        } else {
          console.error('Cannot reset - socket not connected');
          showNotification('Connection error. Try reloading the page.', 'error');
        }
      }
    } catch (error) {
      console.error('Error requesting game reset:', error);
      showNotification('Failed to reset game', 'error');
    }
  });
  
  // Add to the controls section
  if (gameControls) {
    gameControls.appendChild(resetBtn);
  }
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