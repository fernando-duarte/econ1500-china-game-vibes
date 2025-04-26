const { game } = require('./gameState');
const { getPlayerRoom } = require('./gameUtils');
const teamManager = require('./teamManager');
const CONSTANTS = require('../shared/constants');
const playerManager = require('./playerManager');
const roundManager = require('./roundManager');
const gameLifecycle = require('./gameLifecycle');
const { handleNewConnection } = require('./socketHandlers/connectionHandler');
const {
  registerInstructorEventHandlers,
} = require('./socketHandlers/instructorHandler');
const {
  registerScreenEventHandlers,
} = require('./socketHandlers/screenHandler');
const { registerTeamEventHandlers } = require('./socketHandlers/teamHandler');
const {
  registerPlayerEventHandlers,
} = require('./socketHandlers/playerHandler');

/**
 * Set up Socket.IO event handlers
 */
function setupSocketEvents(io) {
  game.currentIo = io;
  console.log('Stored IO instance for game functions');

  gameLifecycle.createGame();
  console.log('Game created automatically on server start');

  gameLifecycle.setManualStartMode(true);
  console.log('Manual start mode enabled by default');

  teamManager.loadStudentList();
  console.log('Student list loaded for team registration');

  teamManager.clearTeams();
  console.log('Cleared existing teams on server start');

  io.on('connection', (socket) => {
    // Setup basic connection, identify type, and attach disconnect handler
    handleNewConnection(io, socket);

    // Register role-specific handlers if applicable
    if (socket.isInstructorPage) {
      registerInstructorEventHandlers(
        io,
        socket,
        gameLifecycle,
        roundManager,
        CONSTANTS,
        game
      );
    }

    // Register handlers that apply to potentially any connection type
    // These handlers contain their own logic to determine if they should act
    registerScreenEventHandlers(io, socket, CONSTANTS, game);
    registerTeamEventHandlers(
      io,
      socket,
      teamManager,
      playerManager,
      gameLifecycle,
      getPlayerRoom,
      CONSTANTS,
      game
    );
    registerPlayerEventHandlers(
      io,
      socket,
      playerManager,
      roundManager,
      getPlayerRoom,
      CONSTANTS,
      game
    );
  });
}

module.exports = { setupSocketEvents };
