/**
 * Student Connection Handlers
 * Manages socket connection events for student interface
 */
(function (window) {
  'use strict';

  /**
   * Connection handlers for student client
   * @namespace
   */
  const ConnectionHandlers = {
    /**
     * Handle connection to server
     */
    handleConnect: function () {
      SocketUtils.logEvent('Connect', { socketId: this.socket.id });

      // Request student list immediately after connection
      console.log('Connected to server, requesting student list...');
      setTimeout(() => {
        window.TeamHandlers.getStudentList();
      }, 500);
    },

    /**
     * Handle disconnection from server
     */
    handleDisconnect: function () {
      SocketUtils.logEvent('Disconnect');
      StudentGame.stopTimer();
    },
  };

  // Expose the module to window
  window.StudentConnectionHandlers = ConnectionHandlers;
  // Alias so other modules referencing window.ConnectionHandlers continue to work
  window.ConnectionHandlers = ConnectionHandlers;
})(window);
