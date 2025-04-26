/**
 * Screen Socket Module
 * Manages all socket communication for the game screen display
 */

// Expose socket functionality through window object
window.screenSocket = {
  /** Socket instance */
  socket: null,

  /** Event handler functions */
  handlers: {},

  /**
   * Initialize socket connection and register all event handlers
   */
  init: function () {
    // Initialize socket connection
    this.socket = io();

    // Register all event handlers
    this.registerEventHandlers();
  },

  /**
   * Register all socket event handlers
   */
  registerEventHandlers: function () {
    // Group: Connection events
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_CONNECT,
      this.handlers.onConnect.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_DISCONNECT,
      this.handlers.onDisconnect.bind(this)
    );

    // Group: Player events
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
      this.handlers.onPlayerJoined.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
      this.handlers.onPlayerDisconnected.bind(this)
    );

    // Group: Game state events
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_GAME_CREATED,
      this.handlers.onGameCreated.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_GAME_STARTED,
      this.handlers.onGameStarted.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ROUND_START,
      this.handlers.onRoundStart.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
      this.handlers.onInvestmentReceived.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
      this.handlers.onAllSubmitted.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      this.handlers.onRoundSummary.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_GAME_OVER,
      this.handlers.onGameOver.bind(this)
    );

    // Group: Utility events
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
      this.handlers.onStateSnapshot.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_TIMER_UPDATE,
      this.handlers.onTimerUpdate.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ERROR,
      this.handlers.onError.bind(this)
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_INSTRUCTOR_DISCONNECTED,
      this.handlers.onInstructorDisconnected.bind(this)
    );
  },
};

/**
 * Event handlers for screen socket events
 */
window.screenSocket.handlers = {
  /**
   * Handle connection to server
   */
  onConnect: function () {
    SocketUtils.logEvent('Connect', { socketId: this.socket.id });

    // Announce this client as a screen
    this.socket.emit('screen_connect');
    window.screenDOM.addEvent('connect', 'Connected to server');
  },

  /**
   * Handle disconnection from server
   */
  onDisconnect: function () {
    SocketUtils.logEvent('Disconnect');

    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = 'Disconnected';
    }

    window.screenDOM.addEvent('disconnect', 'Disconnected from server', true);
  },

  /**
   * Handle player joined event
   * @param {Object} data - Player data
   */
  onPlayerJoined: function (data) {
    SocketUtils.logEvent('Player joined', data);

    if (!data || !data.playerName) {
      console.error('Invalid player joined data:', data);
      return;
    }

    // Add player to the list
    window.screenGame.addPlayer(data.playerName);

    // Update player list
    window.screenDOM.updatePlayerList();

    // Log event with appropriate message for join or reconnect
    const eventType = data.isReconnect ? 'player_reconnected' : 'player_joined';
    const message = data.isReconnect
      ? `Player ${data.playerName} reconnected`
      : `Player ${data.playerName} joined`;
    window.screenDOM.addEvent(eventType, message);
  },

  /**
   * Handle player disconnection
   * @param {Object} data - Player data
   */
  onPlayerDisconnected: function (data) {
    SocketUtils.logEvent('Player disconnected', data);
    window.screenDOM.addEvent(
      'player_disconnected',
      `Player ${data.playerName} disconnected`,
      true
    );
  },

  /**
   * Handle game created event
   */
  onGameCreated: function () {
    SocketUtils.logEvent('Game created');

    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_PLAYERS;
    }

    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.WAITING);
    window.screenGame.resetForNewGame();

    window.screenDOM.updatePlayerList();
    window.screenDOM.updateAverages();

    window.screenDOM.addEvent('game_created', 'Game has been created', true);
  },

  /**
   * Handle game started event
   */
  onGameStarted: function () {
    SocketUtils.logEvent('Game started');

    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTING;
    }

    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    window.screenGame.resetForNewRound();

    // Set initial round number
    const roundElement = window.screenDOM.elements.roundNumber;
    if (roundElement) {
      roundElement.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
    }

    window.screenDOM.updatePlayerList();
    window.screenDOM.addEvent('game_started', 'Game has started', true);
  },

  /**
   * Handle round start event
   * @param {Object} data - Round data
   */
  onRoundStart: function (data) {
    SocketUtils.logEvent('Round start', data);

    const elements = window.screenDOM.elements;

    // Update round number
    if (elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }

    // Update game status
    if (elements.gameStatus) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
    }

    // Reset for new round
    window.screenGame.resetForNewRound();

    // Initialize timer
    if (elements.timer && data.timeRemaining) {
      elements.timer.textContent = data.timeRemaining;
    }

    // Update display
    window.screenDOM.updatePlayerList();
    window.screenDOM.addEvent(
      'round_start',
      `Round ${data.roundNumber} started`,
      true
    );
  },

  /**
   * Handle investment received event
   * @param {Object} data - Investment data
   */
  onInvestmentReceived: function (data) {
    SocketUtils.logEvent('Investment received', data);

    // Check for required data
    if (!data || !data.playerName) {
      console.error('Invalid investment data:', data);
      return;
    }

    // Record the investment
    window.screenGame.recordInvestment(
      data.playerName,
      data.investment,
      data.isAutoSubmit
    );

    // Update display
    window.screenDOM.updatePlayerList();

    // Log event
    const autoText = data.isAutoSubmit ? ' (auto-submitted)' : '';
    window.screenDOM.addEvent(
      'investment',
      `${data.playerName} invested ${data.investment}${autoText}`
    );
  },

  /**
   * Handle all students submitted event
   * @param {Object} data - Submission data
   */
  onAllSubmitted: function (data) {
    SocketUtils.logEvent('All submitted', data);

    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
    }

    window.screenDOM.addEvent('all_submitted', data.message, true);
  },

  /**
   * Handle round summary event
   * @param {Object} data - Round summary data
   */
  onRoundSummary: function (data) {
    SocketUtils.logEvent('Round summary', data);

    const elements = window.screenDOM.elements;

    // Calculate next round number (capped at max rounds)
    const nextRound = Math.min(data.roundNumber + 1, CONSTANTS.ROUNDS);

    // Update round number
    if (elements.roundNumber) {
      elements.roundNumber.textContent = nextRound;
    }

    // Update game status
    if (elements.gameStatus) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.ROUND_COMPLETED_FORMAT.replace(
          '{0}',
          data.roundNumber
        );
    }

    // Reset timer display
    if (elements.timer) {
      elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;
    }

    // Update capital and output values
    window.screenGame.updateCapitalAndOutput(data.results);

    // Update averages
    window.screenDOM.updateAverages();

    // Log event
    window.screenDOM.addEvent(
      'round_end',
      `Round ${data.roundNumber} completed`,
      true
    );
  },

  /**
   * Handle game over event
   * @param {Object} data - Game over data
   */
  onGameOver: function (data) {
    SocketUtils.logEvent('Game over', data);

    const elements = window.screenDOM.elements;

    // Update round number to final round
    if (elements.roundNumber) {
      elements.roundNumber.textContent = CONSTANTS.ROUNDS;
    }

    // Update game status
    if (elements.gameStatus) {
      elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
    }

    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.COMPLETED);

    // Clear timer
    clearInterval(window.screenGame.getState().timerInterval);

    if (elements.timer) {
      elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;
    }

    // Log event
    window.screenDOM.addEvent(
      'game_over',
      `Game over! Winner: ${data.winner}`,
      true
    );
  },

  /**
   * Handle state snapshot event
   * @param {Object} data - State snapshot data
   */
  onStateSnapshot: function (data) {
    SocketUtils.logEvent('State snapshot', data);

    const elements = window.screenDOM.elements;

    // Update round number
    if (data.roundNumber && elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }

    // Update game status based on round
    if (
      data.roundNumber >= CONSTANTS.FIRST_ROUND_NUMBER &&
      elements.gameStatus
    ) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    }

    // Update timer
    if (data.timeRemaining && elements.timer) {
      elements.timer.textContent = data.timeRemaining;
    }
  },

  /**
   * Handle timer update event
   * @param {Object} data - Timer data
   */
  onTimerUpdate: function (data) {
    const timerElement = window.screenDOM.elements.timer;
    if (timerElement && data && data.timeRemaining !== undefined) {
      timerElement.textContent = data.timeRemaining;
    }
  },

  /**
   * Handle instructor disconnected event
   */
  onInstructorDisconnected: function () {
    SocketUtils.logEvent('Instructor disconnected');
    window.screenDOM.addEvent(
      'instructor_disconnected',
      'Instructor disconnected from server',
      true
    );
  },

  /**
   * Handle error event
   * @param {Object} data - Error data
   */
  onError: function (data) {
    console.error('Socket error:', data.message);
    window.screenDOM.addEvent(
      'error',
      `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`,
      true
    );
  },
};
