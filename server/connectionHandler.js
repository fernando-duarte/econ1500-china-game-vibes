/**
 * connectionHandler.js
 * Safely handles player reconnection and socket disconnection
 */

const playerManager = require('./playerManager');
const { logError, errorTypes } = require('./utils/errorHandler');

/**
 * Handles safe disconnection of a socket
 * @param {Object} io - Socket.io server instance
 * @param {string} socketId - Socket ID to disconnect 
 * @param {string} reason - Reason for disconnection
 * @param {boolean} sendNotification - Whether to send a notification before disconnecting
 * @returns {boolean} Whether the disconnection was successful
 */
function safelyDisconnectSocket(io, socketId, reason = 'disconnected', sendNotification = true) {
  if (!socketId || !io) return false;
  
  try {
    // Safe get socket instance
    const socket = io.sockets.sockets.get(socketId);
    
    // Only try to disconnect if socket exists and is connected
    if (socket && socket.connected) {
      // Set a flag to prevent multiple notifications
      if (!socket.disconnectNotified) {
        socket.disconnectNotified = true;
        
        // Notify the client before disconnecting
        if (sendNotification) {
          socket.emit('connection_status', {
            status: reason,
            message: getDisconnectionMessage(reason)
          });
        }
        
        // Give notification time to be sent before disconnecting
        setTimeout(() => {
          try {
            socket.disconnect(true);
            console.log(`Safely disconnected socket ${socketId}, reason: ${reason}`);
            return true;
          } catch (err) {
            logError(
              errorTypes.CONNECTION, 
              `Failed to disconnect socket ${socketId}`, 
              { error: err.message }
            );
            return false;
          }
        }, 500);
        
        return true;
      }
    } else {
      // Socket doesn't exist or is already disconnected
      return false;
    }
  } catch (err) {
    logError(
      errorTypes.CONNECTION, 
      `Error safely disconnecting socket ${socketId}`, 
      { error: err.message }
    );
    return false;
  }
  
  return false;
}

/**
 * Get appropriate message for disconnection reason
 */
function getDisconnectionMessage(reason) {
  switch (reason) {
    case 'replaced':
      return 'Your session has been continued on another device.';
    case 'duplicate':
      return 'You have connected from another device. This session is being closed.';
    case 'timeout':
      return 'Your session timed out due to inactivity.';
    case 'server_restart':
      return 'The server is restarting. Please reconnect in a moment.';
    default:
      return 'You have been disconnected from the server.';
  }
}

/**
 * Handle player reconnection safely
 * @param {Object} io - Socket.io server instance 
 * @param {Object} socket - New socket connection
 * @param {string} playerName - Player name
 * @param {Object} gameLogic - Game logic module
 * @returns {Object} Result with success status
 */
function handlePlayerReconnection(io, socket, playerName, gameLogic) {
  if (!socket || !playerName || !gameLogic) {
    return { 
      success: false, 
      error: 'Invalid reconnection parameters' 
    };
  }
  
  console.log(`Player ${playerName} reconnection attempt at ${new Date().toISOString()}`);
  
  try {
    // Check for existing socket
    const existingSocketId = playerManager.getSocketIdForPlayer(playerName);
    
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`Found existing socket ${existingSocketId} for player ${playerName}`);
      
      // Safely disconnect the existing socket
      const disconnected = safelyDisconnectSocket(
        io, 
        existingSocketId, 
        'replaced', 
        true
      );
      
      if (disconnected) {
        console.log(`Disconnected previous socket ${existingSocketId} for player ${playerName}`);
      } else {
        console.log(`Previous socket ${existingSocketId} could not be disconnected or was already disconnected`);
      }
    }
    
    // Track the new socket for this player
    playerManager.trackPlayerSocket(socket.id, playerName);
    
    // Mark socket as belonging to a player
    socket.playerName = playerName;
    socket.gameRole = 'player';
    
    // Attempt to reconnect the player in game state
    const result = gameLogic.playerReconnect(socket.id, playerName);
    
    if (result.success) {
      // Join the players room
      socket.join('players');
      
      // Emit connection status to the client
      socket.emit('connection_status', {
        status: 'connected',
        message: 'Successfully reconnected to the game.'
      });
      
      console.log(`Player reconnected: ${playerName}`);
      return result;
    } else {
      return {
        success: false,
        error: result.error || 'Failed to reconnect player to game state'
      };
    }
  } catch (error) {
    logError(
      errorTypes.CONNECTION, 
      `Error handling player reconnection for ${playerName}`, 
      { error: error.message }
    );
    
    return {
      success: false,
      error: 'Server error during reconnection'
    };
  }
}

/**
 * Handle player disconnection
 * @param {Object} io - Socket.io server instance
 * @param {string} socketId - Socket ID that disconnected
 * @param {Object} gameLogic - Game logic module
 */
function handlePlayerDisconnection(io, socketId, gameLogic) {
  if (!socketId) return;
  
  try {
    // Get player name from socket ID
    const playerName = playerManager.getPlayerNameForSocket(socketId);
    
    if (playerName) {
      // Only untrack if this is the current socket for this player
      if (playerManager.getSocketIdForPlayer(playerName) === socketId) {
        playerManager.untrackPlayerSocket(socketId);
        console.log(`Player ${playerName} disconnected`);
        
        // Mark this player as disconnected in the game state
        if (gameLogic && typeof gameLogic.playerDisconnect === 'function') {
          gameLogic.playerDisconnect(socketId);
        }
      } else {
        console.log(`Ignoring disconnect for outdated socket ${socketId} (player ${playerName} has a newer connection)`);
      }
    }
  } catch (error) {
    logError(
      errorTypes.CONNECTION, 
      `Error handling player disconnection for socket ${socketId}`, 
      { error: error.message }
    );
  }
}

module.exports = {
  handlePlayerReconnection,
  handlePlayerDisconnection,
  safelyDisconnectSocket
}; 