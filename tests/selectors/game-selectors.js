/**
 * Game-specific selectors for tests
 * These are separated from the DOM ID extractors to provide more stable selectors
 */

// Common selectors for all views
const commonSelectors = {
  // General UI elements
  APP_CONTAINER: '#app',
  MAIN_CONTENT: 'main',
  HEADER: 'header',
  FOOTER: 'footer',

  // Game info elements
  GAME_ID: '#gameId',
  ROUND_DISPLAY: '#roundDisplay',
  TIMER: '#timer',
};

// Student view selectors
const studentSelectors = {
  // Login/Join elements
  PLAYER_NAME_INPUT: '#playerName',
  GAME_CODE_INPUT: '#gameCode',
  JOIN_BUTTON: '#joinButton',

  // Game elements
  INVESTMENT_SLIDER: '#investmentSlider',
  INVESTMENT_INPUT: '#investment',
  SUBMIT_BUTTON: '#submitButton, button[type="submit"]',
  CURRENT_CAPITAL: '#currentCapital',
  PLAYER_STATUS: '#playerStatus',

  // Result elements
  ROUND_RESULT: '#roundResult',
  CAPITAL_HISTORY: '#capitalHistory',
};

// Instructor view selectors
const instructorSelectors = {
  // Game creation
  INSTRUCTOR_NAME_INPUT: '#instructorName',
  CREATE_GAME_BUTTON: '#createGameButton',

  // Game controls
  START_BUTTON: '#startButton, #startGameButton',
  END_BUTTON: '#endButton, #endGameButton',
  MANUAL_START_TOGGLE: '#manualStartToggle, input[type="checkbox"]',
  PLAYER_LIST: '#playerList',

  // Results and monitoring
  GAME_STATUS: '#gameStatus',
  ROUND_SUMMARY: '#roundSummary',
  PLAYER_TABLE: '#playerTable',
};

// Screen dashboard selectors
const screenSelectors = {
  // Dashboard elements
  SCREEN_DASHBOARD: '#gameScreen, #dashboard',
  GAME_STATE_DISPLAY: '#gameState',
  PLAYER_COUNT: '#playerCount',
  AVERAGE_CAPITAL: '#averageCapital',
  ROUND_INFO: '#roundInfo',

  // Visualization
  CAPITAL_CHART: '#capitalChart',
  LEADERBOARD: '#leaderboard',
};

// Export all selector groups
module.exports = {
  // Combined selectors for easier access
  ...commonSelectors,
  ...studentSelectors,
  ...instructorSelectors,
  ...screenSelectors,

  // Also export categorized selectors
  common: commonSelectors,
  student: studentSelectors,
  instructor: instructorSelectors,
  screen: screenSelectors,
};
