// /modules/screen/game.js

// Expose game functionality through window object
window.screenGame = {};

// Game state
const gameState = {
  players: [],
  submittedPlayers: [],
  autoSubmittedPlayers: [],
  roundInvestments: {},
  gameState: 'waiting',
  timerInterval: null,
  capitalValues: [],
  outputValues: [],
};

// Helper function to start timer
window.screenGame.startTimer = function (seconds) {
  // Set initial time
  window.screenDOM.elements.timer.textContent = seconds;
};

// Get state (for use by other modules)
window.screenGame.getState = function () {
  return gameState;
};

// State modification functions
window.screenGame.updateGameState = function (newState) {
  gameState.gameState = newState;
};

window.screenGame.addPlayer = function (playerName) {
  if (!gameState.players.includes(playerName)) {
    gameState.players.push(playerName);
  }
};

window.screenGame.resetForNewGame = function () {
  gameState.players = [];
  gameState.submittedPlayers = [];
  gameState.autoSubmittedPlayers = [];
  gameState.roundInvestments = {};
  gameState.capitalValues = [];
  gameState.outputValues = [];
};

window.screenGame.resetForNewRound = function () {
  gameState.submittedPlayers = [];
  gameState.autoSubmittedPlayers = [];
  gameState.roundInvestments = {};
};

window.screenGame.recordInvestment = function (
  playerName,
  investment,
  isAutoSubmit
) {
  // Store the investment
  if (investment !== undefined) {
    gameState.roundInvestments[playerName] = {
      investment: investment,
      isAutoSubmit: isAutoSubmit || false,
    };
  }

  // Mark player as submitted
  if (!gameState.submittedPlayers.includes(playerName)) {
    gameState.submittedPlayers.push(playerName);

    // Track auto-submitted investments
    if (isAutoSubmit) {
      gameState.autoSubmittedPlayers.push(playerName);
    }
  }
};

window.screenGame.updateCapitalAndOutput = function (results) {
  gameState.capitalValues = [];
  gameState.outputValues = [];

  results.forEach((result) => {
    gameState.capitalValues.push(result.newCapital);
    gameState.outputValues.push(result.newOutput);
  });
};
