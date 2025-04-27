/**
 * Instructor Socket Module
 * Manages all socket communication for the instructor interface
 *
 * Note: This module requires the following modules to be loaded first:
 * - connectionHandlers.js
 * - gameManagementHandlers.js
 * - playerHandlers.js
 * - roundHandlers.js
 * - roundResultsHandlers.js
 * - investmentHandlers.js
 * - resultHandlers.js
 * - notificationHandlers.js
 */
(function (window) {
  'use strict';

  // Ensure required modules are loaded
  if (!window.InstructorConnectionHandlers) {
    console.error('InstructorConnectionHandlers module not loaded');
  }
  if (!window.InstructorGameManagementHandlers) {
    console.error('InstructorGameManagementHandlers module not loaded');
  }
  if (!window.InstructorPlayerHandlers) {
    console.error('InstructorPlayerHandlers module not loaded');
  }
  if (!window.InstructorRoundHandlers) {
    console.error('InstructorRoundHandlers module not loaded');
  }
  if (!window.InstructorRoundResultsHandlers) {
    console.error('InstructorRoundResultsHandlers module not loaded');
  }
  if (!window.InstructorInvestmentHandlers) {
    console.error('InstructorInvestmentHandlers module not loaded');
  }
  if (!window.InstructorResultHandlers) {
    console.error('InstructorResultHandlers module not loaded');
  }
  if (!window.InstructorNotificationHandlers) {
    console.error('InstructorNotificationHandlers module not loaded');
  }

  /**
   * Instructor Socket module
   * @namespace
   */
  const InstructorSocket = {
    /** Socket instance */
    socket: io(),

    /**
     * Initialize all socket event listeners
     * Main entry point for socket communication
     */
    initializeSocketEvents: function () {
      // Group: Connection events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_CONNECT,
        this.handleConnect.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_DISCONNECT,
        this.handleDisconnect.bind(this)
      );

      // Group: Game management events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_CREATED,
        this.handleGameCreated.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED,
        this.handleGameStarted.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_OVER,
        this.handleGameOver.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_MANUAL_START_MODE,
        this.handleManualStartMode.bind(this)
      );

      // Group: Player events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
        this.handlePlayerJoined.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
        this.handlePlayerDisconnected.bind(this)
      );

      // Group: Round events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ROUND_START,
        this.handleRoundStart.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
        this.handleInvestmentReceived.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
        this.handleAllSubmitted.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
        this.handleRoundSummary.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_TIMER_UPDATE,
        this.handleTimerUpdate.bind(this)
      );

      // Group: Notification events
      this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, this.handleError.bind(this));
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION,
        this.handleAdminNotification.bind(this)
      );
    },

    // Import handlers from ConnectionHandlers module
    handleConnect: window.InstructorConnectionHandlers.handleConnect,
    handleDisconnect: window.InstructorConnectionHandlers.handleDisconnect,

    // Import handlers from GameManagementHandlers module
    handleGameCreated:
      window.InstructorGameManagementHandlers.handleGameCreated,
    handleGameStarted:
      window.InstructorGameManagementHandlers.handleGameStarted,
    handleManualStartMode:
      window.InstructorGameManagementHandlers.handleManualStartMode,
    updateManualStartControls:
      window.InstructorGameManagementHandlers.updateManualStartControls,
    createGame: window.InstructorGameManagementHandlers.createGame,
    setManualStartMode:
      window.InstructorGameManagementHandlers.setManualStartMode,
    startGame: window.InstructorGameManagementHandlers.startGame,
    forceEndGame: window.InstructorGameManagementHandlers.forceEndGame,

    // Import handlers from PlayerHandlers module
    handlePlayerJoined: window.InstructorPlayerHandlers.handlePlayerJoined,
    handlePlayerDisconnected:
      window.InstructorPlayerHandlers.handlePlayerDisconnected,
    updatePlayerCount: window.InstructorPlayerHandlers.updatePlayerCount,

    // Import handlers from RoundHandlers module
    handleRoundStart: window.InstructorRoundHandlers.handleRoundStart,
    handleRoundSummary: window.InstructorRoundHandlers.handleRoundSummary,
    handleTimerUpdate: window.InstructorRoundHandlers.handleTimerUpdate,

    // Import handlers from InvestmentHandlers module
    handleInvestmentReceived:
      window.InstructorInvestmentHandlers.handleInvestmentReceived,
    handleAllPlayersSubmitted:
      window.InstructorInvestmentHandlers.handleAllPlayersSubmitted,
    handleAllSubmitted: window.InstructorInvestmentHandlers.handleAllSubmitted,

    // Import handlers from RoundResultsHandlers module
    updateRoundResultsTable:
      window.InstructorRoundResultsHandlers.updateRoundResultsTable,
    createResultRow: window.InstructorRoundResultsHandlers.createResultRow,

    // Import handlers from ResultHandlers module
    handleGameOver: window.InstructorResultHandlers.handleGameOver,
    createFinalRankingsHTML:
      window.InstructorResultHandlers.createFinalRankingsHTML,

    // Import handlers from NotificationHandlers module
    handleError: window.InstructorNotificationHandlers.handleError,
    handleAdminNotification:
      window.InstructorNotificationHandlers.handleAdminNotification,
  };

  // Expose the module to window
  window.InstructorSocket = InstructorSocket;
})(window);
