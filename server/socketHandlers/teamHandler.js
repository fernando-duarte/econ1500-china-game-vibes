// const { game } = require('../gameState'); // Now passed in via register function

function handleRegisterTeam(
  io,
  socket,
  teamManager,
  playerManager,
  gameLifecycle,
  getPlayerRoom,
  CONSTANTS,
  game,
  data
) {
  try {
    const { teamName, students } = data;
    if (
      !teamName ||
      !students ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      socket.emit('team_registration_error', {
        error: 'Invalid team registration data',
      });
      return;
    }

    const trimmedTeamName = teamName.trim();
    console.log(
      `Team registration requested: ${trimmedTeamName} with ${students.length} students`
    );

    // Register the team
    const result = teamManager.registerTeam(trimmedTeamName, students);

    if (result.success) {
      console.log(`Team registered: ${trimmedTeamName}`);

      // Store team info on the socket
      socket.teamName = trimmedTeamName; // Store potentially trimmed name
      socket.teamMembers = students;

      // --- Auto Join Logic ---
      socket.playerName = trimmedTeamName;
      socket.gameRole = CONSTANTS.GAME_ROLES.PLAYER;
      socket.join(CONSTANTS.SOCKET_ROOMS.PLAYERS);
      socket.join(getPlayerRoom(trimmedTeamName));

      console.log(
        `Team ${trimmedTeamName} automatically joining after registration`
      );

      const joinResult = playerManager.addPlayer(trimmedTeamName, socket.id);

      if (joinResult.success) {
        console.log(
          `Team joined: ${trimmedTeamName} with socket ID ${socket.id}`
        );

        // Store team info in the game player object (using passed game state)
        if (game.players[trimmedTeamName]) {
          game.players[trimmedTeamName].isTeam = true;
          game.players[trimmedTeamName].teamMembers = socket.teamMembers;
        }

        // Use passed game state
        const autoStartResult = game.manualStartEnabled
          ? false
          : gameLifecycle.checkAutoStart(io);

        io.to(getPlayerRoom(trimmedTeamName)).emit(
          CONSTANTS.SOCKET.EVENT_GAME_JOINED,
          {
            playerName: trimmedTeamName,
            initialCapital: joinResult.initialCapital,
            initialOutput: joinResult.initialOutput,
            isGameRunning: game.isGameRunning, // Use passed game state
            round: game.round, // Use passed game state
            autoStart: autoStartResult,
            manualStartEnabled: joinResult.manualStartEnabled,
          }
        );

        console.log('Sending team_joined to instructor room');
        io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
          CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
          {
            playerName: trimmedTeamName,
            initialCapital: joinResult.initialCapital,
            initialOutput: joinResult.initialOutput,
            isTeam: true,
            teamMembers: socket.teamMembers,
          }
        );

        io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
          CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
          {
            playerName: trimmedTeamName,
            isTeam: true,
          }
        );

        // Prepare and broadcast updated student list
        const allStudents = teamManager.getStudentList();
        const studentsInTeams = new Set();
        const teamInfo = {};
        Object.entries(teamManager.getTeams()).forEach(([tName, team]) => {
          team.students.forEach((student) => {
            studentsInTeams.add(student);
            teamInfo[student] = tName;
          });
        });

        console.log(
          `Broadcasting updated student list: ${allStudents.length - studentsInTeams.size} available out of ${allStudents.length} total`
        );

        socket.emit('team_registered', {
          // Confirm registration to the specific client
          success: true,
          teamName: trimmedTeamName,
          students,
        });

        io.emit('student_list_updated', {
          // Broadcast full update
          allStudents: allStudents,
          studentsInTeams: Array.from(studentsInTeams),
          teamInfo: teamInfo,
          unavailableCount: studentsInTeams.size,
        });
      } else {
        console.error(
          `Team join failed after registration: ${trimmedTeamName}:`,
          joinResult.error
        );
        socket.emit('team_registration_error', { error: joinResult.error });
      }
      // --- End Auto Join Logic ---
    } else {
      console.log(`Team registration failed: ${result.error}`);
      socket.emit('team_registration_error', { error: result.error });
    }
  } catch (error) {
    console.error('Error in team registration:', error);
    socket.emit('team_registration_error', {
      error: 'Server error during team registration',
    });
  }
}

function handleGetStudentList(socket, teamManager) {
  console.log(
    `Received direct get_student_list request from client: ${socket.id}`
  );
  try {
    const allStudents = teamManager.getStudentList();
    const studentsInTeams = new Set();
    const teamInfo = {};

    Object.entries(teamManager.getTeams()).forEach(([teamName, team]) => {
      team.students.forEach((student) => {
        studentsInTeams.add(student);
        teamInfo[student] = teamName;
      });
    });

    const responseData = {
      allStudents: allStudents,
      studentsInTeams: Array.from(studentsInTeams),
      teamInfo: teamInfo,
      unavailableCount: studentsInTeams.size,
    };

    console.log(
      `Sending student list to client ${socket.id} (direct request):`,
      {
        totalStudents: allStudents.length,
        studentsInTeams: studentsInTeams.size,
        availableStudents: allStudents.length - studentsInTeams.size,
      }
    );
    socket.emit('student_list', responseData);
    console.log(`Sent student list to client: ${socket.id} (direct request)`);
  } catch (error) {
    console.error('Error sending student list (direct request):', error);
    socket.emit('error', { message: 'Error retrieving student list' });
  }
}

function registerTeamEventHandlers(
  io,
  socket,
  teamManager,
  playerManager,
  gameLifecycle,
  getPlayerRoom,
  CONSTANTS,
  game
) {
  socket.on('register_team', (data) =>
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

  socket.on('get_student_list', () =>
    handleGetStudentList(socket, teamManager)
  );
}

module.exports = { registerTeamEventHandlers };
