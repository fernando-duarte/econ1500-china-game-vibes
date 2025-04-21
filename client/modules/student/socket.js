// client/modules/socket.js
/**
 * Student Socket Module
 * Manages all socket communication for student game interface
 */
(function (window) {
  'use strict';

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
      // Group: Connection events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_CONNECT,
        this.handleConnect.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_DISCONNECT,
        this.handleDisconnect.bind(this),
      );

      // Group: Game state events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_JOINED,
        this.handleGameJoined.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED,
        this.handleGameStarted.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ROUND_START,
        this.handleRoundStart.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
        this.handleInvestmentReceived.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
        this.handleAllSubmitted.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ROUND_END,
        this.handleRoundEnd.bind(this),
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_GAME_OVER,
        this.handleGameOver.bind(this),
      );

      // Group: Utility events
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
        this.handleStateSnapshot.bind(this),
      );
      this.socket.on('timer_update', this.handleTimerUpdate.bind(this));
      this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, this.handleError.bind(this));
      this.socket.on(
        'admin_notification',
        this.handleAdminNotification.bind(this),
      );
    },

    /**
     * Handle connection to server
     */
    handleConnect: function () {
      SocketUtils.logEvent('Connect', { socketId: this.socket.id });
    },

    /**
     * Handle disconnection from server
     */
    handleDisconnect: function () {
      SocketUtils.logEvent('Disconnect');
      StudentGame.stopTimer();
    },

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
        `Successfully joined game as ${StudentGame.state.currentPlayerName}`,
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
        StudentGame.state.currentPlayerName,
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

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_GAME_STARTED,
      );

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
     * Handle round start event
     * @param {Object} data - Round data
     */
    handleRoundStart: function (data) {
      SocketUtils.logEvent('Round start', data);
      const elements = StudentDom.elements;

      // Update round number
      SocketUtils.updateElementText(elements.roundNumber, data.roundNumber);

      // Update capital and output values
      this.updateCapitalOutput(elements, data);

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS,
      );

      // Configure investment UI for new round
      this.configureInvestmentUI(elements, data);

      // Initialize timer with the server's time
      SocketUtils.updateElementText(elements.timer, data.timeRemaining);
    },

    /**
     * Update capital and output values
     * @param {Object} elements - DOM elements
     * @param {Object} data - Game data
     */
    updateCapitalOutput: function (elements, data) {
      if (data.capital !== undefined && elements.capital) {
        elements.capital.textContent = data.capital;
        StudentGame.state.lastCapital = data.capital;
      }

      if (data.output !== undefined && elements.output) {
        elements.output.textContent = data.output;
        StudentGame.state.currentOutput = data.output;
        StudentGame.state.lastOutput = data.output;
      }
    },

    /**
     * Configure investment UI for new round
     * @param {Object} elements - DOM elements
     * @param {Object} data - Round data
     */
    configureInvestmentUI: function (elements, data) {
      // Configure investment slider
      if (elements.investmentSlider) {
        elements.investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
        elements.investmentSlider.max = data.output;
        elements.investmentSlider.value = CONSTANTS.INVESTMENT_MIN;
      }

      // Configure investment value input
      if (elements.investmentValue) {
        elements.investmentValue.value = CONSTANTS.INVESTMENT_MIN;
      }

      // Update max output display
      SocketUtils.updateElementText(elements.maxOutput, data.output);

      // Reset investment state
      StudentGame.resetInvestmentState();

      // Show investment UI
      StudentDom.showInvestmentUI();
    },

    /**
     * Handle investment received confirmation
     * @param {Object} data - Investment data
     */
    handleInvestmentReceived: function (data) {
      SocketUtils.logEvent('Investment received', data);

      // Update UI to show investment was received
      const element = StudentDom.elements.investmentResult;
      if (element && data && data.investment !== undefined) {
        element.textContent = data.investment;
      }
    },

    /**
     * Handle all students submitted event
     * @param {Object} data - Submission data
     */
    handleAllSubmitted: function (data) {
      SocketUtils.logEvent('All submitted', data);
      const elements = StudentDom.elements;

      // Show message that round is ending early
      if (elements.investmentStatus && data.message) {
        elements.investmentStatus.innerHTML = `<span class="all-submitted-message">${data.message}</span>`;
      }

      // Disable controls if not already submitted
      if (!StudentGame.state.hasSubmittedInvestment) {
        StudentGame.disableInvestmentControls();
      }

      // Adjust timer display
      if (elements.timer) {
        elements.timer.classList.add('timer-ending');
        elements.timer.textContent = CONSTANTS.UI_TEXT.STATUS_ENDING;
      }

      // Stop the current timer
      StudentGame.stopTimer();
    },

    /**
     * Handle round end event
     * @param {Object} data - Round end data
     */
    handleRoundEnd: function (data) {
      SocketUtils.logEvent('Round end', data);
      const elements = StudentDom.elements;

      // Stop the timer
      StudentGame.stopTimer();

      // Update capital and output values
      this.updateRoundEndResults(elements, data);

      // Hide investment UI and show round results
      StudentDom.showRoundResults();

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED,
      );
    },

    /**
     * Update UI with round end results
     * @param {Object} elements - DOM elements
     * @param {Object} data - Round end data
     */
    updateRoundEndResults: function (elements, data) {
      // Update main capital and output values
      if (data.newCapital !== undefined) {
        SocketUtils.updateElementText(elements.capital, data.newCapital);
        StudentGame.state.lastCapital = data.newCapital;

        // Also update results section
        SocketUtils.updateElementText(elements.newCapital, data.newCapital);
      }

      if (data.newOutput !== undefined) {
        SocketUtils.updateElementText(elements.output, data.newOutput);
        StudentGame.state.currentOutput = data.newOutput;
        StudentGame.state.lastOutput = data.newOutput;

        // Also update results section
        SocketUtils.updateElementText(elements.newOutput, data.newOutput);
      }
    },

    /**
     * Handle game over event
     * @param {Object} data - Game over data
     */
    handleGameOver: function (data) {
      SocketUtils.logEvent('Game over', data);
      const elements = StudentDom.elements;

      // Find this player's result
      const playerResult = data.finalResults.find(
        (r) => r.playerName === StudentGame.state.currentPlayerName,
      );

      // Update UI with player's results
      this.updateGameOverResults(elements, playerResult);

      // Update winner
      SocketUtils.updateElementText(elements.winner, data.winner);

      // Generate rankings
      StudentDom.updateFinalRankings(
        data.finalResults,
        StudentGame.state.currentPlayerName,
      );

      // Hide round content and show game over UI
      StudentDom.showGameOver();

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_GAME_OVER,
      );

      // Disable all investment controls
      StudentGame.disableInvestmentControls(
        CONSTANTS.UI_TEXT.STATUS_GAME_OVER_NO_INVESTMENTS,
      );
    },

    /**
     * Update UI with game over results
     * @param {Object} elements - DOM elements
     * @param {Object} playerResult - Player's final result data
     */
    updateGameOverResults: function (elements, playerResult) {
      if (!playerResult) return;

      // Update final output display
      SocketUtils.updateElementText(
        elements.finalOutput,
        playerResult.finalOutput,
      );

      // Update main capital/output display
      if (playerResult.finalCapital || playerResult.capital) {
        const finalCapital = playerResult.finalCapital || playerResult.capital;
        SocketUtils.updateElementText(elements.capital, finalCapital);
        StudentGame.state.lastCapital = finalCapital;
      }

      if (playerResult.finalOutput) {
        SocketUtils.updateElementText(
          elements.output,
          playerResult.finalOutput,
        );
        StudentGame.state.lastOutput = playerResult.finalOutput;
      }
    },

    /**
     * Handle state snapshot event
     * @param {Object} data - State snapshot data
     */
    handleStateSnapshot: function (data) {
      SocketUtils.logEvent('State snapshot', data);
      const elements = StudentDom.elements;

      // Update round number
      SocketUtils.updateElementText(elements.roundNumber, data.roundNumber);

      // Update capital and output values
      this.updateCapitalOutput(elements, data);

      // Handle submission status
      if (data.submitted && elements.investmentStatus) {
        elements.investmentStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ALREADY_SUBMITTED;
        StudentGame.disableInvestmentControls();
      }

      // Show the appropriate UI
      StudentDom.showInvestmentUI();

      // Initialize timer display from state
      if (data.timeRemaining && elements.timer) {
        elements.timer.textContent = data.timeRemaining;
      }
    },

    /**
     * Handle timer update event
     * @param {Object} data - Timer data
     */
    handleTimerUpdate: function (data) {
      SocketUtils.logEvent('Timer update', data);
      const elements = StudentDom.elements;

      // Update timer display
      if (elements.timer && data.timeRemaining !== undefined) {
        elements.timer.textContent = data.timeRemaining;
      }

      // Auto-submit if time is below threshold and no submission yet
      if (
        data.timeRemaining <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS &&
        !StudentGame.state.hasSubmittedInvestment &&
        elements.investmentSlider
      ) {
        const currentInvestment = parseFloat(elements.investmentSlider.value);
        this.submitInvestment(currentInvestment, true);
        StudentGame.disableInvestmentControls(
          CONSTANTS.UI_TEXT.STATUS_TIME_EXPIRED,
        );
      }
    },

    /**
     * Handle error event
     * @param {Object} data - Error data
     */
    handleError: function (data) {
      SocketUtils.logEvent('Error', data);
      const elements = StudentDom.elements;

      if (elements.joinError && data.message) {
        elements.joinError.textContent = data.message;
      }

      if (elements.joinButton) {
        elements.joinButton.disabled = false;
      }
    },

    /**
     * Handle admin notification event
     * @param {Object} data - Notification data
     */
    handleAdminNotification: function (data) {
      SocketUtils.logEvent('Admin notification', data);
      if (data.message) {
        StudentDom.displayAdminNotification(data.message, data.type || 'info');
      }
    },

    /**
     * Join the game with the specified player name
     * @param {string} playerName - Player's name
     */
    joinGame: function (playerName) {
      if (!playerName) return;
      this.socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_GAME, { playerName });
    },

    /**
     * Submit investment amount
     * @param {number} investment - Amount to invest
     * @param {boolean} [isAutoSubmit=false] - Whether this is an auto-submission
     */
    submitInvestment: function (investment, isAutoSubmit = false) {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, {
        investment: parseFloat(investment),
        isAutoSubmit,
      });
    },
  };

  // Expose the module to window
  window.StudentSocket = StudentSocket;
})(window);
