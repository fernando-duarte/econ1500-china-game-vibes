// client/modules/screen/socket/screenSocket.js
// @ts-check
/// <reference path="../types.d.ts" />

import screenSocketHandlers from './screenSocketHandlers.js';

const screenSocket = {
  socket: null,
  handlers: {},

  init: function () {
    this.socket = io();
    this.handlers = {};
    // Bind all handlers to this socket context
    for (const [key, fn] of Object.entries(screenSocketHandlers)) {
      this.handlers[key] = fn.bind(this);
    }
    this.registerEventHandlers();
  },

  registerEventHandlers: function () {
    this.socket.on(CONSTANTS.SOCKET.EVENT_CONNECT, this.handlers.onConnect);
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_DISCONNECT,
      this.handlers.onDisconnect
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
      this.handlers.onPlayerJoined
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
      this.handlers.onPlayerDisconnected
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_GAME_CREATED,
      this.handlers.onGameCreated
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_GAME_STARTED,
      this.handlers.onGameStarted
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ROUND_START,
      this.handlers.onRoundStart
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
      this.handlers.onInvestmentReceived
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
      this.handlers.onAllSubmitted
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY,
      this.handlers.onRoundSummary
    );
    this.socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, this.handlers.onGameOver);
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
      this.handlers.onStateSnapshot
    );
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_TIMER_UPDATE,
      this.handlers.onTimerUpdate
    );
    this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, this.handlers.onError);
    this.socket.on(
      CONSTANTS.SOCKET.EVENT_INSTRUCTOR_DISCONNECTED,
      this.handlers.onInstructorDisconnected
    );
  },
};

export default screenSocket;
