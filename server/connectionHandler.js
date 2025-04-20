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
 * @returns {Promise<boolean>} Promise that resolves to whether the disconnection was successful
 */
function safelyDisconnectSocket(io, socketId, reason = 'disconnected', sendNotification = true) {
  return new Promise((resolve) => {
    if (!socketId || !io) {
      resolve(false);
      return;
    }
    
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
              resolve(true);
            } catch (err) {
              logError(
                errorTypes.CONNECTION, 
                `Failed to disconnect socket ${socketId}`, 
                { error: err.message }
              );
              resolve(false);
            }
          }, 500);
        } else {
          // Already notified, just resolve
          resolve(false);
        }
      } else {
        // Socket doesn't exist or is already disconnected
        resolve(false);
      }
    } catch (err) {
      logError(
        errorTypes.CONNECTION, 
        `Error safely disconnecting socket ${socketId}`, 
        { error: err.message }
      );
      resolve(false);
    }
  });
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
 * Handle player socket switching (when connecting from a new device/tab)
 * @param {Object} io - Socket.io server instance
 * @param {Object} socket - The new socket object
 * @param {string} playerName - The player's name
 * @param {string} socketId - The new socket ID
 */
async function handleSocketSwitch(io, socket, playerName, socketId) {
  if (!io || !socket || !playerName || !socketId) {
    console.error('Missing required parameters for handleSocketSwitch');
    return false;
  }
  
  console.log(`Checking for existing connections for player ${playerName}`);
  
  // Check if this player has another active socket
  const existingSocketId = playerManager.getSocketIdForPlayer(playerName);
  
  if (existingSocketId && existingSocketId !== socketId) {
    console.log(`Found old socket ${existingSocketId} for player ${playerName}`);
    
    // Disconnect the old socket safely
    try {
      const disconnected = await safelyDisconnectSocket(
        io, 
        existingSocketId, 
        'duplicate', 
        true
      );
      
      if (disconnected) {
        console.log(`Disconnected old socket ${existingSocketId} for player ${playerName}`);
      } else {
        console.log(`Old socket ${existingSocketId} already disconnected or not found`);
      }
    } catch (err) {
      console.error('Error during socket switch:', err);
    }
  } else if (existingSocketId === socketId) {
    console.log(`Player ${playerName} reconnected with the same socket ID - no switch needed`);
    return true;
  }
  
  // Register the new socket
  playerManager.trackPlayerSocket(socketId, playerName);
  return true;
}

/**
 * Handle player reconnection safely
 * @param {Object} io - Socket.io server instance 
 * @param {Object} socket - New socket connection
 * @param {string} playerName - Player name
 * @param {Object} gameLogic - Game logic module
 * @returns {Object} Result with success status
 */
async function handlePlayerReconnection(io, socket, playerName, gameLogic) {
  if (!socket || !playerName || !gameLogic) {
    return { 
      success: false, 
      error: 'Invalid reconnection parameters' 
    };
  }
  
  console.log(`Player ${playerName} reconnection attempt at ${new Date().toISOString()}`);
  
  try {
    // Validate that the player exists in the game
    const playerExists = gameLogic.game && 
                        gameLogic.game.players && 
                        gameLogic.game.players[playerName];
    
    if (!playerExists) {
      // Check if game is accepting new players
      const canJoinAsNew = !gameLogic.game.isGameRunning || 
                           (gameLogic.game.isGameRunning && gameLogic.game.allowLateJoins);
      
      console.log(`Player ${playerName} not found in game state, cannot reconnect. Can join as new: ${canJoinAsNew}`);
      
      return {
        success: false,
        error: 'Player not found in the current game',
        notFound: true,
        canJoinAsNew: canJoinAsNew,
        gameInProgress: gameLogic.game.isGameRunning,
        message: canJoinAsNew ? 
          'You were not found in the current game. Would you like to join as a new player?' :
          'You were not found in the current game and new players cannot join at this time.'
      };
    }
    
    // Check for existing socket
    const existingSocketId = playerManager.getSocketIdForPlayer(playerName);
    
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`Found existing socket ${existingSocketId} for player ${playerName}`);
      
      // Safely disconnect the existing socket
      try {
        const disconnected = await safelyDisconnectSocket(
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
      } catch (err) {
        console.error('Error during reconnection socket handling:', err);
        // Continue despite error - we'll override the tracking anyway
      }
    } else if (existingSocketId === socket.id) {
      console.log(`Player ${playerName} is already using this socket ID ${socket.id}, no need to reconnect`);
    }
    
    // Always track the new socket for this player
    playerManager.trackPlayerSocket(socket.id, playerName);
    
    // Mark socket as belonging to a player
    socket.playerName = playerName;
    socket.gameRole = 'player';
    
    // Update player connection status in game state
    if (gameLogic.game.players[playerName]) {
      gameLogic.game.players[playerName].connected = true;
    }
    
    // Get player data from game state for the response
    const playerState = gameLogic.game.players[playerName];
    const capital = playerState ? playerState.capital : 0;
    const output = playerState ? playerState.output : 0;
    
    // Join the players room
    socket.join('players');
    
    // Emit connection status to the client
    socket.emit('connection_status', {
      status: 'connected',
      message: 'Successfully reconnected to the game.'
    });
    
    console.log(`Player successfully reconnected: ${playerName}`);
    
    // Send back player state in response
    return {
      success: true,
      playerName,
      capital,
      output,
      roundNumber: gameLogic.game.round,
      hasSubmitted: playerState ? playerState.investment !== null : false,
      isGameRunning: gameLogic.game.isGameRunning
    };
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
  safelyDisconnectSocket,
  handleSocketSwitch
}; 