const CONSTANTS = require('../shared/constants');

// In-memory game state - single game instead of multiple games
let game = {
  isGameRunning: false,
  state: CONSTANTS.GAME_STATES.INACTIVE,
  round: CONSTANTS.FIRST_ROUND_NUMBER - 1,
  players: {},
  roundTimer: null,
  timerInterval: null,
  timeRemaining: 0,
  roundEndTime: null,
  currentIo: null, // Reference to the io instance for the current round/operation
  pendingEndRound: false,
  allSubmittedTime: null, // Time when all players have submitted
  manualStartEnabled: false, // Add flag for manual start mode
};

module.exports = { game };
