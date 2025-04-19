// Import constants from shared file
const CONSTANTS = require('../shared/constants');

/**
 * Calculate output based on capital using Cobb-Douglas production function
 * Y = K^α
 */
function calculateOutput(capital) {
  return Math.pow(capital, CONSTANTS.ALPHA);
}

/**
 * Calculate new capital based on old capital, depreciation rate, and investment
 * K_new = (1 - δ) * K + investment
 */
function calculateNewCapital(oldCapital, investment) {
  return (1 - CONSTANTS.DEPRECIATION_RATE) * oldCapital + investment;
}

/**
 * Validate investment amount (must be >= 0 and <= current output)
 */
function validateInvestment(investment, currentOutput) {
  // Convert to numbers to ensure proper comparison
  investment = Number(investment);
  currentOutput = Number(currentOutput);
  
  if (isNaN(investment) || investment < 0) {
    return 0;
  }
  
  if (investment > currentOutput) {
    return currentOutput;
  }
  
  return investment;
}

// Export the same interface for backward compatibility
module.exports = {
  ALPHA: CONSTANTS.ALPHA,
  DEPRECIATION_RATE: CONSTANTS.DEPRECIATION_RATE,
  INITIAL_CAPITAL: CONSTANTS.INITIAL_CAPITAL,
  ROUNDS: CONSTANTS.ROUNDS,
  ROUND_DURATION_SECONDS: CONSTANTS.ROUND_DURATION_SECONDS,
  calculateOutput,
  calculateNewCapital,
  validateInvestment
}; 