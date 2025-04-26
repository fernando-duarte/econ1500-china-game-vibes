// const { game } = require('../gameState'); // Now passed in via register function

const handleReconnectGame = require('./playerHandlers/handleReconnectGame');
const handleSubmitInvestment = require('./playerHandlers/handleSubmitInvestment');

function registerPlayerEventHandlers(
  io,
  socket,
  playerManager, // Required by handleReconnectGame
  roundManager, // Required by handleSubmitInvestment
  getPlayerRoom, // Required by handleReconnectGame
  CONSTANTS, // Required by both handlers
  game // Required by both handlers
) {
  socket.on(CONSTANTS.SOCKET.EVENT_RECONNECT_GAME, (data) =>
    handleReconnectGame(
      io,
      socket,
      playerManager,
      getPlayerRoom,
      CONSTANTS,
      game,
      data
    )
  );

  socket.on(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, (data) =>
    handleSubmitInvestment(io, socket, roundManager, CONSTANTS, game, data)
  );

  // Add other player-specific event listeners here if needed in the future
}

module.exports = { registerPlayerEventHandlers };
