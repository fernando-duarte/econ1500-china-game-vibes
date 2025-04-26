function handleGetStudentList(socket, teamManager, CONSTANTS) {
  console.log(
    `Received direct get_student_list request from client: ${socket.id}`
  );
  try {
    const allStudents = teamManager.getStudentList();
    const studentsInTeams = new Set();
    const teamInfo = {}; // Maps student name to team name

    // Aggregate students currently in teams
    Object.entries(teamManager.getTeams()).forEach(([teamName, team]) => {
      team.students.forEach((student) => {
        studentsInTeams.add(student);
        teamInfo[student] = teamName;
      });
    });

    const responseData = {
      allStudents: allStudents,                     // List of all possible student names
      studentsInTeams: Array.from(studentsInTeams), // List of students currently in a team
      teamInfo: teamInfo,                           // Map of student -> team name
      unavailableCount: studentsInTeams.size,       // Count of students in teams
    };

    console.log(
      `Sending student list to client ${socket.id} (direct request): `,
      {
        totalStudents: allStudents.length,
        studentsInTeams: studentsInTeams.size,
        availableStudents: allStudents.length - studentsInTeams.size,
      }
    );

    // Use the constant for the event name
    socket.emit(CONSTANTS.SOCKET.EVENT_STUDENT_LIST, responseData);
    console.log(`Sent student list to client: ${socket.id} (direct request)`);

  } catch (error) {
    console.error('Error sending student list (direct request):', error);
    // Use the constant for the error event
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, { message: 'Error retrieving student list' });
  }
}

module.exports = handleGetStudentList; 