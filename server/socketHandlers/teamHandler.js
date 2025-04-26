// const { game } = require('../gameState'); // Now passed in via register function

const handleRegisterTeam = require('./teamHandlers/handleRegisterTeam');
const handleGetStudentList = require('./teamHandlers/handleGetStudentList');

function registerTeamEventHandlers(
  io,
  socket,
  teamManager, // Required by both handlers
  playerManager, // Required by handleRegisterTeam
  gameLifecycle, // Required by handleRegisterTeam
  getPlayerRoom, // Required by handleRegisterTeam
  CONSTANTS, // Required by both handlers
  game // Required by handleRegisterTeam
) {
  socket.on(CONSTANTS.SOCKET.EVENT_REGISTER_TEAM, (data) =>
    handleRegisterTeam(
      io,
      socket,
      teamManager,
      playerManager,
      gameLifecycle,
      getPlayerRoom,
      CONSTANTS,
      game,
      data
    )
  );

  socket.on(CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST, () =>
    handleGetStudentList(socket, teamManager, CONSTANTS)
  );

  // Add other team-specific event listeners here if needed
}

module.exports = { registerTeamEventHandlers };
