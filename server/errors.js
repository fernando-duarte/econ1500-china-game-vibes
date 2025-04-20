// server/errors.js

/**
 * Error types for categorizing different kinds of errors
 */
const ERROR_TYPES = {
  CONNECTION: 'connection',  // For socket/connection issues
  GAME: 'game',              // For game rule violations
  SERVER: 'server',          // For internal server errors
  VALIDATION: 'validation'   // For invalid input
};

/**
 * Specific error codes for detailed error reporting
 */
const ERROR_CODES = {
  // Connection errors
  SOCKET_INVALID: 'socket_invalid',
  PLAYER_NOT_FOUND: 'player_not_found',
  ALREADY_CONNECTED: 'already_connected',
  SESSION_EXPIRED: 'session_expired',
  
  // Game errors
  GAME_NOT_FOUND: 'game_not_found',
  GAME_INACTIVE: 'game_inactive',
  GAME_ENDED: 'game_ended',
  ROUND_ENDED: 'round_ended',
  ALREADY_SUBMITTED: 'already_submitted',
  
  // Validation errors
  INVALID_INPUT: 'invalid_input',
  INVALID_PLAYER_NAME: 'invalid_player_name',
  INVALID_INVESTMENT: 'invalid_investment',
  
  // Server errors
  INTERNAL_ERROR: 'internal_error'
};

/**
 * Create a standardized error object
 * @param {string} type - The error type (from ERROR_TYPES)
 * @param {string} code - The specific error code (from ERROR_CODES)
 * @param {string} message - Human-readable error message
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} - Structured error object
 */
function createError(type, code, message, details = {}) {
  return {
    type,
    code,
    message,
    details,
    timestamp: Date.now()
  };
}

/**
 * Common error factory functions for frequent error cases
 */
const Errors = {
  playerNotFound: (playerName) => createError(
    ERROR_TYPES.CONNECTION, 
    ERROR_CODES.PLAYER_NOT_FOUND,
    `Player '${playerName}' not found in this game`
  ),
  
  gameNotFound: () => createError(
    ERROR_TYPES.GAME,
    ERROR_CODES.GAME_NOT_FOUND,
    'No active game session found'
  ),
  
  invalidInput: (fieldName, reason = 'invalid') => createError(
    ERROR_TYPES.VALIDATION,
    ERROR_CODES.INVALID_INPUT,
    `Invalid input: ${fieldName} is ${reason}`
  ),
  
  alreadySubmitted: (playerName) => createError(
    ERROR_TYPES.GAME,
    ERROR_CODES.ALREADY_SUBMITTED,
    `Player ${playerName} has already submitted their investment for this round`
  ),
  
  internalError: (message, details) => createError(
    ERROR_TYPES.SERVER,
    ERROR_CODES.INTERNAL_ERROR,
    message || 'Internal server error',
    details
  )
};

// Export error system
module.exports = {
  ERROR_TYPES,
  ERROR_CODES,
  createError,
  Errors
}; 