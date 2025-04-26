const {
  createGame,
  addPlayer,
  startGame,
  startRound,
  // submitInvestment imported but used indirectly through event handlers
  playerReconnect,
  playerDisconnect,
} = require('./gameLogic');

const teamManager = require('./teamManager');
const CONSTANTS = require('../shared/constants');

/**
 * Get the room identifier for a specific player
 * @param {string} playerName - The name of the player
 * @return {string} The room identifier for the player
 */
function getPlayerRoom(playerName) {
  return `${CONSTANTS.SOCKET_ROOMS.PLAYER_PREFIX}${playerName}`;
}

/**
 * Set up Socket.IO event handlers
 */
function setupSocketEvents(io) {
  // Store io instance in gameLogic for auto-start functionality
  const gameLogic = require('./gameLogic');

  // Save IO instance for game functions
  gameLogic.game.currentIo = io;
  console.log('Stored IO instance for game functions');

  // Make gameLogic available to all event handlers

  // Create a game automatically on server start
  createGame();
  console.log('Game created automatically on server start');

  // Enable manual start mode by default
  gameLogic.setManualStartMode(true);
  console.log('Manual start mode enabled by default');

  // Load student list on server start
  teamManager.loadStudentList();
  console.log('Student list loaded for team registration');

  // Clear any existing teams on server start
  teamManager.clearTeams();
  console.log('Cleared existing teams on server start');

  // Handle new socket connections
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Add every client to the "all" room
    socket.join(CONSTANTS.SOCKET_ROOMS.ALL);

    // Send a test event to the client
    socket.emit('test_event', { message: 'Hello from server!' });
    console.log(`Sent test_event to client: ${socket.id}`);

    // Also add a direct handler for get_student_list
    socket.on('get_student_list', () => {
      console.log(`Received direct get_student_list request from client: ${socket.id}`);
      try {
        // Get all students
        const allStudents = teamManager.getStudentList();
        console.log(`Retrieved ${allStudents.length} students from teamManager for direct request`);

        // Get students who are already in teams
        const studentsInTeams = new Set();
        const teamInfo = {}; // Map student name to team name

        // Collect all students who are already in teams and their team info
        Object.entries(teamManager.getTeams()).forEach(([teamName, team]) => {
          team.students.forEach(student => {
            studentsInTeams.add(student);
            teamInfo[student] = teamName;
          });
        });

        // Prepare the data to send
        const responseData = {
          allStudents: allStudents,
          studentsInTeams: Array.from(studentsInTeams),
          teamInfo: teamInfo,
          unavailableCount: studentsInTeams.size
        };

        console.log(`Sending student list to client ${socket.id} (direct request):`, {
          totalStudents: allStudents.length,
          studentsInTeams: studentsInTeams.size,
          availableStudents: allStudents.length - studentsInTeams.size
        });

        // Send the complete list to the client with availability info
        socket.emit('student_list', responseData);

        console.log(`Sent student list to client: ${socket.id} (direct request)`);
      } catch (error) {
        console.error('Error sending student list (direct request):', error);
        socket.emit('error', { message: 'Error retrieving student list' });
      }
    });

    let playerName = null;
    let isInstructor = false;
    let isScreen = false;

    // Check if connection is from instructor page
    const referer = socket.handshake.headers.referer || '';
    console.log(`Connection referer: ${referer}`);

    const isInstructorPage = referer && referer.includes(CONSTANTS.ROUTES.INSTRUCTOR);
    console.log(`Is instructor page: ${isInstructorPage}`);

    // Add instructor to instructor room if from instructor page
    if (isInstructorPage) {
      isInstructor = true;

      console.log(`Instructor with ID ${socket.id} joined instructor room`);

      // Map this socket to "instructor" role
      socket.instructor = true;
      socket.gameRole = CONSTANTS.GAME_ROLES.INSTRUCTOR;
      socket.join(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR); // Add instructor to a dedicated room for broadcasts

      // Notify the instructor client that a game is already created
      socket.emit(CONSTANTS.SOCKET.EVENT_GAME_CREATED, {
        manualStartEnabled: gameLogic.game.manualStartEnabled
      });

      // Send existing players to the instructor
      const players = Object.keys(gameLogic.game.players);
      console.log(`Sending existing ${players.length} players to instructor: ${players.join(', ')}`);

      players.forEach(playerName => {
        const player = gameLogic.game.players[playerName];
        const isTeam = player.isTeam || false;

        socket.emit(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, {
          playerName: playerName,
          initialCapital: player.capital,
          initialOutput: player.output,
          isTeam: isTeam,
          teamMembers: isTeam ? player.teamMembers : undefined
        });
      });
    }

    // Screen client connects
    socket.on(CONSTANTS.SOCKET.EVENT_SCREEN_CONNECT, () => {
      try {
        console.log(`Screen connected: ${socket.id}`);

        // Mark this socket as a screen
        isScreen = true;
        socket.screen = true;
        socket.gameRole = CONSTANTS.GAME_ROLES.SCREEN;

        // Join a special room for screens
        socket.join(CONSTANTS.SOCKET_ROOMS.SCREENS);

        // Send current game state if available
        if (gameLogic.game) {
          const stateData = {
            isGameRunning: gameLogic.game.isGameRunning,
            roundNumber: gameLogic.game.round,
            timeRemaining: gameLogic.game.timeRemaining,
          };

          // If the game is running and a round is active, send more data
          if (
            gameLogic.game.isGameRunning &&
            gameLogic.game.round >= CONSTANTS.FIRST_ROUND_NUMBER
          ) {
            io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
              CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
              stateData,
            );
          }
        }
      } catch (error) {
        console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SCREEN_CONNECT, error);
        socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
          message: CONSTANTS.ERROR_MESSAGES.ERROR_CONNECTING_SCREEN,
        });
      }
    });

    // Handle team registration
    socket.on('register_team', (data) => {
      try {
        const { teamName, students } = data;
        if (!teamName || !students || !Array.isArray(students) || students.length === 0) {
          socket.emit('team_registration_error', { error: 'Invalid team registration data' });
          return;
        }

        console.log(`Team registration requested: ${teamName} with ${students.length} students`);
        
        // Register the team
        const result = teamManager.registerTeam(teamName, students);
        
        if (result.success) {
          console.log(`Team registered: ${teamName}`);
          
          // Store team info on the socket for when they join the game
          socket.teamName = teamName;
          socket.teamMembers = students;
          
          // Emit join game event automatically after team registration
          playerName = teamName.trim();
          
          // Store player name and role on socket
          socket.playerName = playerName;
          socket.gameRole = CONSTANTS.GAME_ROLES.PLAYER;
          socket.join(CONSTANTS.SOCKET_ROOMS.PLAYERS);
          
          // Create player-specific room
          socket.join(getPlayerRoom(playerName));
          
          console.log(`Team ${playerName} automatically joining after registration`);
          
          // Use the io instance from the outer scope
          const joinResult = addPlayer(playerName, socket.id, io);
          
          if (joinResult.success) {
            console.log(`Team joined: ${playerName} with socket ID ${socket.id}`);
            
            // Store team info in the game player object
            const gameLogic = require('./gameLogic');
            if (gameLogic.game.players[playerName]) {
              gameLogic.game.players[playerName].isTeam = true;
              gameLogic.game.players[playerName].teamMembers = socket.teamMembers;
            }
            
            // Send game joined event to the player
            io.to(getPlayerRoom(playerName)).emit(CONSTANTS.SOCKET.EVENT_GAME_JOINED, {
              playerName: playerName,
              initialCapital: joinResult.initialCapital,
              initialOutput: joinResult.initialOutput,
              isGameRunning: gameLogic.game.isGameRunning,
              round: gameLogic.game.round,
              autoStart: joinResult.autoStart,
              manualStartEnabled: joinResult.manualStartEnabled
            });
            
            // Send player_joined to the instructor room with team info
            console.log('Sending team_joined to instructor room');
            io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, {
              playerName: playerName,
              initialCapital: joinResult.initialCapital,
              initialOutput: joinResult.initialOutput,
              isTeam: true,
              teamMembers: socket.teamMembers
            });
            
            // Also notify screens
            io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, {
              playerName,
              isTeam: true
            });
            
            // Prepare updated student list info for broadcasting
            const allStudents = teamManager.getStudentList();
            const studentsInTeams = new Set();
            const teamInfo = {};
            
            // Collect all students who are already in teams and their team info
            Object.entries(teamManager.getTeams()).forEach(([teamName, team]) => {
              team.students.forEach(student => {
                studentsInTeams.add(student);
                teamInfo[student] = teamName;
              });
            });
            
            // Broadcast updated student list to all clients
            console.log(`Broadcasting updated student list: ${allStudents.length - studentsInTeams.size} available out of ${allStudents.length} total`);
            io.emit('student_list_updated', {
              allStudents: allStudents,
              studentsInTeams: Array.from(studentsInTeams),
              teamInfo: teamInfo,
              unavailableCount: studentsInTeams.size
            });
            
            // Notify the client about successful team registration
            socket.emit('team_registered', { 
              success: true, 
              teamName, 
              students 
            });
          } else {
            console.error(`Team join failed after registration: ${playerName}:`, joinResult.error);
            socket.emit('team_registration_error', { error: joinResult.error });
          }
        } else {
          console.log(`Team registration failed: ${result.error}`);
          socket.emit('team_registration_error', { error: result.error });
        }
      } catch (error) {
        console.error('Error in team registration:', error);
        socket.emit('team_registration_error', { error: 'Server error during team registration' });
      }
    });

    // Handle reconnection with existing name
    socket.on(CONSTANTS.SOCKET.EVENT_RECONNECT_GAME, ({ playerName: name }) => {
      try {
        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
          socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, {
            success: false,
            error: CONSTANTS.ERROR_MESSAGES.INVALID_INPUT,
          });
          return;
        }

        playerName = name.trim();

        // Try to reconnect the player
        const result = playerReconnect(playerName, socket.id);

        if (result.success) {
          // Join the players room
          socket.join(CONSTANTS.SOCKET_ROOMS.PLAYERS);

          // Join player-specific room
          socket.join(getPlayerRoom(playerName));

          console.log(`Player reconnected: ${playerName}`);

          // Send current game state to the player
          if (
            result.isGameRunning &&
            result.round >= CONSTANTS.FIRST_ROUND_NUMBER
          ) {
            const gameLogic = require('./gameLogic');
            io.to(getPlayerRoom(playerName)).emit(
              CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT,
              {
                roundNumber: result.round,
                capital: result.capital,
                output: result.output,
                submitted: result.submitted,
                timeRemaining: gameLogic.game.timeRemaining,
              },
            );
          }

          // Also notify screens about reconnection
          io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
            CONSTANTS.SOCKET.EVENT_PLAYER_JOINED,
            {
              playerName,
              isReconnect: true,
            },
          );
        }

        // Send acknowledgment to the client
        socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, result);
      } catch (error) {
        console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_RECONNECT_GAME, error);
        socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_ACK, {
          success: false,
          error: CONSTANTS.ERROR_MESSAGES.SERVER_ERROR_RECONNECT,
        });
      }
    });

    // Instructor starts the game
    socket.on(CONSTANTS.SOCKET.EVENT_START_GAME, () => {
      try {
        if (!isInstructor) {
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
            message: CONSTANTS.ERROR_MESSAGES.NOT_AUTHORIZED,
          });
          return;
        }

        const result = startGame();

        if (result.success) {
          console.log('Game started');

          // Broadcast game started to all players and instructors
          io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
            CONSTANTS.SOCKET.EVENT_GAME_STARTED,
          );

          // Start the first round
          startRound(io);
        } else {
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, { message: result.error });
        }
      } catch (error) {
        console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_START_GAME, error);
        socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
          message: CONSTANTS.ERROR_MESSAGES.ERROR_STARTING_GAME,
        });
      }
    });

    // Instructor forces the game to end
    socket.on(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME, () => {
      try {
        if (!isInstructor) {
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
            message: CONSTANTS.ERROR_MESSAGES.NOT_AUTHORIZED,
          });
          return;
        }

        console.log('Instructor requested force end game');

        // Force end current round and game
        const gameLogic = require('./gameLogic');
        const result = gameLogic.forceEndGame(io);

        if (!result.success) {
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
            message:
              result.error || CONSTANTS.ERROR_MESSAGES.ERROR_FORCE_END_GAME,
          });
        }
      } catch (error) {
        console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_FORCE_END_GAME, error);
        socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
          message: CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_FORCE_END_GAME,
        });
      }
    });

    // Instructor toggles manual start mode
    socket.on(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, ({ enabled }) => {
      try {
        if (!isInstructor) {
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
            message: CONSTANTS.ERROR_MESSAGES.NOT_AUTHORIZED,
          });
          return;
        }

        console.log(
          `Instructor requested to ${enabled ? 'enable' : 'disable'} manual start mode`,
        );

        const gameLogic = require('./gameLogic');
        const result = gameLogic.setManualStartMode(enabled);

        if (result.success) {
          console.log(`Manual start mode ${enabled ? 'enabled' : 'disabled'}`);

          // Notify all clients about the change
          io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(CONSTANTS.SOCKET.EVENT_MANUAL_START_MODE, { enabled: result.manualStartEnabled });

          // If switching to auto mode (disabling manual start), check if we should auto-start based on current player count
          if (!enabled && !gameLogic.game.isGameRunning) {
            console.log('Checking for auto-start after toggling to auto mode');
            gameLogic.checkAutoStart(io);
          }
        }
      } catch (error) {
        console.error(
          CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SET_MANUAL_START,
          error,
        );
        socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
          message: CONSTANTS.ERROR_MESSAGES.ERROR_SETTING_MANUAL_START,
        });
      }
    });

    // Student submits investment
    socket.on(
      CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT,
      ({ investment, isAutoSubmit }) => {
        try {
          console.log(
            `Received investment submission from socket ${socket.id} (role: ${socket.gameRole || 'unknown'})`,
          );

          if (!playerName) {
            console.error(
              `${CONSTANTS.DEBUG_MESSAGES.NO_PLAYER_NAME} ${socket.id}`,
            );
            socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
              message: CONSTANTS.ERROR_MESSAGES.NOT_IN_GAME,
            });
            return;
          }

          console.log(
            `Processing investment from ${playerName}: ${investment}`,
          );

          const gameLogic = require('./gameLogic');
          // Debug game state
          console.log('Game state:', {
            isGameRunning: gameLogic.game.isGameRunning,
            round: gameLogic.game.round,
            playerCount: Object.keys(gameLogic.game.players).length,
            instructorRoomSize:
              io.sockets.adapter.rooms.get(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR)
                ?.size || 0,
          });

          const result = gameLogic.submitInvestment(
            playerName,
            investment,
            isAutoSubmit,
          );

          if (result.success) {
            console.log(
              `Investment submitted by ${playerName}: ${result.investment}${isAutoSubmit ? ' (auto-submitted)' : ''}`,
            );
            io.to(getPlayerRoom(playerName)).emit(
              CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
              { investment: result.investment, isAutoSubmit },
            );

            // Always broadcast to instructor room
            console.log('Sending investment_received to instructor room');
            io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
              CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
              {
                playerName,
                investment: result.investment,
                isAutoSubmit,
              },
            );

            // Also notify screens about the investment
            io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
              CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED,
              {
                playerName,
                investment: result.investment,
                isAutoSubmit,
              },
            );

            // Check if the round should end (all players submitted)
            if (gameLogic.game.pendingEndRound) {
              console.log(
                'All players have submitted - ending round immediately',
              );

              // Prepare notification message
              const notificationData = {
                message: CONSTANTS.UI_TEXT.ALL_SUBMITTED_NOTIFICATION,
                timeRemaining: CONSTANTS.ALL_SUBMITTED_NOTIFICATION_SECONDS, // Show message for specified time
              };

              try {
                // Send notification to all students
                io.to(CONSTANTS.SOCKET_ROOMS.PLAYERS).emit(
                  CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
                  notificationData,
                );

                // Send notification to instructor room
                io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
                  CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
                  notificationData,
                );

                // Send notification to screens
                io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
                  CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED,
                  notificationData,
                );

                // Clear timers safely
                try {
                  if (gameLogic.game.roundTimer) {
                    clearTimeout(gameLogic.game.roundTimer);
                  }
                  if (gameLogic.game.timerInterval) {
                    clearInterval(gameLogic.game.timerInterval);
                  }
                } catch (timerError) {
                  console.error(
                    CONSTANTS.DEBUG_MESSAGES.ERROR_CLEARING_TIMERS,
                    timerError,
                  );
                }

                // Add a slight delay before ending the round to allow for UI updates
                setTimeout(() => {
                  try {
                    gameLogic.endRound(io);
                  } catch (endRoundError) {
                    console.error(
                      CONSTANTS.DEBUG_MESSAGES.ERROR_ENDING_ROUND,
                      endRoundError,
                    );
                  }
                }, CONSTANTS.ALL_SUBMITTED_UI_DELAY_MS);
              } catch (notificationError) {
                console.error(
                  CONSTANTS.DEBUG_MESSAGES.ERROR_SENDING_NOTIFICATIONS,
                  notificationError,
                );
              }
            } else if (result.allSubmitted) {
              // This could happen if multiple submissions come in at almost the same time
              console.log(
                'This submission completed all required inputs - will end round shortly',
              );
            }
          } else {
            console.error(
              `${CONSTANTS.DEBUG_MESSAGES.INVESTMENT_SUBMISSION_FAILED} ${playerName}:`,
              result.error,
            );
            socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
              message: result.error,
            });
          }
        } catch (error) {
          console.error(
            CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SUBMIT_INVESTMENT,
            error,
          );
          socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
            message: CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_INVESTMENT,
          });
        }
      },
    );

    // Client requests student list
    socket.on(CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST, () => {
      console.log(`Received get_student_list request from client: ${socket.id}`);
      try {
        // Get all students
        const allStudents = teamManager.getStudentList();
        console.log(`Retrieved ${allStudents.length} students from teamManager`);

        // Get students who are already in teams
        const studentsInTeams = new Set();
        const teamInfo = {}; // Map student name to team name

        // Collect all students who are already in teams and their team info
        Object.entries(teamManager.getTeams()).forEach(([teamName, team]) => {
          team.students.forEach(student => {
            studentsInTeams.add(student);
            teamInfo[student] = teamName;
          });
        });

        // Prepare the data to send
        const responseData = {
          allStudents: allStudents,
          studentsInTeams: Array.from(studentsInTeams),
          teamInfo: teamInfo,
          unavailableCount: studentsInTeams.size
        };

        console.log(`Sending student list to client ${socket.id}:`, {
          totalStudents: allStudents.length,
          studentsInTeams: studentsInTeams.size,
          availableStudents: allStudents.length - studentsInTeams.size
        });

        // Send the complete list to the client with availability info
        socket.emit(CONSTANTS.SOCKET.EVENT_STUDENT_LIST, responseData);

        console.log(`Sent student list to client: ${socket.id} (${allStudents.length - studentsInTeams.size} available out of ${allStudents.length} total)`);
      } catch (error) {
        console.error('Error sending student list:', error);
        socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, { message: 'Error retrieving student list' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        console.log(`Disconnected: ${socket.id}`);

        // Socket.IO automatically handles room membership on disconnect
        if (isInstructor) {
          console.log('Instructor disconnected');
          io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
            CONSTANTS.SOCKET.EVENT_INSTRUCTOR_DISCONNECTED,
          );
        }

        // Handle screen disconnect
        if (isScreen) {
          console.log('Screen disconnected');
        }

        // If this was a player, notify others about the disconnection
        if (playerName) {
          console.log(`Player disconnected: ${playerName}`);

          // Notify instructor and screens about the disconnection
          io.to(CONSTANTS.SOCKET_ROOMS.INSTRUCTOR).emit(
            CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
            { playerName },
          );
          io.to(CONSTANTS.SOCKET_ROOMS.SCREENS).emit(
            CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED,
            { playerName },
          );
        }

        // Mark player as disconnected
        playerDisconnect(socket.id);
      } catch (error) {
        console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_DISCONNECT, error);
      }
    });
  });
}

module.exports = { setupSocketEvents };
