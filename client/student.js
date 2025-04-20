// Initialize socket.io connection with improved reconnection settings
const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Check if connectionStatus component is available 
if (!window.connectionStatus) {
  console.error('ERROR: connectionStatus is not available in window. Check script loading order in HTML.');
  // Create a fallback object with the same interface
  window.connectionStatus = {
    update: function(status, immediate, autohide) {
      console.log(`Fallback connectionStatus.update called with: ${status}`);
    }
  };
}

// Use the global connectionStatus object
const connectionStatus = window.connectionStatus;
console.log('ConnectionStatus initialized:', !!connectionStatus);

// Enhanced reconnect event tracking
let reconnectAttempt = 0;
let reconnectionTimer;
let lastConnectionStatus = 'disconnected';
let connectionCheckTimeout = null;

// Enable periodic connection check to make sure we're still connected
function startConnectionCheck() {
  if (connectionCheckTimeout) {
    clearTimeout(connectionCheckTimeout);
  }
  
  // Poll for connection status every 30 seconds
  connectionCheckTimeout = setInterval(() => {
    if (socket.connected) {
      // Send a ping and expect a response
      const startTime = Date.now();
      let responseReceived = false;
      
      socket.emit('connection_check', {}, (response) => {
        responseReceived = true;
        const latency = Date.now() - startTime;
        console.log(`Connection check successful. Latency: ${latency}ms`);
        
        // Update connection indicator
        updateConnectionStatus('connected');
      });
      
      // If no response in 5 seconds, consider connection lost
      setTimeout(() => {
        if (!responseReceived) {
          console.warn('Connection check failed - no response from server');
          updateConnectionStatus('disconnected');
          
          // Try reconnecting
          if (socket.connected) {
            console.log('Socket thinks it is connected but server is not responding. Reconnecting...');
            socket.disconnect();
            setTimeout(() => socket.connect(), 1000);
          }
        }
      }, 5000);
    } else {
      updateConnectionStatus('disconnected');
    }
  }, 30000);
}

// Start the connection check on page load
document.addEventListener('DOMContentLoaded', () => {
  startConnectionCheck();
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
function updateConnectionStatus(status, immediate = false, showBriefly = false) {
  if (!connectionIndicator) return;
  
  // Don't update if status hasn't changed (prevents UI flicker)
  if (status === lastConnectionStatus && !immediate) {
    return;
  }
  
  // Update last known status
  lastConnectionStatus = status;
  
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
      case 'server_restart':
        connectionIndicator.classList.add('disconnected');
        connectionIndicator.setAttribute('data-status', 'Server Restarting...');
        break;
      case 'replaced':
        connectionIndicator.classList.add('disconnected');
        connectionIndicator.setAttribute('data-status', 'Connected Elsewhere');
        break;
      default:
        connectionIndicator.classList.add('connecting');
        connectionIndicator.setAttribute('data-status', status);
    }
    
    // Also update the global connection status if available
    if (window.connectionStatus && window.connectionStatus.update) {
      window.connectionStatus.update(status, immediate, showBriefly);
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
  
  // Check if we have stored player data
  const storedData = getStoredPlayerData();
  if (storedData.playerName) {
    // Auto-fill name field
    playerName.value = storedData.playerName;
    
    // Add reconnect option
    if (!document.querySelector('.reconnect-notice')) {
      const reconnectContainer = document.createElement('div');
      reconnectContainer.className = 'reconnect-notice';
      reconnectContainer.innerHTML = `
        <p>You were previously playing as "${storedData.playerName}"</p>
        <button id="reconnectBtn" class="button">Reconnect</button>
      `;
      joinForm.appendChild(reconnectContainer);
      
      // Set up reconnect button
      document.getElementById('reconnectBtn').addEventListener('click', () => {
        if (socket.connected) {
          console.log(`Attempting to reconnect as ${storedData.playerName}`);
          currentPlayerName = storedData.playerName;
          socket.emit('join_game', { 
            playerName: storedData.playerName, 
            isReconnect: true 
          });
          joinButton.disabled = true;
          joinButton.textContent = 'Reconnecting...';
        } else {
          joinError.textContent = 'Waiting for connection...';
          showNotification('Waiting for connection...', 'warning');
        }
      });
    }
  }
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

// Enhanced debugging for socket events
socket.onAny((eventName, ...args) => {
  console.log(`Socket event received: ${eventName}`, args);
});

// Join game
joinButton.addEventListener('click', () => {
  const name = playerName.value.trim();
  
  if (!name) {
    joinError.textContent = 'Please enter your name';
    return;
  }
  
  console.log(`Attempting to join game as "${name}"`);
  joinError.textContent = '';
  joinButton.disabled = true;
  
  // Add loading indicator
  joinButton.textContent = 'Joining...';
  
  // Clear any previous errors
  joinError.textContent = '';
  
  // Check if socket is connected before trying to join
  if (!socket.connected) {
    console.error('Socket is not connected. Cannot join game.');
    joinError.textContent = 'Cannot connect to server. Please try again.';
    joinButton.disabled = false;
    joinButton.textContent = 'Join Game';
    return;
  }
  
  // Temp: Check which message handlers are defined
  console.log('Registered socket event handlers:', Object.keys(socket._callbacks || {})
    .filter(key => key.startsWith('$'))
    .map(key => key.substring(1)));
  
  // Emit join event to server
  console.log('Emitting join_game event with data:', { playerName: name });
  
  // Create a direct handler for this specific join attempt
  // This ensures we get a response even if the main handler fails
  const joinResponseHandler = (data) => {
    console.log('One-time join_ack handler received:', data);
    // Clean up one-time handler
    socket.off('join_ack', joinResponseHandler);
  };
  socket.once('join_ack', joinResponseHandler);
  
  socket.emit('join_game', { playerName: name });
  
  // Add a timeout to re-enable the button if no response
  setTimeout(() => {
    if (joinButton.disabled) {
      console.warn('No response received from server after 5 seconds');
      joinButton.disabled = false;
      joinButton.textContent = 'Join Game';
      joinError.textContent = 'Server did not respond. Please try again.';
      
      // Edge case: try to force a client-side state update based on this attempt
      // This is a fallback for client/server sync issues
      socket.off('join_ack', joinResponseHandler);
      
      console.warn('Testing if game_joined event handler works by forcing a client-side test event');
      // This is for debugging only - simulate the game_joined event to see if handler works
      const mockEvent = {
        playerName: name,
        initialCapital: 100,
        initialOutput: 10
      };
      
      // Do NOT enable this in production - this is just for testing
      // if the handler works when the real event doesn't arrive
      // We're commenting it out but keeping the code for debugging
      /*
      try {
        // This directly calls the handler without needing the server to send it
        const gameJoinedHandler = socket._callbacks['$game_joined']?.[0];
        if (gameJoinedHandler) {
          console.log('Manually triggering game_joined handler for debugging');
          gameJoinedHandler(mockEvent);
        } else {
          console.error('Could not find game_joined handler');
        }
      } catch (err) {
        console.error('Error simulating game_joined event:', err);
      }
      */
    }
  }, 5000);
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
  // Update maxOutput visibility to ensure it's showing
  maxOutput.style.display = 'inline-block';
});

investmentValue.addEventListener('input', () => {
  // Clamp the value between 0 and max output
  const value = parseFloat(investmentValue.value);
  if (!isNaN(value)) {
    const clampedValue = Math.min(Math.max(0, value), currentOutput);
    investmentValue.value = clampedValue;
    investmentSlider.value = clampedValue;
    // Ensure max output is visible
    maxOutput.style.display = 'inline-block';
  }
});

// Submit investment
submitInvestment.addEventListener('click', () => {
  if (hasSubmittedInvestment) return;
  
  const inputValue = parseFloat(document.getElementById('investmentValue').value);
  
  // Use shared validation if available
  if (window.GameUtils && window.GameUtils.validateInvestment) {
    const validation = window.GameUtils.validateInvestment(inputValue, {
      output: currentOutput
    });
    
    if (!validation.valid) {
      // Show validation error
      investmentStatus.textContent = validation.error;
      return;
    }
    
    // If value was adjusted, update the UI and show a notification
    if (validation.value !== inputValue) {
      document.getElementById('investmentValue').value = validation.value;
      document.getElementById('investmentSlider').value = validation.value;
      
      if (validation.error) {
        showNotification(validation.error, 'warning');
      }
    }
    
    // Send validated value
    socket.emit('submit_investment', { investment: validation.value });
  } else {
    // Fallback basic validation
    if (isNaN(inputValue)) {
      investmentStatus.textContent = 'Please enter a valid number';
      return;
    }
    
    // Send the raw value and let server validate
    socket.emit('submit_investment', { investment: inputValue });
  }
  
  // Disable controls
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
  connectionStatus.update('connected', true, true);
  hideManualReconnectUI();
  
  // Show notification of restored connection if reconnecting
  if (reconnectAttempt > 0) {
    showNotification('Connection restored');
    reconnectAttempt = 0;
  }
  
  // Mark when first connection is fully established
  socket.emit('connection_check', {}, () => {
    connectionEstablished = true;
    
    // Now safe to check for stored credentials and attempt reconnection
    const storedData = getStoredPlayerData();
    if (storedData.playerName) {
      // Auto-fill form first without auto-reconnection
      playerName.value = storedData.playerName;
      
      // Add a reconnect notice and button if it doesn't already exist
      if (!document.querySelector('.reconnect-notice')) {
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
    }
  });
  
  // Request current state if we were in a game
  if (currentPlayerName) {
    console.log('Requesting state snapshot after reconnection');
    socket.emit('request_state_snapshot', { playerName: currentPlayerName });
  }
});

// Add handler for join_ack event (server acknowledgment of join request)
socket.on('join_ack', (response) => {
  console.log('Received join acknowledgment:', response);
  console.trace('join_ack event stack trace');
  
  // Re-enable the join button regardless of result
  joinButton.disabled = false;
  joinButton.textContent = 'Join Game';
  
  if (response.success) {
    console.log('Join request accepted, waiting for game_joined event...');
    
    // If we don't receive a game_joined event within 2 seconds, manually show the game UI
    const showGameTimeout = setTimeout(() => {
      console.warn('No game_joined event received, manually showing game UI');
      
      // Extract the player name from the join request
      const name = playerName.value.trim();
      
      // Store player name for reconnection
      currentPlayerName = name;
      
      // Save player data to localStorage for reconnection
      savePlayerData(name);
      
      // Update UI with player name
      displayName.textContent = name;
      
      // Hide join form and show game interface
      joinForm.classList.add('hidden');
      gameUI.classList.remove('hidden');
      
      // Set default values if not provided
      if (capital.textContent === '-') {
        capital.textContent = CONSTANTS.INITIAL_CAPITAL || 100;
        lastCapital = CONSTANTS.INITIAL_CAPITAL || 100;
      }
      
      if (output.textContent === '-') {
        const initialOutput = CONSTANTS.INITIAL_OUTPUT || 10;
        output.textContent = initialOutput;
        currentOutput = initialOutput;
        lastOutput = initialOutput;
      }
      
      // Show notification
      showNotification('Successfully joined the game', 'info');
    }, 2000);
    
    // If game_joined event is received, clear the timeout
    const originalGameJoinedHandler = socket._callbacks['$game_joined']?.[0];
    if (originalGameJoinedHandler) {
      socket.off('game_joined', originalGameJoinedHandler);
      
      socket.on('game_joined', (data) => {
        // Clear the timeout since we received the event
        clearTimeout(showGameTimeout);
        // Call the original handler
        originalGameJoinedHandler(data);
      });
    }
  } else {
    // Handle case where player doesn't exist but can join as new
    if (response.notFound && response.canJoinAsNew) {
      joinError.innerHTML = `${response.message || 'You were not found in the current game.'}<br><button id="joinAsNewBtn" class="button">Join as New Player</button>`;
      
      // Add handler for join as new button
      document.getElementById('joinAsNewBtn')?.addEventListener('click', () => {
        // Clear reconnect flag and try joining as a new player
        socket.emit('join_game', { 
          playerName: playerName.value.trim(), 
          isReconnect: false 
        });
        joinButton.disabled = true;
        joinButton.textContent = 'Joining...';
      });
    } else {
      // Standard error message
      joinError.textContent = response.error || 'Failed to join game';
      showNotification(response.error || 'Failed to join game', 'error');
    }
  }
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
  console.log('All players have submitted investments:', data);
  
  // Show notification to user
  if (data.message) {
    showNotification(data.message, 'success');
  }
  
  // Update UI to indicate waiting for results
  if (investmentStatus) {
    investmentStatus.textContent = 'All players have submitted. Calculating results...';
  }
  
  // Disable submit button again to prevent double submissions during this short period
  if (submitInvestment) {
    submitInvestment.disabled = true;
  }
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
  
  // Update game state from snapshot
  if (data.roundNumber !== undefined) {
    roundNumber.textContent = data.roundNumber;
  }
  
  if (data.capital !== undefined) {
    capital.textContent = data.capital;
    lastCapital = data.capital;
  }
  
  if (data.output !== undefined) {
    output.textContent = data.output;
    currentOutput = data.output;
    lastOutput = data.output;
  }
  
  // Make sure we correctly set the submission status based on the server state
  hasSubmittedInvestment = !!data.submitted;
  
  // Update UI based on game state
  if (data.gameState === 'active' || data.gameState === 'round_active') {
    roundStatus.textContent = 'Round in progress';
    
    // Update investment UI
    investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
    investmentSlider.max = data.output;
    maxOutput.textContent = data.output;
    
    // Check if already submitted
    if (data.submitted) {
      submitInvestment.disabled = true;
      investmentSlider.disabled = true;
      investmentValue.disabled = true;
      investmentStatus.textContent = 'Investment already submitted. Waiting for other players...';
      hasSubmittedInvestment = true;
    } else {
      submitInvestment.disabled = false;
      investmentSlider.disabled = false;
      investmentValue.disabled = false;
      investmentStatus.textContent = '';
      hasSubmittedInvestment = false;
    }
    
    // Set timer if provided
    if (data.timeRemaining !== undefined) {
      timer.textContent = data.timeRemaining;
      startTimer(data.timeRemaining);
    }
    
    // Show correct UI
    roundResults.classList.add('hidden');
    investmentUI.classList.remove('hidden');
  } else if (data.gameState === 'results' || data.gameState === 'between_rounds') {
    roundStatus.textContent = 'Round completed';
    
    // If we have last investment data, show results
    if (data.lastInvestment !== null) {
      investmentResult.textContent = data.lastInvestment;
      newCapital.textContent = data.capital;
      newOutput.textContent = data.output;
      
      // Show results UI
      investmentUI.classList.add('hidden');
      roundResults.classList.remove('hidden');
    }
  }
  
  // Make game UI visible
  if (joinForm && gameUI && currentPlayerName) {
    joinForm.classList.add('hidden');
    gameUI.classList.remove('hidden');
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

// Enhanced reconnection handling
socket.on('reconnect_attempt', (attemptNumber) => {
  reconnectAttempt = attemptNumber;
  connectionStatus.update(`reconnecting (${attemptNumber})`, false);
  
  // Use backoff strategy
  const backoffDelay = Math.min(1000 * Math.pow(1.5, attemptNumber - 1), 10000);
  console.log(`Reconnection attempt ${attemptNumber} with backoff: ${backoffDelay}ms`);
  
  // Clear any existing timers
  if (reconnectionTimer) {
    clearTimeout(reconnectionTimer);
  }
  
  // Set a timeout to show manual reconnect UI if too many attempts
  if (attemptNumber >= 3) {
    reconnectionTimer = setTimeout(() => {
      showManualReconnectUI();
    }, backoffDelay + 1000);
  }
});

socket.on('reconnect', () => {
  reconnectAttempt = 0;
  if (reconnectionTimer) {
    clearTimeout(reconnectionTimer);
    reconnectionTimer = null;
  }
  
  connectionStatus.update('connected', true, true);
  hideManualReconnectUI();
  
  // Try to rejoin game after reconnection
  tryRejoinGameAfterReconnect();
});

socket.on('reconnect_failed', () => {
  connectionStatus.update('failed', true);
  showManualReconnectUI();
});

socket.on('disconnect', (reason) => {
  console.log(`Disconnected from server. Reason: ${reason}`);
  connectionStatus.update('disconnected', true);
  
  // Save current state before disconnect is complete
  if (currentPlayerName) {
    savePlayerState({
      roundNumber: roundNumber ? roundNumber.textContent : null,
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

// Add connection status elements
const reconnectionUI = document.getElementById('reconnectionUI');
const manualReconnectBtn = document.getElementById('manualReconnectBtn');
const refreshPageBtn = document.getElementById('refreshPageBtn');
function updateConnectionStatus(status, showBriefly = false) {
  connectionStatus.update(status, true, showBriefly);
}

// Show/hide reconnection UI
function showManualReconnectUI() {
  if (reconnectionUI) {
    reconnectionUI.classList.remove('hidden');
    // Use a timeout to trigger CSS transition
    setTimeout(() => {
      reconnectionUI.classList.add('visible');
    }, 10);
  }
}

function hideManualReconnectUI() {
  if (reconnectionUI) {
    reconnectionUI.classList.remove('visible');
    // Wait for transition before hiding
    setTimeout(() => {
      reconnectionUI.classList.add('hidden');
    }, 300);
  }
}

// Add button handlers for reconnection UI
if (manualReconnectBtn) {
  manualReconnectBtn.addEventListener('click', () => {
    // Force a new connection attempt
    updateConnectionStatus('Trying to reconnect...');
    socket.connect();
  });
}

if (refreshPageBtn) {
  refreshPageBtn.addEventListener('click', () => {
    window.location.reload();
  });
}

if (clearSessionBtn) {
  clearSessionBtn.addEventListener('click', () => {
    // Clear stored data
    clearStoredPlayerData();
    // Reload the page
    window.location.reload();
  });
}

// Modified tryRejoinGameAfterReconnect function
function tryRejoinGameAfterReconnect() {
  const storedData = getStoredPlayerData();
  const storedState = getStoredPlayerState();
  
  // Only attempt if we have a player name
  if (storedData.playerName) {
    console.log(`Attempting to rejoin as ${storedData.playerName}`);
    
    // Store for later use
    currentPlayerName = storedData.playerName;
    
    // Attempt reconnection with the stored name
    socket.emit('join_game', { 
      playerName: storedData.playerName, 
      isReconnect: true,
      socketId: socket.id 
    });
    
    // Request a snapshot to ensure we have latest state
    setTimeout(() => {
      if (socket.connected && currentPlayerName) {
        socket.emit('request_state_snapshot', { playerName: currentPlayerName });
      }
    }, 1000);
  }
}

// Handle connection status messages from server
socket.on('connection_status', (data) => {
  console.log('Connection status update:', data);
  connectionStatus.update(data.status, true);
  
  if (data.message) {
    showNotification(data.message, data.status === 'error' ? 'error' : 'info');
  }
  
  // Handle various connection status messages
  switch (data.status) {
    case 'replaced':
      // Session moved to another device
      showManualReconnectUI();
      break;
      
    case 'server_restart':
      // Server is restarting, prepare for reconnection
      connectionStatus.update('server_restart', true);
      
      // Don't show reconnection UI immediately, wait for disconnect
      showNotification('Server is restarting, please wait...', 'warning');
      
      // Save current state
      if (currentPlayerName) {
        savePlayerState({
          roundNumber: roundNumber ? roundNumber.textContent : null,
          capital: lastCapital,
          output: lastOutput
        });
      }
      break;
  }
});

// Add notification handler
socket.on('notification', (data) => {
  console.log('Received notification:', data);
  
  // Show the notification
  if (data.message) {
    showNotification(data.message, data.type || 'info');
  }
  
  // For investment validation warnings that affect the UI
  if (data.type === 'warning' && data.message.includes('reduced to match')) {
    // Extract the clamped value from message like: "Investment reduced to match available output (3.5)"
    const valueMatch = data.message.match(/\(([0-9.]+)\)/);
    if (valueMatch && valueMatch[1]) {
      const clampedValue = parseFloat(valueMatch[1]);
      
      // Update the investment UI if needed
      if (!isNaN(clampedValue) && investmentValue) {
        investmentValue.value = clampedValue;
        if (investmentSlider) {
          investmentSlider.value = clampedValue;
        }
      }
    }
  }
});

// Handle game reset by instructor
socket.on('game_reset', (data) => {
  console.log('Game has been reset by instructor:', data);
  
  // Show notification
  showNotification('The game has been reset by the instructor. Please rejoin.', 'warning');
  
  // Reset UI state
  hasSubmittedInvestment = false;
  
  // Clear any active timers
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Keep current player name for potential reconnection
  const previousName = currentPlayerName;
  
  // Update UI to show join form
  joinForm.classList.remove('hidden');
  gameUI.classList.add('hidden');
  
  // Pre-fill the player name field
  if (previousName) {
    playerName.value = previousName;
  }
  
  // Allow the join button to be clicked
  joinButton.disabled = false;
  joinButton.textContent = 'Rejoin Game';
});

// Handle round results
socket.on('round_results', (data) => {
  console.log('Round results received:', data);
  // Process results
  // ... existing code ...
}); 