/**
 * client/services/socketService.js
 * Handles socket connections and reconnection logic
 */

const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_ATTEMPT_TIMEOUT = 30000; // 30 seconds

/**
 * Sets up a socket connection with proper reconnection handling
 * @param {Function} setGameState - State setter function for game state
 * @param {Function} setError - State setter function for error messages
 * @returns {Object} Socket.IO socket instance
 */
const setupSocket = (setGameState, setError) => {
  // Configure Socket.IO with sensible reconnection parameters
  const socket = io({
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // Clear any reconnection errors
    setError(null);
    
    // Update UI connection status
    setGameState(prev => ({
      ...prev, 
      connectionStatus: 'connected'
    }));
    
    // Try to rejoin game if we have player info
    const playerName = localStorage.getItem('playerName');
    if (playerName) {
      // Use a timeout to ensure connection is stable
      setTimeout(() => {
        socket.emit('player_reconnect', { playerName });
      }, 500);
    }
  });
  
  // Handle disconnects
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: 'disconnected'
    }));
    
    // No need to manually reconnect - Socket.IO does this automatically
  });
  
  // Handle reconnect failures
  socket.on('reconnect_failed', () => {
    const message = 'Connection lost. Please refresh the page to reconnect.';
    console.log(message);
    setError(message);
    
    setGameState(prev => ({
      ...prev, 
      connectionStatus: 'failed'
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
  });
  
  return socket;
};

export default setupSocket; 