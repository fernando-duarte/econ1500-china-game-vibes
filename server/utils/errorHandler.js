/**
 * errorHandler.js
 * Centralized error handling and logging
 */

// Define error types for consistent categorization
const errorTypes = {
  CONNECTION: 'CONNECTION',
  VALIDATION: 'VALIDATION',
  GAME_STATE: 'GAME_STATE',
  SERVER: 'SERVER'
};

// Keep a count of errors to prevent flooding
const errorCounts = new Map();
const ERROR_THRESHOLD = 10; // Max identical errors to log per minute
const RESET_INTERVAL = 60000; // 1 minute

// Reset error counts periodically
setInterval(() => {
  if (errorCounts.size > 0) {
    console.log(`Cleared ${errorCounts.size} error counters`);
    errorCounts.clear();
  }
}, RESET_INTERVAL);

/**
 * Safely stringify objects with circular references
 * @param {Object} obj - Object to stringify
 * @returns {string} JSON string representation
 */
function safeStringify(obj) {
  if (!obj || typeof obj !== 'object') {
    return String(obj);
  }
  
  try {
    // Handle circular references in objects
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      // Skip socket objects entirely
      if (key === 'socket' || key === 'client' || key === 'io' || key === 'adapter') {
        return '[Socket Object]';
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      // Special handling for errors
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      }
      
      return value;
    });
  } catch (err) {
    return `[Object: Stringify failed - ${err.message}]`;
  }
}

/**
 * Log an error with rate limiting
 * @param {string} type - Error type from errorTypes
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} Error object for passing to client if needed
 */
function logError(type, message, details = {}) {
  // Validate input
  if (!type || !Object.values(errorTypes).includes(type)) {
    type = errorTypes.SERVER;
  }
  
  if (!message || typeof message !== 'string') {
    message = 'Unknown error';
  }
  
  // Create error key for rate limiting
  const errorKey = `${type}:${message}`;
  
  // Increment error count
  const count = (errorCounts.get(errorKey) || 0) + 1;
  errorCounts.set(errorKey, count);
  
  // Get timestamp for logging
  const timestamp = new Date().toISOString();
  
  // Only log if under threshold
  if (count <= ERROR_THRESHOLD) {
    console.error(`ERROR [${type}] ${timestamp}: ${message}`);
    
    // Only log details for the first occurrence to avoid spam
    if (count === 1 && Object.keys(details).length > 0) {
      try {
        console.error('Details:', safeStringify(details));
      } catch (e) {
        console.error('Error details could not be logged:', e.message);
      }
    } else if (count === ERROR_THRESHOLD) {
      console.error(`Additional ${type} errors of this type will be suppressed for this interval`);
    }
  }
  
  // Create client-safe error object
  const clientError = { 
    type, 
    message, 
    timestamp,
    code: details.code || null
  };
  
  return clientError;
}

/**
 * Helper to create validation error
 * @param {string} message - Error message
 * @param {Object} details - Error details
 * @returns {Object} Error object
 */
function validationError(message, details = {}) {
  return logError(errorTypes.VALIDATION, message, details);
}

/**
 * Helper to create connection error
 * @param {string} message - Error message 
 * @param {Object} details - Error details
 * @returns {Object} Error object
 */
function connectionError(message, details = {}) {
  return logError(errorTypes.CONNECTION, message, details);
}

/**
 * Helper to create game state error
 * @param {string} message - Error message
 * @param {Object} details - Error details
 * @returns {Object} Error object
 */
function gameStateError(message, details = {}) {
  return logError(errorTypes.GAME_STATE, message, details);
}

/**
 * Helper to create server error
 * @param {string} message - Error message
 * @param {Object} details - Error details
 * @returns {Object} Error object
 */
function serverError(message, details = {}) {
  return logError(errorTypes.SERVER, message, details);
}

/**
 * Convenience class for raising errors
 */
class Errors {
  static validation(message, details = {}) {
    return validationError(message, details);
  }
  
  static connection(message, details = {}) {
    return connectionError(message, details);
  }
  
  static gameState(message, details = {}) {
    return gameStateError(message, details);
  }
  
  static server(message, details = {}) {
    return serverError(message, details);
  }
}

module.exports = {
  errorTypes,
  logError,
  validationError,
  connectionError,
  gameStateError,
  serverError,
  Errors
}; 