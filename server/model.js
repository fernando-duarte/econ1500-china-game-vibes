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

  if (isNaN(investment) || investment < CONSTANTS.INVESTMENT_MIN) {
    return CONSTANTS.INVESTMENT_MIN;
  }

  if (investment > currentOutput) {
    return currentOutput;
  }

  return investment;
}

// Export methods and reference constants directly from shared constants
module.exports = {
  ...CONSTANTS,
  calculateOutput,
  calculateNewCapital,
  validateInvestment,
};
