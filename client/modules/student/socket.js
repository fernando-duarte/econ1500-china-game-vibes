// client/modules/student/socket.js
/**
 * Student Socket Module
 * Central module for all student socket.io communication
 * Aggregates all event handlers from separate modules
 */
(function (window) {
  'use strict';

  // Shorthand for constants
  const CONSTANTS = window.CONSTANTS;

  /**
   * Student Socket module - handles all socket communication for student client
   * @namespace
   */
  const StudentSocket = {
    /** Socket instance */
    socket: null,

    /** Track socket initialization state */
    initialized: false,

    /**
     * Create and initialize socket connection
     */
    createSocket: function () {
      try {
        console.log('Creating socket.io connection...');

        // First check if we already have a socket instance
        if (this.socket && this.socket.connected) {
          console.log(
            'Socket already exists and is connected:',
            this.socket.id
          );
          window.socket = this.socket; // Make sure it's globally available
          return this.socket;
        }

        // Check if there's a window.socket already
        if (window.socket) {
          console.log('Using existing window.socket:', window.socket.id);
          this.socket = window.socket;
          return this.socket;
        }

        // Create a new socket with more reliable options
        this.socket = io({
          reconnectionAttempts: 10,
          timeout: 20000,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          forceNew: false, // Don't force a new connection if one exists
          autoConnect: true, // Auto connect
        });
        console.log('Socket.io connection created');

        // Make socket available globally
        window.socket = this.socket;

        // Basic error listener – keep minimal listeners here. Detailed
        // event handling (including `connect` and `student_list`) is now
        // centralized in `initializeSocketEvents` to avoid duplicate event
        // processing and redundant student list requests.

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        return this.socket;
      } catch (error) {
        console.error('Error creating socket connection:', error);
        return null;
      }
    },

    /**
     * Initialize all socket event listeners
     * Main entry point for socket communication
     */
    initializeSocketEvents: function () {
      // Create socket if not already done
      if (!this.socket) {
        this.createSocket();
      }

      if (!this.socket) {
        console.error(
          'Failed to initialize socket - cannot attach event handlers'
        );
        return;
      }

      // Track and log connection status changes
      this.socket.on('connect', () => {
        console.log(`Socket connected with ID: ${this.socket.id}`);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt #${attemptNumber}`);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        // Request student list after reconnection
        setTimeout(() => this.getStudentList(), 500);
      });

      // Make socket available globally and in handler modules
      window.socket = this.socket;

      // Set socket reference in all handler modules
      if (window.TeamHandlers) {
        window.TeamHandlers.socket = this.socket;
      }
      if (window.GameStateHandlers) {
        window.GameStateHandlers.socket = this.socket;
      }
      if (window.RoundHandlers) {
        window.RoundHandlers.socket = this.socket;
      }
      if (window.ResultHandlers) {
        window.ResultHandlers.socket = this.socket;
      }
      if (window.UtilityHandlers) {
        window.UtilityHandlers.socket = this.socket;
      }

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
      console.log(
        `Attaching listener for ${CONSTANTS.SOCKET.EVENT_STUDENT_LIST}`
      );
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

      this.initialized = true;
      console.log('Socket event handlers initialized');
    },

    // Import handlers from ConnectionHandlers module
    handleConnect: function () {
      console.log(
        `Socket connected, ID: ${this.socket.id}, time: ${new Date().toISOString()}`
      );

      // Initial student list request now handled by StudentConnectionHandlers

      if (
        window.ConnectionHandlers &&
        window.ConnectionHandlers.handleConnect
      ) {
        return window.ConnectionHandlers.handleConnect.apply(this, arguments);
      }
    },

    handleDisconnect: function () {
      console.log(`Socket disconnected at ${new Date().toISOString()}`);

      if (
        window.ConnectionHandlers &&
        window.ConnectionHandlers.handleDisconnect
      ) {
        return window.ConnectionHandlers.handleDisconnect.apply(
          this,
          arguments
        );
      }
    },

    // Import handlers from TeamHandlers module
    handleStudentList: function (data) {
      console.log(
        `Student list received at ${new Date().toISOString()}:`,
        data
          ? `${data.allStudents ? data.allStudents.length : 0} students`
          : 'no data'
      );

      if (window.TeamHandlers && window.TeamHandlers.handleStudentList) {
        return window.TeamHandlers.handleStudentList(data);
      }
    },

    handleStudentListUpdated: function (data) {
      console.log(
        `Student list updated received at ${new Date().toISOString()}`
      );

      if (window.TeamHandlers && window.TeamHandlers.handleStudentListUpdated) {
        return window.TeamHandlers.handleStudentListUpdated(data);
      }
    },

    handleTeamRegistered: function (data) {
      if (window.TeamHandlers && window.TeamHandlers.handleTeamRegistered) {
        return window.TeamHandlers.handleTeamRegistered(data);
      }
    },

    handleTeamRegistrationError: function (data) {
      if (
        window.TeamHandlers &&
        window.TeamHandlers.handleTeamRegistrationError
      ) {
        return window.TeamHandlers.handleTeamRegistrationError(data);
      }
    },

    getStudentList: function () {
      console.log(
        `StudentSocket.getStudentList called at ${new Date().toISOString()}`
      );

      if (!this.socket) {
        console.error('Socket not initialized in StudentSocket.getStudentList');
        this.createSocket(); // Try to create socket
      }

      if (!this.socket) {
        console.error('Failed to create socket in getStudentList');
        return;
      }

      if (!this.socket.connected) {
        console.warn('Socket not connected when trying to get student list');

        // Schedule retry after connection
        this.socket.once('connect', () => {
          console.log('Socket reconnected, retrying getStudentList');
          setTimeout(() => this.getStudentList(), 500);
        });

        return;
      }

      if (window.TeamHandlers && window.TeamHandlers.getStudentList) {
        console.log('Delegating to TeamHandlers.getStudentList');
        return window.TeamHandlers.getStudentList();
      } else {
        console.error('TeamHandlers.getStudentList is not available');
        // Fallback implementation
        console.log('Using fallback to request student list from server...');
        const socket = window.socket || this.socket;
        if (socket) {
          const eventName = CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST;
          console.log(`Sending event: ${eventName}`);
          socket.emit(eventName);
          console.log(`Sent ${eventName} event to server`);
        } else {
          console.error('Socket not available to request student list');
        }
      }
    },

    registerTeam: function (teamName, students) {
      if (window.TeamHandlers && window.TeamHandlers.registerTeam) {
        return window.TeamHandlers.registerTeam(teamName, students);
      }
    },

    // Import handlers from GameStateHandlers module
    handleGameJoined: function (data) {
      if (
        window.GameStateHandlers &&
        window.GameStateHandlers.handleGameJoined
      ) {
        return window.GameStateHandlers.handleGameJoined(data);
      }
    },

    handleGameStarted: function (data) {
      if (
        window.GameStateHandlers &&
        window.GameStateHandlers.handleGameStarted
      ) {
        return window.GameStateHandlers.handleGameStarted(data);
      }
    },

    // Import handlers from RoundHandlers module
    handleRoundStart: function (data) {
      if (window.RoundHandlers && window.RoundHandlers.handleRoundStart) {
        return window.RoundHandlers.handleRoundStart(data);
      }
    },

    handleInvestmentReceived: function (data) {
      if (
        window.RoundHandlers &&
        window.RoundHandlers.handleInvestmentReceived
      ) {
        return window.RoundHandlers.handleInvestmentReceived(data);
      }
    },

    handleAllSubmitted: function (data) {
      if (window.RoundHandlers && window.RoundHandlers.handleAllSubmitted) {
        return window.RoundHandlers.handleAllSubmitted(data);
      }
    },

    handleRoundEnd: function (data) {
      if (window.RoundHandlers && window.RoundHandlers.handleRoundEnd) {
        return window.RoundHandlers.handleRoundEnd(data);
      }
    },

    // Import handlers from ResultHandlers module
    handleGameOver: function (data) {
      if (window.ResultHandlers && window.ResultHandlers.handleGameOver) {
        return window.ResultHandlers.handleGameOver(data);
      }
    },

    // Import handlers from UtilityHandlers module
    handleStateSnapshot: function (data) {
      if (
        window.UtilityHandlers &&
        window.UtilityHandlers.handleStateSnapshot
      ) {
        return window.UtilityHandlers.handleStateSnapshot(data);
      }
    },

    handleTimerUpdate: function (data) {
      if (window.UtilityHandlers && window.UtilityHandlers.handleTimerUpdate) {
        return window.UtilityHandlers.handleTimerUpdate(data);
      }
    },

    handleError: function (data) {
      if (window.UtilityHandlers && window.UtilityHandlers.handleError) {
        return window.UtilityHandlers.handleError(data);
      }
    },

    handleAdminNotification: function (data) {
      if (
        window.UtilityHandlers &&
        window.UtilityHandlers.handleAdminNotification
      ) {
        return window.UtilityHandlers.handleAdminNotification(data);
      }
    },
  };

  // Expose the module to window
  window.StudentSocket = StudentSocket;
})(window);
