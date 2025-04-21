// Get the real constants
const CONSTANTS = require('../../shared/constants');

/**
 * Creates a test game with default values that can be overridden
 */
function createTestGame(overrides = {}) {
  return {
    id: 'game123',
    state: CONSTANTS.GAME_STATES.WAITING, // Use the actual constants from the codebase
    round: 1,
    players: [],
    startTime: Date.now(),
    capital: 100,
    output: 50,
    ...overrides
  };
}

/**
 * Creates a test player with default values that can be overridden
 */
function createTestPlayer(overrides = {}) {
  return {
    id: 'player123',
    name: 'Test Player',
    type: CONSTANTS.GAME_ROLES.PLAYER, // Use the actual constants
    score: 0,
    decisions: [],
    investment: 0,
    consumption: 0,
    ...overrides
  };
}

/**
 * Creates a test decision with default values that can be overridden
 */
function createTestDecision(overrides = {}) {
  return {
    roundId: 1,
    investment: 50,
    timestamp: Date.now(),
    ...overrides
  };
}

/**
 * Creates a test round with default values that can be overridden
 */
function createTestRound(overrides = {}) {
  return {
    id: 1,
    startTime: Date.now(),
    endTime: null,
    duration: 60000, // 60 seconds
    decisions: [],
    ...overrides
  };
}

module.exports = {
  createTestGame,
  createTestPlayer,
  createTestDecision,
  createTestRound
}; 