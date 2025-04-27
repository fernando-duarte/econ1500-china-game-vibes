// client/modules/student/socket.js
/**
 * Student Socket Module
 * Manages all socket communication for student game interface
 *
 * Note: This module requires the following modules to be loaded first:
 * - connectionHandlers.js
 * - teamHandlers.js
 * - gameStateHandlers.js
 * - roundHandlers.js
 * - resultHandlers.js
 * - utilityHandlers.js
 */
(function (window) {
  'use strict';

  // Ensure required modules are loaded
  if (!window.ConnectionHandlers) {
    console.error('ConnectionHandlers module not loaded');
  }
  if (!window.TeamHandlers) {
    console.error('TeamHandlers module not loaded');
  }
  if (!window.GameStateHandlers) {
    console.error('GameStateHandlers module not loaded');
  }
  if (!window.RoundHandlers) {
    console.error('RoundHandlers module not loaded');
  }
  if (!window.ResultHandlers) {
    console.error('ResultHandlers module not loaded');
  }
  if (!window.UtilityHandlers) {
    console.error('UtilityHandlers module not loaded');
  }

  /**
   * Student Socket module - handles all socket communication for student client
   * @namespace
   */
  const StudentSocket = {
    /** Socket instance */
    socket: io(),

    /**
     * Initialize all socket event listeners
     * Main entry point for socket communication
     */
    initializeSocketEvents: function () {
      // Group: Connection events - from connectionHandlers.js
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_CONNECT,
        this.handleConnect.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_DISCONNECT,
        this.handleDisconnect.bind(this)
      );

      // Test event
      this.socket.on('test_event', (data) => {
        console.log('Received test_event from server:', data);
        // Explicitly request student list after receiving test event
        this.getStudentList();
      });

      // Group: Team registration events - from teamHandlers.js
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_STUDENT_LIST,
        this.handleStudentList.bind(this)
      );
      this.socket.on(
        'student_list_updated',
        this.handleStudentListUpdated.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_TEAM_REGISTERED,
        this.handleTeamRegistered.bind(this)
      );
      this.socket.on(
        'team_registration_error',
        this.handleTeamRegistrationError.bind(this)
      );

      // Group: Game state events - from gameStateHandlers.js
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_JOINED,
        this.handleGameJoined.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED,
        this.handleGameStarted.bind(this)
      );

      // Group: Round events - from roundHandlers.js
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
        CONSTANTS.SOCKET.EVENT_ROUND_END,
        this.handleRoundEnd.bind(this)
      );

      // Group: Result events - from resultHandlers.js
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_OVER,
        this.handleGameOver.bind(this)
      );

      // Group: Utility events - from utilityHandlers.js
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
        this.handleStateSnapshot.bind(this)
      );
      this.socket.on('timer_update', this.handleTimerUpdate.bind(this));
      this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, this.handleError.bind(this));
      this.socket.on(
        'admin_notification',
        this.handleAdminNotification.bind(this)
      );
    },

    // Import handlers from ConnectionHandlers module
    handleConnect: window.ConnectionHandlers.handleConnect,
    handleDisconnect: window.ConnectionHandlers.handleDisconnect,

    // Import handlers from TeamHandlers module
    handleStudentList: window.TeamHandlers.handleStudentList,
    handleStudentListUpdated: window.TeamHandlers.handleStudentListUpdated,
    handleTeamRegistered: window.TeamHandlers.handleTeamRegistered,
    handleTeamRegistrationError:
      window.TeamHandlers.handleTeamRegistrationError,
    getStudentList: window.TeamHandlers.getStudentList,
    registerTeam: window.TeamHandlers.registerTeam,

    // Import handlers from GameStateHandlers module
    handleGameJoined: window.GameStateHandlers.handleGameJoined,
    handleGameStarted: window.GameStateHandlers.handleGameStarted,
    updatePlayerInfo: window.GameStateHandlers.updatePlayerInfo,
    ensureCapitalOutputDisplayed:
      window.GameStateHandlers.ensureCapitalOutputDisplayed,

    // Import handlers from RoundHandlers module
    handleRoundStart: window.RoundHandlers.handleRoundStart,
    handleInvestmentReceived: window.RoundHandlers.handleInvestmentReceived,
    handleAllSubmitted: window.RoundHandlers.handleAllSubmitted,
    handleRoundEnd: window.RoundHandlers.handleRoundResults,
    updateCapitalOutput: window.RoundHandlers.updateCapitalOutput,
    configureInvestmentUI: window.RoundHandlers.configureInvestmentUI,

    // Import handlers from ResultHandlers module
    handleGameOver: window.ResultHandlers.handleGameOver,
    updateGameOverResults: window.ResultHandlers.updateGameOverResults,

    // Import handlers from UtilityHandlers module
    handleStateSnapshot: window.UtilityHandlers.handleStateSnapshot,
    handleTimerUpdate: window.GameStateHandlers.handleTimerUpdate,
    handleError: window.UtilityHandlers.handleError,
    handleAdminNotification: window.UtilityHandlers.handleAdminNotification,
  };

  // Expose the module to window
  window.StudentSocket = StudentSocket;
})(window);
