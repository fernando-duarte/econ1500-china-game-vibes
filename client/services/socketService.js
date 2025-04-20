/**
 * client/services/socketService.js
 * Handles socket connections and reconnection logic
 */

const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_ATTEMPT_TIMEOUT = 30000; // 30 seconds
const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  REPLACED: 'replaced',
  SERVER_RESTART: 'server_restart'
};

/**
 * Sets up a socket connection with proper reconnection handling
 * @param {Function} setGameState - State setter function for game state
 * @param {Function} setError - State setter function for error messages
 * @returns {Object} Socket.IO socket instance
 */
const setupSocket = (setGameState, setError) => {
  // First set status to connecting
  setGameState(prev => ({
    ...prev, 
    connectionStatus: CONNECTION_STATES.CONNECTING
  }));
  
  // Configure Socket.IO with sensible reconnection parameters
  const socket = io({
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // Clear any reconnection errors
    setError(null);
    
    // Update UI connection status
    setGameState(prev => ({
      ...prev, 
      connectionStatus: CONNECTION_STATES.CONNECTED
    }));
    
    // Set up periodic connection check
    startConnectionCheck(socket);
    
    // Try to rejoin game if we have player info
    tryReconnect(socket);
  });
  
  // Periodic connection check to ensure connection is working
  let connectionCheckInterval = null;
  
  function startConnectionCheck(socket) {
    // Clear any existing interval
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
    
    // Check connection every 30 seconds
    connectionCheckInterval = setInterval(() => {
      // Only check if the socket reports as connected
      if (socket.connected) {
        let responseReceived = false;
        
        // Send a ping and wait for response
        socket.emit('connection_check', {}, (response) => {
          responseReceived = true;
          console.log('Connection check successful');
        });
        
        // Set a timeout to handle no response
        setTimeout(() => {
          if (!responseReceived) {
            console.warn('Connection check failed - no response');
            
            // Socket thinks it's connected but server isn't responding
            setGameState(prev => ({
              ...prev, 
              connectionStatus: CONNECTION_STATES.DISCONNECTED
            }));
            
            setError('Connection lost. Attempting to reconnect...');
            
            // Try to reconnect manually
            try {
              socket.disconnect();
              setTimeout(() => {
                socket.connect();
              }, 1000);
            } catch (err) {
              console.error('Error during manual reconnect:', err);
            }
          }
        }, 5000);
      }
    }, 30000);
  }
  
  // Try to reconnect with stored player data
  function tryReconnect(socket) {
    // Get stored player data - first check for newer object
    let playerData = null;
    try {
      const stateString = localStorage.getItem('playerGameState');
      if (stateString) {
        playerData = JSON.parse(stateString);
      }
    } catch (err) {
      console.error('Error parsing stored game state:', err);
    }
    
    // Fall back to old storage key if new one wasn't found
    if (!playerData || !playerData.playerName) {
      const playerName = localStorage.getItem('playerName') || 
                          localStorage.getItem('solowGame_playerName');
      
      if (playerName) {
        playerData = { playerName };
      }
    }
    
    // If we have player data, try to reconnect
    if (playerData && playerData.playerName) {
      console.log(`Attempting to reconnect as ${playerData.playerName}`);
      
      // Add handler for failed reconnection that allows joining as new player
      socket.once('join_ack', (data) => {
        if (!data.success && data.notFound && data.canJoinAsNew) {
          // Ask user if they want to join as a new player
          setError(data.message || 'You were not found in the game. Join as a new player?');
          
          // The UI should provide a way for the user to confirm joining as a new player
          // For now, just store that this player wasn't found 
          window.playerNotFound = true;
          window.canJoinAsNew = data.canJoinAsNew;
        }
      });
      
      // Use a timeout to ensure connection is stable
      setTimeout(() => {
        socket.emit('join_game', { 
          playerName: playerData.playerName,
          isReconnect: true
        });
      }, 500);
    }
  }
  
  // Handle disconnects
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    
    // Stop connection check
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
    
    // Don't show disconnected status if we're being redirected or replaced
    const statusInfo = getStatusFromReason(reason);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: statusInfo.status
    }));
    
    if (statusInfo.message) {
      setError(statusInfo.message);
    }
    
    // If there was a clean disconnect, don't try to reconnect
    if (reason === 'io client disconnect') {
      console.log('Client initiated disconnect - not attempting reconnection');
    }
  });
  
  // Add connect_error handler
  socket.on('connect_error', (error) => {
    console.log('Connection error:', error);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: CONNECTION_STATES.DISCONNECTED
    }));
    
    setError('Unable to connect to the server. Please check your internet connection.');
  });
  
  // Handle reconnect attempts
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}/${MAX_RECONNECTION_ATTEMPTS}`);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: CONNECTION_STATES.CONNECTING
    }));
    
    setError(`Attempting to reconnect (${attemptNumber}/${MAX_RECONNECTION_ATTEMPTS})...`);
  });
  
  // Handle reconnect failures
  socket.on('reconnect_failed', () => {
    const message = 'Connection lost. Please refresh the page to reconnect.';
    console.log(message);
    setError(message);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: CONNECTION_STATES.FAILED
    }));
  });
  
  // Handle connection status messages
  socket.on('connection_status', (data) => {
    console.log('Connection status:', data.status);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: data.status
    }));
    
    if (data.message) {
      setError(data.message);
    }
    
    // Special handling for server restart
    if (data.status === CONNECTION_STATES.SERVER_RESTART) {
      // Set timeout to auto-refresh page after some time
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
    
    // If replaced, don't try to reconnect
    if (data.status === CONNECTION_STATES.REPLACED) {
      socket.disconnect();
    }
  });
  
  return socket;
};

/**
 * Get connection status and message from disconnect reason
 * @param {string} reason - Socket.IO disconnect reason
 * @returns {Object} Status object with status code and message
 */
function getStatusFromReason(reason) {
  switch (reason) {
    case 'io server disconnect':
      return {
        status: CONNECTION_STATES.DISCONNECTED,
        message: 'Disconnected by the server. The game session may have ended.'
      };
    case 'transport close':
      return {
        status: CONNECTION_STATES.DISCONNECTED,
        message: 'Connection to server lost. Attempting to reconnect...'
      };
    case 'ping timeout':
      return {
        status: CONNECTION_STATES.DISCONNECTED,
        message: 'Connection timed out. Attempting to reconnect...'
      };
    case 'transport error':
      return {
        status: CONNECTION_STATES.DISCONNECTED,
        message: 'Network error occurred. Attempting to reconnect...'
      };
    default:
      return {
        status: CONNECTION_STATES.DISCONNECTED,
        message: null // No need for a message for other reasons
      };
  }
}

export default setupSocket; 