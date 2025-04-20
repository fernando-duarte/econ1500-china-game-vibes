/**
 * playerManager.js
 * Efficient player-socket mapping with reduced logging and better tracking
 */

const playerSockets = new Map(); // Maps playerName to socket ID
const socketPlayers = new Map(); // Maps socket ID to playerName
const connectionTimestamps = new Map(); // Track connection times to identify stale connections

/**
 * Track a player's socket connection
 * @param {string} socketId - The socket ID
 * @param {string} playerName - The player's name
 * @returns {string|null} The previous socket ID if one existed
 */
function trackPlayerSocket(socketId, playerName) {
  if (!socketId || !playerName) {
    console.error('Cannot track socket: Invalid socketId or playerName');
    return null;
  }
  
  // Check if socket is already tracked for this player (prevents duplicate logs)
  const existingSocketId = playerSockets.get(playerName);
  if (existingSocketId === socketId) {
    // Already tracking this exact socket for this player, update timestamp only
    connectionTimestamps.set(socketId, Date.now());
    return null;
  }
  
  // Clean up old mapping if player had a different socket
  let oldSocketId = null;
  if (existingSocketId) {
    socketPlayers.delete(existingSocketId);
    connectionTimestamps.delete(existingSocketId);
    oldSocketId = existingSocketId;
    console.log(`Updated socket ID for ${playerName}: ${existingSocketId} → ${socketId}`);
  } else {
    console.log(`Tracking socket ${socketId} for player ${playerName}`);
  }
  
  // Update mappings
  playerSockets.set(playerName, socketId);
  socketPlayers.set(socketId, playerName);
  connectionTimestamps.set(socketId, Date.now());
  
  return oldSocketId;
}

/**
 * Untrack a player's socket connection
 * @param {string} socketId - The socket ID to untrack
 * @returns {string|null} The player name that was associated with this socket, or null
 */
function untrackPlayerSocket(socketId) {
  if (!socketId) return null;
  
  const playerName = socketPlayers.get(socketId);
  if (!playerName) return null;
  
  // Only untrack if this is the current socket for the player
  if (playerSockets.get(playerName) === socketId) {
    playerSockets.delete(playerName);
    console.log(`Untracking socket for player ${playerName}`);
  }
  
  socketPlayers.delete(socketId);
  connectionTimestamps.delete(socketId);
  
  return playerName;
}

/**
 * Get the socket ID currently associated with a player
 * @param {string} playerName - The player's name
 * @returns {string|null} The socket ID or null if not found
 */
function getSocketIdForPlayer(playerName) {
  return playerSockets.get(playerName) || null;
}

/**
 * Get the player name associated with a socket ID
 * @param {string} socketId - The socket ID
 * @returns {string|null} The player name or null if not found
 */
function getPlayerNameForSocket(socketId) {
  return socketPlayers.get(socketId) || null;
}

/**
 * Check if a player has an active socket connection
 * @param {string} playerName - The player's name
 * @returns {boolean} True if player has an active socket
 */
function playerHasActiveSocket(playerName) {
  return playerSockets.has(playerName);
}

/**
 * Clean up stale connections (older than 24 hours)
 * Should be called periodically to prevent memory leaks
 */
function cleanupStaleConnections() {
  const now = Date.now();
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  
  for (const [socketId, timestamp] of connectionTimestamps.entries()) {
    if (now - timestamp > DAY_IN_MS) {
      const playerName = socketPlayers.get(socketId);
      if (playerName && playerSockets.get(playerName) === socketId) {
        playerSockets.delete(playerName);
      }
      socketPlayers.delete(socketId);
      connectionTimestamps.delete(socketId);
      console.log(`Cleaned up stale connection for socket ${socketId}`);
    }
  }
}

// Export the functions
module.exports = {
  trackPlayerSocket,
  untrackPlayerSocket,
  getSocketIdForPlayer,
  getPlayerNameForSocket,
  playerHasActiveSocket,
  cleanupStaleConnections
}; 