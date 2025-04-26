/**
 * Instructor Socket Module
 * Manages all socket communication for the instructor interface
 */
(function (window) {
  'use strict';

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
      this.registerConnectionEvents();

      // Group: Game management events
      this.registerGameManagementEvents();

      // Group: Player events
      this.registerPlayerEvents();

      // Group: Round events
      this.registerRoundEvents();

      // Group: Notification events
      this.registerNotificationEvents();
    },

    /**
     * Register connection-related event handlers
     */
    registerConnectionEvents: function () {
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_CONNECT,
        this.handleConnect.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_DISCONNECT,
        this.handleDisconnect.bind(this)
      );
    },

    /**
     * Register game management event handlers
     */
    registerGameManagementEvents: function () {
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
    },

    /**
     * Register player-related event handlers
     */
    registerPlayerEvents: function () {
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
        this.handlePlayerJoined.bind(this)
      );
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
        this.handlePlayerDisconnected.bind(this)
      );
    },

    /**
     * Register round-related event handlers
     */
    registerRoundEvents: function () {
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
    },

    /**
     * Register notification event handlers
     */
    registerNotificationEvents: function () {
      this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, this.handleError.bind(this));
      this.socket.on(
        CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION,
        this.handleAdminNotification.bind(this)
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
    },

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
     * Handle player joined event
     * @param {Object} data - Player data
     */
    handlePlayerJoined: function (data) {
      SocketUtils.logEvent('Player joined', data);

      // Add player to game state
      InstructorGame.addPlayer(data.playerName);

      // Update player list UI
      InstructorDom.updatePlayerList(
        InstructorGame.state.players,
        InstructorGame.state.submittedPlayers,
        InstructorGame.state.autoSubmittedPlayers
      );

      // Update player count
      this.updatePlayerCount();

      // Show notification for reconnection
      if (data.isReconnect) {
        InstructorDom.displayStatusMessage(
          `${data.playerName} reconnected to the game`
        );
      }

      // Update manual start controls if needed
      if (data.manualStartEnabled !== undefined) {
        this.updateManualStartControls(data.manualStartEnabled);
      }
    },

    /**
     * Update player count display
     */
    updatePlayerCount: function () {
      const elements = InstructorDom.elements;
      const count = InstructorGame.state.players.length;

      if (elements.playerCount) {
        const countText = `${count} player${count !== 1 ? CONSTANTS.UI_TEXT.PLAYER_PLURAL_SUFFIX : ''}${CONSTANTS.UI_TEXT.PLAYER_JOINED_SUFFIX}`;
        elements.playerCount.textContent = countText;
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
     * Handle round start event
     * @param {Object} data - Round data
     */
    handleRoundStart: function (data) {
      SocketUtils.logEvent('Round start', data);
      const elements = InstructorDom.elements;

      // Update round number
      if (elements.roundNumber) {
        elements.roundNumber.textContent = data.roundNumber;
      }

      // Update round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      }

      // Initialize timer with server time
      if (elements.roundTimer && data.timeRemaining !== undefined) {
        elements.roundTimer.textContent = data.timeRemaining;
      }

      // Reset submitted players list
      InstructorGame.resetRoundState();

      // Update UI
      InstructorDom.updatePlayerList(
        InstructorGame.state.players,
        InstructorGame.state.submittedPlayers,
        InstructorGame.state.autoSubmittedPlayers
      );

      InstructorDom.updateCurrentInvestmentsTable(
        InstructorGame.state.currentRoundInvestments
      );

      // Show round results section if it's not the first round
      if (
        data.roundNumber > CONSTANTS.FIRST_ROUND_NUMBER &&
        elements.roundResultsSection
      ) {
        elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      // Show current investments section
      if (elements.currentInvestmentsSection) {
        elements.currentInvestmentsSection.classList.remove(
          CONSTANTS.CSS.HIDDEN
        );
      }
    },

    /**
     * Handle investment received event
     * @param {Object} data - Investment data
     */
    handleInvestmentReceived: function (data) {
      SocketUtils.logEvent('Investment received', data);

      // Make sure we have the data we need
      if (!data || !data.playerName) {
        console.error('Invalid investment_received data:', data);
        return;
      }

      // Record investment in game state
      InstructorGame.recordInvestment(
        data.playerName,
        data.investment,
        data.isAutoSubmit
      );

      // Ensure investments section is visible
      const elements = InstructorDom.elements;
      if (
        elements.currentInvestmentsSection &&
        elements.currentInvestmentsSection.classList.contains(
          CONSTANTS.CSS.HIDDEN
        )
      ) {
        elements.currentInvestmentsSection.classList.remove(
          CONSTANTS.CSS.HIDDEN
        );
      }

      // Update the investments table with a slight delay to ensure DOM updates
      setTimeout(() => {
        InstructorDom.updateCurrentInvestmentsTable(
          InstructorGame.state.currentRoundInvestments
        );
      }, CONSTANTS.MEDIUM_UI_DELAY_MS);

      // Force UI update for player list
      InstructorDom.updatePlayerList(
        InstructorGame.state.players,
        InstructorGame.state.submittedPlayers,
        InstructorGame.state.autoSubmittedPlayers
      );

      // Display status message
      const formattedInvestment = SocketUtils.formatNumber(
        data.investment,
        CONSTANTS.DECIMAL_PRECISION
      );
      InstructorDom.displayStatusMessage(
        `${data.playerName} submitted their investment: ${formattedInvestment}`
      );

      // Check for all submitted
      if (InstructorGame.areAllPlayersSubmitted()) {
        this.handleAllPlayersSubmitted();
      }
    },

    /**
     * Handle when all players have submitted investments
     */
    handleAllPlayersSubmitted: function () {
      const elements = InstructorDom.elements;

      // If we're in round 0 and all players submitted, update UI to "Round 1" proactively
      if (
        elements.roundNumber &&
        elements.roundNumber.textContent ===
          String(CONSTANTS.FIRST_ROUND_NUMBER - 1)
      ) {
        elements.roundNumber.textContent = String(CONSTANTS.FIRST_ROUND_NUMBER);

        if (elements.roundStatus) {
          elements.roundStatus.textContent =
            CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
        }
      }
    },

    /**
     * Handle all students submitted event
     * @param {Object} data - Submission data
     */
    handleAllSubmitted: function (data) {
      SocketUtils.logEvent('All submitted', data);
      const elements = InstructorDom.elements;

      // Update round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
        elements.roundStatus.classList.add(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);

        // Restore previous status after the early end
        setTimeout(() => {
          elements.roundStatus.classList.remove(
            CONSTANTS.CSS.ALL_SUBMITTED_STATUS
          );
        }, data.timeRemaining * CONSTANTS.MILLISECONDS_PER_SECOND);
      }
    },

    /**
     * Handle round summary event
     * @param {Object} data - Round summary data
     */
    handleRoundSummary: function (data) {
      SocketUtils.logEvent('Round summary', data);
      const elements = InstructorDom.elements;

      // Update round number and status
      if (elements.roundNumber) {
        elements.roundNumber.textContent = data.roundNumber;
      }

      if (elements.roundStatus) {
        elements.roundStatus.textContent = `${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_PREFIX}${data.roundNumber}${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_SUFFIX}`;
      }

      // Update results table
      this.updateRoundResultsTable(elements, data.results);

      // Show round results section
      if (elements.roundResultsSection) {
        elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }
    },

    /**
     * Update round results table with player data
     * @param {Object} elements - DOM elements
     * @param {Array} results - Player results array
     */
    updateRoundResultsTable: function (elements, results) {
      if (!elements.roundResultsBody || !Array.isArray(results)) {
        return;
      }

      // Clear existing rows
      elements.roundResultsBody.innerHTML = '';

      // Add results to the table
      results.forEach((result) => {
        const row = this.createResultRow(result);
        elements.roundResultsBody.appendChild(row);
      });
    },

    /**
     * Create a result row for the round results table
     * @param {Object} result - Player result data
     * @returns {HTMLElement} - Table row element
     */
    createResultRow: function (result) {
      if (!result || !result.playerName) {
        return document.createElement('tr');
      }

      const row = document.createElement('tr');

      // Add auto-submitted class if needed
      if (result.isAutoSubmit) {
        row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
        row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
      }

      // Format investment with consistent decimal precision
      const formattedInvestment = SocketUtils.formatNumber(
        result.investment,
        CONSTANTS.DECIMAL_PRECISION
      );
      const autoSubmitSuffix = result.isAutoSubmit
        ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX
        : '';

      row.innerHTML = `
        <td>${result.playerName}</td>
        <td>${formattedInvestment}${autoSubmitSuffix}</td>
        <td>${result.newCapital}</td>
        <td>${result.newOutput}</td>
      `;

      return row;
    },

    /**
     * Handle game over event
     * @param {Object} data - Game over data
     */
    handleGameOver: function (data) {
      SocketUtils.logEvent('Game over', data);
      const elements = InstructorDom.elements;

      // Update winner
      if (elements.winnerName && data.winner) {
        elements.winnerName.textContent = data.winner;
      }

      // Update final results table
      this.updateFinalResultsTable(elements, data.finalResults);

      // Show game over section
      if (elements.gameOverSection) {
        elements.gameOverSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      // Update round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
      }
    },

    /**
     * Update final results table
     * @param {Object} elements - DOM elements
     * @param {Array} finalResults - Final player results
     */
    updateFinalResultsTable: function (elements, finalResults) {
      if (!elements.finalResultsBody || !Array.isArray(finalResults)) {
        return;
      }

      // Clear existing rows
      elements.finalResultsBody.innerHTML = '';

      // Add final results to the table
      finalResults.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + CONSTANTS.DISPLAY_INDEX_OFFSET}</td>
          <td>${result.playerName}</td>
          <td>${result.finalOutput}</td>
        `;
        elements.finalResultsBody.appendChild(row);
      });
    },

    /**
     * Handle manual start mode event
     * @param {Object} data - Manual start data
     */
    handleManualStartMode: function (data) {
      SocketUtils.logEvent('Manual start mode', data);

      if (data && data.enabled !== undefined) {
        this.updateManualStartControls(data.enabled);
      }
    },

    /**
     * Handle timer update event
     * @param {Object} data - Timer data
     */
    handleTimerUpdate: function (data) {
      const roundTimer = InstructorDom.elements.roundTimer;
      if (roundTimer && data && data.timeRemaining !== undefined) {
        roundTimer.textContent = data.timeRemaining;
      }
    },

    /**
     * Handle player disconnected event
     * @param {Object} data - Player data
     */
    handlePlayerDisconnected: function (data) {
      SocketUtils.logEvent('Player disconnected', data);

      if (data && data.playerName) {
        InstructorDom.displayStatusMessage(
          `${data.playerName} disconnected from the game`
        );
      }
    },

    /**
     * Handle admin notification event
     * @param {Object} data - Notification data
     */
    handleAdminNotification: function (data) {
      SocketUtils.logEvent('Admin notification', data);

      if (!data || !data.message) return;

      // Display notification to user
      const notification = document.createElement('div');
      notification.textContent = data.message;
      notification.classList.add(
        CONSTANTS.CSS.ADMIN_NOTIFICATION,
        `${CONSTANTS.CSS.ADMIN_NOTIFICATION_PREFIX}${data.type || CONSTANTS.NOTIFICATION.DEFAULT_TYPE}`
      );

      document.body.appendChild(notification);

      // Remove notification after specified time
      setTimeout(() => {
        notification.remove();
      }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
    },

    /**
     * Handle error event
     * @param {Object} data - Error data
     */
    handleError: function (data) {
      SocketUtils.logEvent('Error', data);

      if (data && data.message) {
        console.error('Socket error:', data.message);
        alert(CONSTANTS.UI_TEXT.ERROR_PREFIX + data.message);
      }
    },

    /**
     * Set manual start mode
     * @param {boolean} enabled - Whether manual start is enabled
     */
    setManualStart: function (enabled) {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, { enabled });
    },

    /**
     * Start the game
     */
    startGame: function () {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_START_GAME);
    },

    /**
     * Force end the game
     */
    forceEndGame: function () {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME);
    },
  };

  // Expose the module to window
  window.InstructorSocket = InstructorSocket;
})(window);
