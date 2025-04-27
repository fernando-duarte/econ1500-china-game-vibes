/**
 * Student Game State Handlers
 * Manages game state events for student interface
 */
(function (window) {
  'use strict';

  /**
   * Game state handlers for student client
   * @namespace
   */
  const GameStateHandlers = {
    /**
     * Handle successful game join
     * @param {Object} data - Game join data with player information
     */
    handleGameJoined: function (data) {
      SocketUtils.logEvent('Game joined', data);
      const elements = StudentDom.elements;

      // Store player name from server data
      StudentGame.state.currentPlayerName = data.playerName;

      // Update UI elements
      this.updatePlayerInfo(elements, data);
      console.log(
        `Successfully joined game as ${StudentGame.state.currentPlayerName}`
      );

      // Show game interface
      StudentDom.showGameUI();
    },

    /**
     * Update player information in UI
     * @param {Object} elements - DOM elements
     * @param {Object} data - Player data
     */
    updatePlayerInfo: function (elements, data) {
      // Update player name display
      SocketUtils.updateElementText(
        elements.displayName,
        StudentGame.state.currentPlayerName
      );

      // Set initial capital if provided
      if (data.initialCapital !== undefined) {
        SocketUtils.updateElementText(elements.capital, data.initialCapital);
        StudentGame.state.lastCapital = data.initialCapital;
      }

      // Set initial output if provided
      if (data.initialOutput !== undefined) {
        SocketUtils.updateElementText(elements.output, data.initialOutput);
        StudentGame.state.currentOutput = data.initialOutput;
        StudentGame.state.lastOutput = data.initialOutput;
      }
    },

    /**
     * Handle game started event
     */
    handleGameStarted: function () {
      SocketUtils.logEvent('Game started');
      const elements = StudentDom.elements;

      // Reset the game UI to hide game over panel and prepare for a new game
      StudentDom.resetGameUI();

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_GAME_STARTED
      );

      // Update duplicate round status if it exists
      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_GAME_STARTED;
      }

      // Ensure capital and output are displayed
      this.ensureCapitalOutputDisplayed(elements);
    },

    /**
     * Ensure capital and output values are displayed
     * @param {Object} elements - DOM elements
     */
    ensureCapitalOutputDisplayed: function (elements) {
      if (
        elements.capital &&
        elements.capital.textContent === '-' &&
        StudentGame.state.lastCapital
      ) {
        elements.capital.textContent = StudentGame.state.lastCapital;
      }
      if (
        elements.output &&
        elements.output.textContent === '-' &&
        StudentGame.state.lastOutput
      ) {
        elements.output.textContent = StudentGame.state.lastOutput;
      }
    },

    /**
     * Handle timer update event
     * @param {Object} data - Timer data
     */
    handleTimerUpdate: function (data) {
      SocketUtils.logEvent('Timer update', data);

      const elements = StudentDom.elements;
      if (elements.timer && data.timeRemaining !== undefined) {
        elements.timer.textContent = data.timeRemaining;

        // Add warning class when time is running low
        if (data.timeRemaining <= 10) {
          elements.timer.classList.add('timer-warning');
        } else {
          elements.timer.classList.remove('timer-warning');
        }
      }
    },
  };

  // Export the handlers to the global scope
  window.GameStateHandlers = GameStateHandlers;
})(window);
