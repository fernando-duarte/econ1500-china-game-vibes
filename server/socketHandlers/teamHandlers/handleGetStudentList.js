function handleGetStudentList(socket, teamManager, CONSTANTS) {
  console.log(
    `Received direct get_student_list request from client: ${socket.id}`
  );
  try {
    // Get the student list with more detailed error checking
    const allStudents = teamManager.getStudentList();

    if (!allStudents || !Array.isArray(allStudents)) {
      console.error(
        `Failed to get valid student list. Received: ${typeof allStudents}`
      );
      console.error('Student list data:', allStudents);

      // Send an error to the client
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message: 'Error retrieving student list - invalid data',
      });
      return;
    }

    if (allStudents.length === 0) {
      console.error(
        'Student list is empty on server – aborting emit and notifying client.'
      );

      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message: 'Student list is empty on server – please contact instructor',
      });
      return; // stop processing
    } else {
      console.log(`Fetched ${allStudents.length} students from teamManager`);
    }

    // Set to track students in teams to avoid duplicates
    const studentsInTeams = new Set();
    const teamInfo = {}; // Maps student name to team name

    // Aggregate students currently in teams
    const teams = teamManager.getTeams();
    console.log(`Processing ${Object.keys(teams).length} existing teams`);

    Object.entries(teams).forEach(([teamName, team]) => {
      if (team && team.students && Array.isArray(team.students)) {
        team.students.forEach((student) => {
          studentsInTeams.add(student);
          teamInfo[student] = teamName;
        });
      } else {
        console.warn(`Team ${teamName} has invalid student data:`, team);
      }
    });

    const responseData = {
      allStudents: allStudents, // List of all possible student names
      studentsInTeams: Array.from(studentsInTeams), // List of students currently in a team
      teamInfo: teamInfo, // Map of student -> team name
      unavailableCount: studentsInTeams.size, // Count of students in teams
    };

    console.log(
      `Emitting student list to client ${socket.id}: ${responseData.allStudents.length} total students, ${studentsInTeams.size} in teams`
    );

    // Additional logging for first few students to confirm data structure
    if (responseData.allStudents.length > 0) {
      console.log(
        `First 3 students: ${responseData.allStudents.slice(0, 3).join(', ')}`
      );
    }

    // Verify the event name constant exists - critical check
    if (
      !CONSTANTS ||
      !CONSTANTS.SOCKET ||
      !CONSTANTS.SOCKET.EVENT_STUDENT_LIST
    ) {
      console.error(
        'CRITICAL ERROR: Missing CONSTANTS.SOCKET.EVENT_STUDENT_LIST. Using hardcoded fallback.'
      );
      // Send with hardcoded event name as fallback
      socket.emit('student_list', responseData);
      console.log('Sent student list using hardcoded event name');
    } else {
      // Use the constant for the event name
      socket.emit(CONSTANTS.SOCKET.EVENT_STUDENT_LIST, responseData);
      console.log(
        `Sent student list to client: ${socket.id} (direct request) with event ${CONSTANTS.SOCKET.EVENT_STUDENT_LIST}`
      );
    }

    // For debugging - send the same data again after a slight delay to catch race conditions
    setTimeout(() => {
      console.log(
        `Sending follow-up student list to client ${socket.id} after delay`
      );
      socket.emit(CONSTANTS.SOCKET.EVENT_STUDENT_LIST, responseData);
    }, 1000);
  } catch (error) {
    console.error('Error sending student list (direct request):', error);
    // Use the constant for the error event
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message:
        'Error retrieving student list: ' + (error.message || 'Unknown error'),
    });

    // Try again with empty arrays as a fallback
    try {
      console.log('Attempting to send empty student list as fallback');
      socket.emit(CONSTANTS.SOCKET.EVENT_STUDENT_LIST, {
        allStudents: [],
        studentsInTeams: [],
        teamInfo: {},
        unavailableCount: 0,
      });
      console.log('Sent empty student list fallback');
    } catch (fallbackError) {
      console.error(
        'Failed to send empty student list fallback:',
        fallbackError
      );
    }
  }
}

module.exports = handleGetStudentList;
