/**
 * Instructor Game Management Handlers
 * Manages game lifecycle events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Game management handlers for instructor client
   * @namespace
   */
  const GameManagementHandlers = {
    /**
     * Handle game created event
     * @param {Object} data - Game created data
     */
    handleGameCreated: function (data) {
      SocketUtils.logEvent('Game created', data);

      // Update manual start controls if info is provided
      if (data && data.manualStartEnabled !== undefined) {
        this.updateManualStartControls(data.manualStartEnabled);
      }
    },

    /**
     * Update manual start controls
     * @param {boolean} enabled - Whether manual start is enabled
     */
    updateManualStartControls: function (enabled) {
      const elements = InstructorDom.elements;

      if (elements.manualStartToggle) {
        elements.manualStartToggle.checked = enabled;
      }

      if (elements.manualStartStatus) {
        elements.manualStartStatus.textContent = enabled
          ? CONSTANTS.UI_TEXT.STATUS_ENABLED
          : CONSTANTS.UI_TEXT.STATUS_DISABLED;
      }

      if (elements.startGameButton) {
        elements.startGameButton.disabled = !enabled;
      }
    },

    /**
     * Handle game started event
     */
    handleGameStarted: function () {
      SocketUtils.logEvent('Game started');
      const elements = InstructorDom.elements;

      // Hide game setup section
      if (elements.gameSetup) {
        elements.gameSetup.classList.add(CONSTANTS.CSS.HIDDEN);
      }

      // Show game controls and player list
      if (elements.gameControls) {
        elements.gameControls.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      if (elements.playerListSection) {
        elements.playerListSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      // Make sure current investments section is visible
      if (elements.currentInvestmentsSection) {
        elements.currentInvestmentsSection.classList.remove(
          CONSTANTS.CSS.HIDDEN
        );
      }

      // Display first round immediately when game starts
      if (elements.roundNumber) {
        elements.roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
      }

      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      }
    },

    /**
     * Handle manual start mode update
     * @param {Object} data - Manual start mode data
     */
    handleManualStartMode: function (data) {
      SocketUtils.logEvent('Manual start mode update', data);

      if (data && data.enabled !== undefined) {
        this.updateManualStartControls(data.enabled);
      }
    },

    /**
     * Create a new game
     */
    createGame: function () {
      SocketUtils.logEvent('Create game request');
      this.socket.emit(CONSTANTS.SOCKET.EVENT_CREATE_GAME);
    },

    /**
     * Set manual start mode
     * @param {boolean} enabled - Whether manual start should be enabled
     */
    setManualStartMode: function (enabled) {
      SocketUtils.logEvent('Set manual start mode', { enabled });
      this.socket.emit(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, { enabled });
    },

    /**
     * Start the game
     */
    startGame: function () {
      SocketUtils.logEvent('Start game request');
      this.socket.emit(CONSTANTS.SOCKET.EVENT_START_GAME);
    },

    /**
     * Force end the current game
     */
    forceEndGame: function () {
      if (confirm(CONSTANTS.UI_TEXT.CONFIRM_FORCE_END)) {
        SocketUtils.logEvent('Force end game request');
        this.socket.emit(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME);
      }
    },
  };

  // Expose the module to window
  window.InstructorGameManagementHandlers = GameManagementHandlers;
})(window);
