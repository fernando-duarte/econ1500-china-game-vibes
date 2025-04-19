// Connect to Socket.IO server
const socket = io();

// Display related constants
const DISPLAY_INDEX_OFFSET = 1;
const FIRST_ROUND_NUMBER = 1;

// DOM Elements
const createGameButton = document.getElementById('createGameButton');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gameCode = document.getElementById('gameCode');
const playerCount = document.getElementById('playerCount');
const startGameButton = document.getElementById('startGameButton');
const gameControls = document.getElementById('gameControls');
const playerListSection = document.getElementById('playerListSection');
const playerList = document.getElementById('playerList');
const roundNumber = document.getElementById('roundNumber');
const totalRounds = document.getElementById('totalRounds');
const roundStatus = document.getElementById('roundStatus');
const roundResultsSection = document.getElementById('roundResultsSection');
const roundResultsBody = document.getElementById('roundResultsBody');
const gameOverSection = document.getElementById('gameOverSection');
const winnerName = document.getElementById('winnerName');
const finalResultsBody = document.getElementById('finalResultsBody');
const resetGameButton = document.getElementById('resetGameButton');

// Initialize values from constants
document.addEventListener('DOMContentLoaded', () => {
  totalRounds.textContent = CONSTANTS.ROUNDS;
});

// Game state
let currentGameCode = '';
let players = [];
let submittedPlayers = [];

// Create a new game
createGameButton.addEventListener('click', () => {
  socket.emit('create_game');
  createGameButton.disabled = true;
});

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
socket.on('game_created', (data) => {
  console.log('Game created:', data);
  
  // Store the game code
  currentGameCode = data.code;
  
  // Update UI
  gameCode.textContent = currentGameCode;
  gameCodeDisplay.classList.remove('hidden');
  
  // Enable start button once players join
  updateStartButton();
});

socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
  
  // Add player to the list if not already there
  if (!players.includes(data.playerName)) {
    players.push(data.playerName);
  }
  
  // Update player list
  updatePlayerList();
  
  // Update player count
  playerCount.textContent = `${players.length} player${players.length !== 1 ? 's' : ''} have joined`;
  
  // Enable start button if at least one player has joined
  updateStartButton();
});

socket.on('game_started', () => {
  console.log('Game started');
  
  // Show game controls and player list
  gameControls.classList.remove('hidden');
  playerListSection.classList.remove('hidden');
  
  // Update round status
  roundStatus.textContent = 'Game starting...';
});

socket.on('round_start', (data) => {
  console.log('Round started:', data);
  
  // Update round number
  roundNumber.textContent = data.roundNumber;
  
  // Update round status
  roundStatus.textContent = 'Round in progress';
  
  // Reset submitted players list
  submittedPlayers = [];
  updatePlayerList();
  
  // Show round results section if it's not the first round
  if (data.roundNumber > FIRST_ROUND_NUMBER) {
    roundResultsSection.classList.remove('hidden');
  }
});

socket.on('investment_received', (data) => {
  console.log('Investment received:', data);
  
  // Mark player as submitted
  if (!submittedPlayers.includes(data.playerName)) {
    submittedPlayers.push(data.playerName);
  }
  
  // Update player list
  updatePlayerList();
});

socket.on('round_summary', (data) => {
  console.log('Round summary:', data);
  
  // Update round status
  roundStatus.textContent = `Round ${data.roundNumber} completed`;
  
  // Clear existing rows
  roundResultsBody.innerHTML = '';
  
  // Add results to the table
  data.results.forEach(result => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${result.playerName}</td>
      <td>${result.investment}</td>
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
      <td>${index + DISPLAY_INDEX_OFFSET}</td>
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
  // Clear existing player list
  playerList.innerHTML = '';
  
  // Add all players to the list
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player-item');
    
    // Add submitted class if the player has submitted their investment
    if (submittedPlayers.includes(player)) {
      playerElement.classList.add('player-submitted');
    }
    
    playerElement.textContent = player;
    playerList.appendChild(playerElement);
  });
}

function updateStartButton() {
  // Enable start button if at least one player has joined
  startGameButton.disabled = players.length === 0;
} 