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
  console.log(`Registering team event handlers for socket ${socket.id}`);

  // Log the constants being used to verify they match client-side
  console.log(
    `Using EVENT_REGISTER_TEAM constant: ${CONSTANTS.SOCKET.EVENT_REGISTER_TEAM}`
  );

  socket.on(CONSTANTS.SOCKET.EVENT_REGISTER_TEAM, (data) => {
    console.log(
      `Received ${CONSTANTS.SOCKET.EVENT_REGISTER_TEAM} event from client:`,
      data
    );
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
    );
  });

  socket.on(CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST, () => {
    console.log(
      `Received ${CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST} event from client`
    );
    handleGetStudentList(socket, teamManager, CONSTANTS);
  });

  // Add other team-specific event listeners here if needed
}

module.exports = { registerTeamEventHandlers };
