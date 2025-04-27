/**
 * Student Team Handlers
 * Manages team registration and student list events
 */
(function (window) {
  'use strict';

  /**
   * Team registration handlers for student client
   * @namespace
   */
  const TeamHandlers = {
    /**
     * Handle student list response
     * @param {Object} data - Student list data
     */
    handleStudentList: function (data) {
      console.log('Student list received from server:', data);
      SocketUtils.logEvent('Student list received', data);
      if (data && data.allStudents) {
        console.log(
          `Populating student list with ${data.allStudents.length} students`
        );
        StudentDom.populateStudentList(
          data.allStudents,
          data.studentsInTeams,
          data.teamInfo,
          data.unavailableCount
        );
      } else {
        console.error('Invalid student list data received:', data);
      }
    },

    /**
     * Handle student list updates
     * @param {Object} data - Updated student list data
     */
    handleStudentListUpdated: function (data) {
      SocketUtils.logEvent('Student list updated', data);

      // If we receive a full update, always refresh the complete list
      if (data.allStudents) {
        // Full update from server
        StudentDom.populateStudentList(
          data.allStudents,
          data.studentsInTeams,
          data.teamInfo,
          data.unavailableCount
        );
      } else if (data.studentsInTeams) {
        // For partial updates, always update the availability status to keep UI in sync
        StudentDom.updateStudentAvailability(
          data.studentsInTeams,
          data.unavailableCount
        );
      }
    },

    /**
     * Handle team registration response
     * @param {Object} data - Team registration result
     */
    handleTeamRegistered: function (data) {
      SocketUtils.logEvent('Team registration response', data);
      const elements = StudentDom.elements;

      if (data.success) {
        // Store team info in game state
        StudentGame.state.teamName = data.teamName;
        StudentGame.state.teamMembers = data.students;
        StudentGame.state.currentPlayerName = data.teamName; // Set current player name to team name

        // Clear selected students
        StudentDom.studentData.selectedStudents.clear();

        // Enable the register button again (for other potential registrations)
        elements.registerTeamButton.disabled = false;

        console.log(`Team registered successfully: ${data.teamName}`);
      } else {
        // Show error message
        elements.teamRegistrationError.textContent = data.error;
        elements.registerTeamButton.disabled = false;
      }
    },

    /**
     * Handle team registration error
     * @param {Object} data - Team registration error data
     */
    handleTeamRegistrationError: function (data) {
      SocketUtils.logEvent('Team registration error', data);
      const elements = StudentDom.elements;

      // Display the error message
      elements.teamRegistrationError.textContent =
        data.error || 'Error registering team';

      // Re-enable the register button so they can try again
      elements.registerTeamButton.disabled = false;
    },

    /**
     * Request student list from server
     */
    getStudentList: function () {
      console.log('Requesting student list from server...');
      this.socket.emit(CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST);
      console.log(
        `Sent ${CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST} event to server`
      );
    },

    /**
     * Register a team with selected students
     * @param {string} teamName - Team name
     * @param {Array} students - Array of selected student names
     */
    registerTeam: function (teamName, students) {
      this.socket.emit('register_team', { teamName, students });
    },
  };

  // Expose the module to window
  window.StudentTeamHandlers = TeamHandlers;
})(window);
