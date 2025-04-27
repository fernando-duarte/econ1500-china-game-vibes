// client/modules/screen/socket/screenSocketHandlers.js

// NOTE: This file expects the following globals to be available on window:
//   - screenDOM
//   - screenGame
//   - SocketUtils
//   - CONSTANTS
// These are provided by the browser context and other scripts in the app.

const screenSocketHandlers = {
  onConnect: function () {
    SocketUtils.logEvent('Connect', { socketId: this.socket.id });
    this.socket.emit('screen_connect');
    screenDOM.addEvent('connect', 'Connected to server');
  },

  onDisconnect: function () {
    SocketUtils.logEvent('Disconnect');
    const statusElement = screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = 'Disconnected';
    }
    screenDOM.addEvent('disconnect', 'Disconnected from server', true);
  },

  onPlayerJoined: function (data) {
    SocketUtils.logEvent('Player joined', data);
    if (!data || !data.playerName) {
      console.error('Invalid player joined data:', data);
      return;
    }
    screenGame.addPlayer(data.playerName);
    screenDOM.updatePlayerList();
    const eventType = data.isReconnect ? 'player_reconnected' : 'player_joined';
    const message = data.isReconnect
      ? `Player ${data.playerName} reconnected`
      : `Player ${data.playerName} joined`;
    screenDOM.addEvent(eventType, message);
  },

  onPlayerDisconnected: function (data) {
    SocketUtils.logEvent('Player disconnected', data);
    screenDOM.addEvent(
      'player_disconnected',
      `Player ${data.playerName} disconnected`,
      true
    );
  },

  onGameCreated: function () {
    SocketUtils.logEvent('Game created');
    const statusElement = screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_PLAYERS;
    }
    screenGame.updateGameState(CONSTANTS.GAME_STATES.WAITING);
    screenGame.resetForNewGame();
    screenDOM.updatePlayerList();
    screenDOM.updateAverages();
    screenDOM.addEvent('game_created', 'Game has been created', true);
  },

  onGameStarted: function () {
    SocketUtils.logEvent('Game started');
    const statusElement = screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTING;
    }
    screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    screenGame.resetForNewRound();
    const roundElement = screenDOM.elements.roundNumber;
    if (roundElement) {
      roundElement.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
    }
    screenDOM.updatePlayerList();
    screenDOM.addEvent('game_started', 'Game has started', true);
  },

  onRoundStart: function (data) {
    SocketUtils.logEvent('Round start', data);
    const elements = screenDOM.elements;
    if (elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }
    if (elements.gameStatus) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
    }
    screenGame.resetForNewRound();
    if (elements.timer && data.timeRemaining) {
      elements.timer.textContent = data.timeRemaining;
    }
    screenDOM.updatePlayerList();
    screenDOM.addEvent(
      'round_start',
      `Round ${data.roundNumber} started`,
      true
    );
  },

  onInvestmentReceived: function (data) {
    SocketUtils.logEvent('Investment received', data);
    if (!data || !data.playerName) {
      console.error('Invalid investment data:', data);
      return;
    }
    screenGame.recordInvestment(
      data.playerName,
      data.investment,
      data.isAutoSubmit
    );
    screenDOM.updatePlayerList();
    const autoText = data.isAutoSubmit ? ' (auto-submitted)' : '';
    screenDOM.addEvent(
      'investment',
      `${data.playerName} invested ${data.investment}${autoText}`
    );
  },

  onAllSubmitted: function (data) {
    SocketUtils.logEvent('All submitted', data);
    const statusElement = screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
    }
    screenDOM.addEvent('all_submitted', data.message, true);
  },

  onRoundSummary: function (data) {
    SocketUtils.logEvent('Round summary', data);
    const elements = screenDOM.elements;
    const nextRound = Math.min(data.roundNumber + 1, CONSTANTS.ROUNDS);
    if (elements.roundNumber) {
      elements.roundNumber.textContent = nextRound;
    }
    if (elements.gameStatus) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.ROUND_COMPLETED_FORMAT.replace(
          '{0}',
          data.roundNumber
        );
    }
    if (elements.timer) {
      elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;
    }
    screenGame.updateCapitalAndOutput(data.results);
    screenDOM.updateAverages();
    screenDOM.addEvent(
      'round_end',
      `Round ${data.roundNumber} completed`,
      true
    );
  },

  onGameOver: function (data) {
    SocketUtils.logEvent('Game over', data);
    const elements = screenDOM.elements;
    if (elements.roundNumber) {
      elements.roundNumber.textContent = CONSTANTS.ROUNDS;
    }
    if (elements.gameStatus) {
      elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
    }
    screenGame.updateGameState(CONSTANTS.GAME_STATES.COMPLETED);
    clearInterval(screenGame.getState().timerInterval);
    if (elements.timer) {
      elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;
    }
    screenDOM.addEvent('game_over', `Game over! Winner: ${data.winner}`, true);
  },

  onStateSnapshot: function (data) {
    SocketUtils.logEvent('State snapshot', data);
    const elements = screenDOM.elements;
    if (data.roundNumber && elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }
    if (
      data.roundNumber >= CONSTANTS.FIRST_ROUND_NUMBER &&
      elements.gameStatus
    ) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    }
    if (data.timeRemaining && elements.timer) {
      elements.timer.textContent = data.timeRemaining;
    }
  },

  onTimerUpdate: function (data) {
    const timerElement = screenDOM.elements.timer;
    if (timerElement && data && data.timeRemaining !== undefined) {
      timerElement.textContent = data.timeRemaining;
    }
  },

  onInstructorDisconnected: function () {
    SocketUtils.logEvent('Instructor disconnected');
    screenDOM.addEvent(
      'instructor_disconnected',
      'Instructor disconnected from server',
      true
    );
  },

  onError: function (data) {
    console.error('Socket error:', data.message);
    screenDOM.addEvent(
      'error',
      `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`,
      true
    );
  },
};

export default screenSocketHandlers;
