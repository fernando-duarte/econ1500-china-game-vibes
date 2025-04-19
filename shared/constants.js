// Game configuration constants
const GAME_CONSTANTS = {
  // Round configuration
  ROUNDS: 10,
  ROUND_DURATION_SECONDS: 60,
  
  // Economic model constants
  INITIAL_CAPITAL: 100,
  ALPHA: 0.3,
  DEPRECIATION_RATE: 0.1,
  
  // Display constants
  DECIMAL_PRECISION: 1,
  
  // Investment constants
  INVESTMENT_STEP: 0.1,
  
  // Timing constants
  MILLISECONDS_PER_SECOND: 1000,
  AUTO_SUBMIT_THRESHOLD_SECONDS: 1
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