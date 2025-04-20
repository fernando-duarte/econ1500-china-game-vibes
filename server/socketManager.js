// server/socketManager.js

/**
 * DEPRECATED: This module is being phased out in favor of playerManager.js
 * Only keeping for backward compatibility with legacy code
 */

const playerManager = require('./playerManager');

/**
 * Track a socket-player association
 * @param {string} socketId - The unique ID of the socket
 * @param {Object} socket - The socket object
 * @param {string} playerName - The player's name
 */
function trackPlayerSocket(socketId, socket, playerName) {
  console.log(`[DEPRECATED] Tracking socket ${socketId} for player ${playerName} via socketManager`);
  // Forward to the proper playerManager implementation
  playerManager.trackPlayerSocket(socketId, playerName);
}

/**
 * Remove tracking when socket disconnects
 * @param {Object} socket - The socket object being disconnected
 * @returns {string|null} - The player name associated with this socket, or null
 */
function untrackPlayerSocket(socket) {
  if (!socket || !socket.id) {
    console.error('[DEPRECATED] Invalid socket passed to untrackPlayerSocket');
    return null;
  }
  
  console.log(`[DEPRECATED] Untracking socket ${socket.id} via socketManager`);
  // Forward to the proper playerManager implementation
  return playerManager.untrackPlayerSocket(socket.id);
}

/**
 * Handle player socket switching (when connecting from a new device/tab)
 * @param {Object} socket - The new socket object
 * @param {string} playerName - The player's name
 * @param {string} socketId - The new socket ID
 */
function handlePlayerSocketSwitch(socket, playerName, socketId) {
  console.log(`[DEPRECATED] Checking for existing connections for player ${playerName} via socketManager`);
  
  // Forward to connection handler which has proper socket switching logic
  const connectionHandler = require('./connectionHandler');
  connectionHandler.handleSocketSwitch(global.io, socket, playerName, socketId);
}

/**
 * Get player name associated with a socket
 * @param {Object} socket - The socket object
 * @returns {string|null} - The player name or null
 */
function getPlayerBySocket(socket) {
  if (!socket || !socket.id) {
    return null;
  }
  return playerManager.getPlayerNameForSocket(socket.id);
}

/**
 * Get socket object for a player
 * @param {string} playerName - The player's name
 * @returns {Object|null} - The socket or null
 */
function getSocketByPlayerName(playerName) {
  const socketId = playerManager.getSocketIdForPlayer(playerName);
  
  // If we have an io instance and a socketId, return the actual socket
  if (global.io && socketId) {
    try {
      return global.io.sockets.sockets.get(socketId);
    } catch (e) {
      console.error(`Error getting socket for player ${playerName}:`, e);
    }
  }
  
  return null;
}

/**
 * Check if a player has an active socket
 * @param {string} playerName - The player's name
 * @returns {boolean} - True if player has an active socket
 */
function hasActiveSocket(playerName) {
  return playerManager.playerHasActiveSocket(playerName);
}

// Export functions for use in other files
module.exports = {
  trackPlayerSocket,
  untrackPlayerSocket,
  handlePlayerSocketSwitch,
  getPlayerBySocket,
  getSocketByPlayerName,
  hasActiveSocket
}; 