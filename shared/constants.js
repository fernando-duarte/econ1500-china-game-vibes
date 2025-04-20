// Game configuration constants
const GAME_CONSTANTS = {
  // Round configuration
  ROUNDS: 10,
  ROUND_DURATION_SECONDS: 60,
  FIRST_ROUND_NUMBER: 1,
  
  // Economic model constants
  INITIAL_CAPITAL: 100,
  ALPHA: 0.3,
  DEPRECIATION_RATE: 0.1,
  NEGATIVE_INITIAL_VALUE: -1, // Used as sentinel value for finding maximums
  
  // Display constants
  DECIMAL_PRECISION: 1,
  DISPLAY_INDEX_OFFSET: 1,
  
  // Investment constants
  INVESTMENT_STEP: 0.1,
  INVESTMENT_MIN: 0,
  
  // Timing constants
  MILLISECONDS_PER_SECOND: 1000,
  AUTO_SUBMIT_THRESHOLD_SECONDS: 1,
  ALL_SUBMITTED_UI_DELAY_MS: 2000, // Delay before ending round after all players submitted (for UI updates)
  
  // Auto-start feature
  AUTO_START_ENABLED: false,  // Disabled - use manual start instead
  AUTO_START_PLAYERS: 3,  // Default number of players needed if auto-start is enabled
  
  // Server defaults
  DEFAULT_PORT: 3000,
  
  // Game state constants
  GAME_STATES: {
    INACTIVE: 'inactive',
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed'
  },
  
  // CSS layout constant for stat-box width
  STAT_BOX_MIN_WIDTH: 150
};

// Calculated constants (derived from the above)
const CALCULATED_CONSTANTS = {
  INITIAL_OUTPUT: Math.pow(GAME_CONSTANTS.INITIAL_CAPITAL, GAME_CONSTANTS.ALPHA).toFixed(GAME_CONSTANTS.DECIMAL_PRECISION),
};

const ALL_CONSTANTS = {
  ...GAME_CONSTANTS,
  ...CALCULATED_CONSTANTS
};

// Export for server-side use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...ALL_CONSTANTS
  };
} 