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

      // --- Auto Join Logic --- //
      // Assign player properties to the socket representing the team
      socket.playerName = trimmedTeamName;
      socket.gameRole = CONSTANTS.GAME_ROLES.PLAYER;
      socket.join(CONSTANTS.SOCKET_ROOMS.PLAYERS);
      socket.join(getPlayerRoom(trimmedTeamName));

      console.log(
        `Team ${trimmedTeamName} automatically joining after registration`
      );

      // Add the team as a player using playerManager
      const joinResult = playerManager.addPlayer(trimmedTeamName, socket.id);

      if (joinResult.success) {
        console.log(
          `Team joined: ${trimmedTeamName} with socket ID ${socket.id}`
        );

        // Mark the player entry as a team in the main game state
        if (game.players[trimmedTeamName]) {
          game.players[trimmedTeamName].isTeam = true;
          game.players[trimmedTeamName].teamMembers = socket.teamMembers;
        }

        // Check if the game should auto-start (uses passed game state)
        const autoStartResult = game.manualStartEnabled
          ? false
          : gameLifecycle.checkAutoStart(io);

        // Emit confirmation and game state to the team's socket
        io.to(getPlayerRoom(trimmedTeamName)).emit(
          CONSTANTS.SOCKET.EVENT_GAME_JOINED,
          {
            playerName: trimmedTeamName,
            initialCapital: joinResult.initialCapital,
            initialOutput: joinResult.initialOutput,
            isGameRunning: game.isGameRunning,
            round: game.round,
            autoStart: autoStartResult,
            manualStartEnabled: joinResult.manualStartEnabled,
          }
        );

        // Notify instructor about the new team player
        console.log('Sending team_joined notification to instructor room');
        io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
          CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, // Use standard player joined event
          {
            playerName: trimmedTeamName,
            initialCapital: joinResult.initialCapital,
            initialOutput: joinResult.initialOutput,
            isTeam: true,
            teamMembers: socket.teamMembers,
          }
        );

        // Notify screens about the new team player
        io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
          CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
          {
            playerName: trimmedTeamName,
            isTeam: true,
          }
        );

        // Broadcast updated student availability to all clients
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
          success: true,
          teamName: trimmedTeamName,
          students,
        });

        io.emit('student_list_updated', { // Broadcast full update
          allStudents: allStudents,
          studentsInTeams: Array.from(studentsInTeams),
          teamInfo: teamInfo,
          unavailableCount: studentsInTeams.size,
        });

      } else {
        // Handle failure to add the team as a player
        console.error(
          `Team join failed after registration: ${trimmedTeamName}:`,
          joinResult.error
        );
        // Rollback team registration?
        // teamManager.unregisterTeam(trimmedTeamName); // Potentially add this?
        socket.emit('team_registration_error', { error: joinResult.error });
      }
      // --- End Auto Join Logic --- //
    } else {
      // Handle failure to register the team initially
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

module.exports = handleRegisterTeam; 