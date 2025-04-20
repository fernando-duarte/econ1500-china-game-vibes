/**
 * shared/gameUtils.js
 * Shared utilities for client and server validation
 */

// Use constants if available in the environment
let CONSTANTS;
if (typeof module !== 'undefined' && module.exports) {
  // Server-side
  console.log('[GameUtils] Loading in server environment');
  CONSTANTS = require('./constants');
} else if (typeof window !== 'undefined' && window.CONSTANTS) {
  // Client-side
  console.log('[GameUtils] Loading in client environment with CONSTANTS:', !!window.CONSTANTS);
  CONSTANTS = window.CONSTANTS;
} else {
  // Fallback defaults if constants not available
  console.warn('[GameUtils] No CONSTANTS found! Using fallback values');
  CONSTANTS = {
    DECIMAL_PRECISION: 1,
    INVESTMENT_MIN: 0
  };
}

/**
 * Validates an investment input against player's current game state
 * @param {string|number} investment - The investment value to validate
 * @param {Object} gameState - The current game state with capital and output
 * @returns {Object} Validation result with valid flag, error message, and sanitized value
 */
function validateInvestment(investment, gameState) {
  if (!gameState) {
    return { 
      valid: false, 
      error: 'Cannot validate investment: missing game state', 
      value: 0 
    };
  }
  
  // Parse and sanitize input
  let value;
  
  // Handle string or numeric input
  if (typeof investment === 'string') {
    // Remove whitespace and replace commas with periods
    const sanitized = investment.trim().replace(',', '.');
    value = parseFloat(sanitized);
  } else {
    value = parseFloat(investment);
  }
  
  // Basic validation checks
  if (isNaN(value)) {
    return { 
      valid: false, 
      error: 'Please enter a valid number', 
      value: null 
    };
  }
  
  if (value < 0) {
    return { 
      valid: false, 
      error: 'Investment cannot be negative', 
      value: 0 
    };
  }
  
  // Ensure we never exceed available capital (with small tolerance for floating point)
  const maxAllowed = gameState.capital !== undefined ? gameState.capital : gameState.output || 0;
  const epsilon = 0.0001; // Small epsilon for floating point comparison
  
  if (value > maxAllowed + epsilon) {
    // Clamp to maximum available with proper decimal handling
    const clampedValue = Math.floor(maxAllowed * Math.pow(10, CONSTANTS.DECIMAL_PRECISION)) / 
                         Math.pow(10, CONSTANTS.DECIMAL_PRECISION);
    
    return { 
      valid: true, 
      error: `Investment reduced to match available capital (${clampedValue})`, 
      value: clampedValue 
    };
  }
  
  // Return validated value with proper decimal precision
  const validatedValue = Math.round(value * Math.pow(10, CONSTANTS.DECIMAL_PRECISION)) / 
                         Math.pow(10, CONSTANTS.DECIMAL_PRECISION);
  
  return { 
    valid: true, 
    error: null, 
    value: validatedValue 
  };
}

/**
 * Format number for display with consistent precision
 * @param {number} value - The numeric value to format
 * @param {number} precision - Decimal precision (defaults to CONSTANTS.DECIMAL_PRECISION)
 * @returns {string} Formatted number as string
 */
function formatNumber(value, precision = null) {
  const decimalPlaces = precision !== null ? precision : CONSTANTS.DECIMAL_PRECISION;
  
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  return value.toFixed(decimalPlaces);
}

// Export for both environments
if (typeof module !== 'undefined' && module.exports) {
  // Server-side export
  module.exports = { 
    validateInvestment,
    formatNumber
  };
} else {
  // Client-side export
  window.GameUtils = window.GameUtils || {};
  window.GameUtils.validateInvestment = validateInvestment;
  window.GameUtils.formatNumber = formatNumber;
} 