// server/socketManager.js

// Use a WeakMap for socket tracking to prevent memory leaks
const socketPlayerMap = new WeakMap();
const playerSockets = new Map();

/**
 * Track a socket-player association
 * @param {string} socketId - The unique ID of the socket
 * @param {Object} socket - The socket object
 * @param {string} playerName - The player's name
 */
function trackPlayerSocket(socketId, socket, playerName) {
  console.log(`Tracking socket ${socketId} for player ${playerName}`);
  
  // Store in both directions for efficient lookup
  socketPlayerMap.set(socket, playerName);
  
  // Update the playerSockets map
  playerSockets.set(playerName, {
    socketId,
    socket,
    lastActive: Date.now()
  });
}

/**
 * Remove tracking when socket disconnects
 * @param {Object} socket - The socket object being disconnected
 * @returns {string|null} - The player name associated with this socket, or null
 */
function untrackPlayerSocket(socket) {
  const playerName = socketPlayerMap.get(socket);
  if (playerName) {
    console.log(`Untracking socket for player ${playerName}`);
    socketPlayerMap.delete(socket);
    
    // Only delete from playerSockets if this is the current socket for this player
    const playerSocket = playerSockets.get(playerName);
    if (playerSocket && playerSocket.socket === socket) {
      playerSockets.delete(playerName);
    }
    
    return playerName;
  }
  return null;
}

/**
 * Handle player socket switching (when connecting from a new device/tab)
 * @param {Object} socket - The new socket object
 * @param {string} playerName - The player's name
 * @param {string} socketId - The new socket ID
 */
function handlePlayerSocketSwitch(socket, playerName, socketId) {
  console.log(`Checking for existing connections for player ${playerName}`);
  
  // Check if this player has another active socket
  if (playerSockets.has(playerName)) {
    const existing = playerSockets.get(playerName);
    
    // If it's a different socket, disconnect the old one
    if (existing.socketId !== socketId && existing.socket) {
      console.log(`Found old socket ${existing.socketId} for player ${playerName}`);
      
      try {
        // Send notification before disconnecting
        existing.socket.emit('error', { 
          message: 'You have connected from another device. This session is being closed.' 
        });
        
        // Untrack the old socket
        socketPlayerMap.delete(existing.socket);
        
        // Disconnect with a delay to allow error message to be sent
        setTimeout(() => {
          try {
            console.log(`Disconnecting old socket ${existing.socketId} for player ${playerName}`);
            existing.socket.disconnect(true);
          } catch (e) {
            console.error('Error disconnecting old socket:', e);
          }
        }, 100);
      } catch (err) {
        console.error('Error handling socket switch:', err);
      }
    } else {
      console.log(`Player ${playerName} reconnected with the same socket ID`);
    }
  }
  
  // Register the new socket
  trackPlayerSocket(socketId, socket, playerName);
}

/**
 * Get player name associated with a socket
 * @param {Object} socket - The socket object
 * @returns {string|null} - The player name or null
 */
function getPlayerBySocket(socket) {
  return socketPlayerMap.get(socket);
}

/**
 * Get socket object for a player
 * @param {string} playerName - The player's name
 * @returns {Object|null} - The socket or null
 */
function getSocketByPlayerName(playerName) {
  const entry = playerSockets.get(playerName);
  return entry ? entry.socket : null;
}

/**
 * Check if a player has an active socket
 * @param {string} playerName - The player's name
 * @returns {boolean} - True if player has an active socket
 */
function hasActiveSocket(playerName) {
  return playerSockets.has(playerName);
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