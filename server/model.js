// Constants for the Solow Growth Model
const ALPHA = 0.3;
const DEPRECIATION_RATE = 0.1;
const INITIAL_CAPITAL = 100;
const ROUNDS = 10;
const ROUND_DURATION_SECONDS = 60;

/**
 * Calculate output based on capital using Cobb-Douglas production function
 * Y = K^α
 */
function calculateOutput(capital) {
  return Math.pow(capital, ALPHA);
}

/**
 * Calculate new capital based on old capital, depreciation rate, and investment
 * K_new = (1 - δ) * K + investment
 */
function calculateNewCapital(oldCapital, investment) {
  return (1 - DEPRECIATION_RATE) * oldCapital + investment;
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

module.exports = {
  ALPHA,
  DEPRECIATION_RATE,
  INITIAL_CAPITAL,
  ROUNDS,
  ROUND_DURATION_SECONDS,
  calculateOutput,
  calculateNewCapital,
  validateInvestment
}; 