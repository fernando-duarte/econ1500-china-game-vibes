// client/modules/screen/socket/screenSocketHandlers.js
// @ts-check
/// <reference path="../types.d.ts" />

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
    window.screenDOM.addEvent('connect', 'Connected to server');
  },

  onDisconnect: function () {
    SocketUtils.logEvent('Disconnect');
    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = 'Disconnected';
    }
    window.screenDOM.addEvent('disconnect', 'Disconnected from server', true);
  },

  onPlayerJoined: function (data) {
    SocketUtils.logEvent('Player joined', data);
    if (!data || !data.playerName) {
      console.error('Invalid player joined data:', data);
      return;
    }
    window.screenGame.addPlayer(data.playerName);
    window.screenDOM.updatePlayerList();
    const eventType = data.isReconnect ? 'player_reconnected' : 'player_joined';
    const message = data.isReconnect
      ? `Player ${data.playerName} reconnected`
      : `Player ${data.playerName} joined`;
    window.screenDOM.addEvent(eventType, message);
  },

  onPlayerDisconnected: function (data) {
    SocketUtils.logEvent('Player disconnected', data);
    window.screenDOM.addEvent(
      'player_disconnected',
      `Player ${data.playerName} disconnected`,
      true
    );
  },

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

  onGameStarted: function () {
    SocketUtils.logEvent('Game started');
    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTING;
    }
    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    window.screenGame.resetForNewRound();
    const roundElement = window.screenDOM.elements.roundNumber;
    if (roundElement) {
      roundElement.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
    }
    window.screenDOM.updatePlayerList();
    window.screenDOM.addEvent('game_started', 'Game has started', true);
  },

  onRoundStart: function (data) {
    SocketUtils.logEvent('Round start', data);
    const elements = window.screenDOM.elements;
    if (elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }
    if (elements.gameStatus) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
    }
    window.screenGame.resetForNewRound();
    if (elements.timer && data.timeRemaining) {
      elements.timer.textContent = data.timeRemaining;
    }
    window.screenDOM.updatePlayerList();
    window.screenDOM.addEvent(
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
    window.screenGame.recordInvestment(
      data.playerName,
      data.investment,
      data.isAutoSubmit
    );
    window.screenDOM.updatePlayerList();
    const autoText = data.isAutoSubmit ? ' (auto-submitted)' : '';
    window.screenDOM.addEvent(
      'investment',
      `${data.playerName} invested ${data.investment}${autoText}`
    );
  },

  onAllSubmitted: function (data) {
    SocketUtils.logEvent('All submitted', data);
    const statusElement = window.screenDOM.elements.gameStatus;
    if (statusElement) {
      statusElement.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
    }
    window.screenDOM.addEvent('all_submitted', data.message, true);
  },

  onRoundSummary: function (data) {
    SocketUtils.logEvent('Round summary', data);
    const elements = window.screenDOM.elements;
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
    window.screenGame.updateCapitalAndOutput(data.results);
    window.screenDOM.updateAverages();
    window.screenDOM.addEvent(
      'round_end',
      `Round ${data.roundNumber} completed`,
      true
    );
  },

  onGameOver: function (data) {
    SocketUtils.logEvent('Game over', data);
    const elements = window.screenDOM.elements;
    if (elements.roundNumber) {
      elements.roundNumber.textContent = CONSTANTS.ROUNDS;
    }
    if (elements.gameStatus) {
      elements.gameStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
    }
    window.screenGame.updateGameState(CONSTANTS.GAME_STATES.COMPLETED);
    clearInterval(window.screenGame.getState().timerInterval);
    if (elements.timer) {
      elements.timer.textContent = CONSTANTS.UI_TEXT.TIMER_PLACEHOLDER;
    }
    window.screenDOM.addEvent(
      'game_over',
      `Game over! Winner: ${data.winner}`,
      true
    );
  },

  onStateSnapshot: function (data) {
    SocketUtils.logEvent('State snapshot', data);
    const elements = window.screenDOM.elements;
    if (data.roundNumber && elements.roundNumber) {
      elements.roundNumber.textContent = data.roundNumber;
    }
    if (
      data.roundNumber >= CONSTANTS.FIRST_ROUND_NUMBER &&
      elements.gameStatus
    ) {
      elements.gameStatus.textContent =
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      window.screenGame.updateGameState(CONSTANTS.GAME_STATES.ACTIVE);
    }
    if (data.timeRemaining && elements.timer) {
      elements.timer.textContent = data.timeRemaining;
    }
  },

  onTimerUpdate: function (data) {
    const timerElement = window.screenDOM.elements.timer;
    if (timerElement && data && data.timeRemaining !== undefined) {
      timerElement.textContent = data.timeRemaining;
    }
  },

  onInstructorDisconnected: function () {
    SocketUtils.logEvent('Instructor disconnected');
    window.screenDOM.addEvent(
      'instructor_disconnected',
      'Instructor disconnected from server',
      true
    );
  },

  onError: function (data) {
    console.error('Socket error:', data.message);
    window.screenDOM.addEvent(
      'error',
      `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`,
      true
    );
  },
};

export default screenSocketHandlers;
