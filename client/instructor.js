// Connect to Socket.IO server
const socket = io();

// Debug socket connection
socket.on('connect', () => {
  console.log('Instructor connected to server with socket ID:', socket.id);
});

// DOM Elements
const gameStatus = document.getElementById('gameStatus');
const playerCount = document.getElementById('playerCount');
const startGameButton = document.getElementById('startGameButton');
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

// Start the game
startGameButton.addEventListener('click', () => {
  socket.emit('start_game');
  startGameButton.disabled = true;
});

// Reset the game
resetGameButton.addEventListener('click', () => {
  location.reload();
});

// Socket event handlers
socket.on('game_created', () => {
  console.log('Game created event received by instructor client');
  
  // Enable start button once players join
  updateStartButton();
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
  
  // Enable start button if at least one player has joined
  updateStartButton();
  
  // Display auto-start message if enabled and threshold met
  if (CONSTANTS.AUTO_START_ENABLED && players.length >= CONSTANTS.AUTO_START_PLAYERS) {
    startGameButton.disabled = true;
    const autoStartMsg = document.createElement('p');
    autoStartMsg.textContent = 'Game auto-start triggered';
    autoStartMsg.classList.add('auto-start-msg');
    if (!document.querySelector('.auto-start-msg')) {
      gameStatus.appendChild(autoStartMsg);
    }
  }
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

function updateStartButton() {
  // Enable start button if at least one player has joined
  console.log(`updateStartButton called - ${players.length} players`);
  const shouldEnable = players.length > 0;
  startGameButton.disabled = !shouldEnable;
  
  if (shouldEnable) {
    console.log('Start game button enabled');
    startGameButton.classList.add('button-enabled');
  } else {
    console.log('Start game button disabled');
    startGameButton.classList.remove('button-enabled');
  }
}

function updateCurrentInvestmentsTable() {
  console.log('Updating current investments table');
  
  // Ensure the section is visible
  currentInvestmentsSection.classList.remove('hidden');
  
  // Clear existing rows
  currentInvestmentsBody.innerHTML = '';
  
  // Check if we have any investments to display
  const investmentCount = Object.keys(currentRoundInvestments).length;
  console.log(`Have ${investmentCount} investments to display`);
  
  if (investmentCount === 0) {
    // Add a placeholder row
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="2" class="placeholder-text">No investments submitted yet</td>';
    currentInvestmentsBody.appendChild(row);
    return;
  }
  
  // Add investments to the table
  Object.entries(currentRoundInvestments).forEach(([playerName, data]) => {
    const row = document.createElement('tr');
    
    // Add auto-submitted class if needed
    if (data.isAutoSubmit) {
      row.classList.add('auto-submitted-row');
      row.title = 'Auto-submitted (current slider value)';
    }
    
    // Format investment with consistent decimal precision
    const formattedInvestment = parseFloat(data.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);
    
    row.innerHTML = `
      <td>${playerName}</td>
      <td>${formattedInvestment}${data.isAutoSubmit ? ' (auto)' : ''}</td>
    `;
    currentInvestmentsBody.appendChild(row);
  });
  
  // Add visual highlight to show the table updated
  currentInvestmentsSection.style.animation = 'none';
  setTimeout(() => {
    currentInvestmentsSection.style.animation = 'flashUpdate 0.5s';
  }, 10);
} 