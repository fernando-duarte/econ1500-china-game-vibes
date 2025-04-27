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
    // Socket reference to be set by the socket module
    socket: null,

    /**
     * Handle student list response
     * @param {Object} data - Student list data
     */
    handleStudentList: function (data) {
      console.log('Received student_list event from server:', data);
      if (window.SocketUtils) {
        window.SocketUtils.logEvent('Student list received', data);
      }

      if (!data || !data.allStudents) {
        console.warn('handleStudentList received invalid or empty data.', data);
        if (window.StudentDom) {
          window.StudentDom.populateStudentList([], [], {}, 0);
          window.StudentDom.diagnoseStudentList('handleStudentList-empty');
        } else {
          console.error('StudentDom not found, cannot populate student list');
        }
        return;
      }

      if (window.StudentDom) {
        window.StudentDom.populateStudentList(
          data.allStudents,
          data.studentsInTeams,
          data.teamInfo,
          data.unavailableCount
        );
        window.StudentDom.diagnoseStudentList('handleStudentList');
        setTimeout(() => {
          window.StudentDom.diagnoseStudentList('handleStudentList-delayed');
        }, 500);
      } else {
        console.error('StudentDom not found, cannot populate student list');
      }
    },

    /**
     * Handle student list updates
     * @param {Object} data - Updated student list data
     */
    handleStudentListUpdated: function (data) {
      if (window.SocketUtils) {
        window.SocketUtils.logEvent('Student list updated', data);
      }

      if (!window.StudentDom) {
        console.error('StudentDom not found, cannot update student list');
        return;
      }

      // If we receive a full update, always refresh the complete list
      if (data.allStudents) {
        // Full update from server
        window.StudentDom.populateStudentList(
          data.allStudents,
          data.studentsInTeams,
          data.teamInfo,
          data.unavailableCount
        );
      } else if (data.studentsInTeams) {
        // For partial updates, always update the availability status to keep UI in sync
        window.StudentDom.updateStudentAvailability(
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
      if (window.SocketUtils) {
        window.SocketUtils.logEvent('Team registration response', data);
      }

      if (!window.StudentDom) {
        console.error('StudentDom not found, cannot handle team registration');
        return;
      }

      const elements = window.StudentDom.elements;

      if (data.success) {
        // Store team info in game state
        if (window.StudentGame) {
          window.StudentGame.state.teamName = data.teamName;
          window.StudentGame.state.teamMembers = data.students;
          window.StudentGame.state.currentPlayerName = data.teamName; // Set current player name to team name
        } else {
          console.error('StudentGame not found, cannot store team info');
        }

        // Clear selected students
        window.StudentDom.studentData.selectedStudents.clear();

        // Enable the register button again (for other potential registrations)
        elements.registerTeamButton.disabled = false;

        console.log(`Team registered successfully: ${data.teamName}`);
        // Transition to game UI after successful registration
        if (
          window.StudentDom &&
          typeof window.StudentDom.showGameUI === 'function'
        ) {
          window.StudentDom.showGameUI();
        }
        // Clear fallback student list timer if it exists
        if (window.fallbackStudentListTimer) {
          clearTimeout(window.fallbackStudentListTimer);
        }
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
      if (window.SocketUtils) {
        window.SocketUtils.logEvent('Team registration error', data);
      }

      if (!window.StudentDom) {
        console.error(
          'StudentDom not found, cannot handle team registration error'
        );
        return;
      }

      const elements = window.StudentDom.elements;

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
      console.log(
        'Requesting student list from server...',
        new Date().toISOString()
      );
      const socket =
        this.socket ||
        window.socket ||
        (window.StudentSocket && window.StudentSocket.socket);

      if (!socket) {
        console.error(
          'Socket not available to request student list at',
          new Date().toISOString()
        );

        // Fallback: Try to provide default student list from the fallback list
        if (window.teamManagerStudentList && window.StudentDom) {
          console.log(
            'Using fallback student list since socket is not available'
          );
          window.StudentDom.populateStudentList(
            window.teamManagerStudentList,
            [],
            {},
            0
          );
        }

        setTimeout(() => {
          console.log('Retrying student list request after delay...');
          this.getStudentList();
        }, 1000);
        return;
      }

      if (!socket.connected) {
        console.warn('Socket not connected, will retry getStudentList once');

        // Fallback: Try to provide default student list while waiting for connection
        if (window.teamManagerStudentList && window.StudentDom) {
          console.log(
            'Using fallback student list while waiting for connection'
          );
          window.StudentDom.populateStudentList(
            window.teamManagerStudentList,
            [],
            {},
            0
          );
        }

        if (!this._retryTimer) {
          this._retryTimer = setTimeout(() => {
            this._retryTimer = null;
            this.getStudentList();
          }, 1000);
        }

        socket.once('connect', () => {
          if (this._retryTimer) {
            clearTimeout(this._retryTimer);
            this._retryTimer = null;
          }
          this.getStudentList();
        });
        return;
      }

      // Add a direct event handler for immediate response
      socket.once('student_list', (data) => {
        console.log('Received direct student_list response');
        this.handleStudentList(data);
      });

      const eventName =
        window.CONSTANTS &&
        window.CONSTANTS.SOCKET &&
        window.CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST
          ? window.CONSTANTS.SOCKET.EVENT_GET_STUDENT_LIST
          : 'get_student_list';
      socket.emit(eventName);
      console.log(
        `Sent ${eventName} event to server at ${new Date().toISOString()}`
      );

      // Set a timeout to use fallback if server doesn't respond
      setTimeout(() => {
        // Check if we've already received data
        if (
          !window.StudentDom ||
          !window.StudentDom.studentData.allStudents.length
        ) {
          console.warn(
            'No student list received after timeout, using fallback data'
          );
          if (window.teamManagerStudentList && window.StudentDom) {
            window.StudentDom.populateStudentList(
              window.teamManagerStudentList,
              [],
              {},
              0
            );
          }
        }
      }, 2000);
    },

    /**
     * Register a team with selected students
     * @param {string} teamName - Team name
     * @param {Array} students - Array of selected student names
     */
    registerTeam: function (teamName, students) {
      try {
        const socket = window.socket || this.socket;
        if (!socket) {
          console.error('Socket not available for team registration');
          return;
        }

        if (!window.CONSTANTS || !window.CONSTANTS.SOCKET) {
          console.error(
            'CONSTANTS not found or SOCKET object missing, using hard-coded event name'
          );
          console.log('Fallback: Sending register_team event to server');
          socket.emit('register_team', {
            teamName,
            students,
          });
          return;
        }

        // Log the event name and data for debugging
        const eventName = window.CONSTANTS.SOCKET.EVENT_REGISTER_TEAM;
        console.log(`Preparing to emit ${eventName} event with data:`, {
          teamName,
          studentCount: students.length,
        });

        // Verify socket connection before sending
        if (!socket.connected) {
          console.error('Socket is not connected when trying to register team');
          alert(
            'Connection to server lost. Please refresh the page and try again.'
          );
          return;
        }

        // Emit the register_team event
        socket.emit(eventName, {
          teamName,
          students,
        });
        console.log(`Sent ${eventName} event to server with team: ${teamName}`);

        // Add event listeners if they don't exist yet
        if (!this._registrationListenersSet) {
          console.log(
            'Setting up one-time registration confirmation listeners'
          );

          // Set up a confirmation listener with a timeout
          const timeout = setTimeout(() => {
            console.error(
              'Team registration timed out - no response from server'
            );
            if (window.StudentDom && window.StudentDom.elements) {
              window.StudentDom.elements.teamRegistrationError.textContent =
                'Registration request timed out. Please try again.';
              window.StudentDom.elements.registerTeamButton.disabled = false;
            }
          }, 5000);

          // Set up a one-time success listener to clear the timeout
          socket.once(window.CONSTANTS.SOCKET.EVENT_TEAM_REGISTERED, () => {
            console.log('Received team registration confirmation');
            clearTimeout(timeout);
          });

          // Set up a one-time error listener to clear the timeout
          socket.once('team_registration_error', () => {
            console.log('Received team registration error');
            clearTimeout(timeout);
          });

          this._registrationListenersSet = true;
        }
      } catch (error) {
        console.error('Error registering team:', error);
        if (window.StudentDom && window.StudentDom.elements) {
          window.StudentDom.elements.teamRegistrationError.textContent =
            'Error sending registration request: ' +
            (error.message || 'Unknown error');
          window.StudentDom.elements.registerTeamButton.disabled = false;
        }
      }
    },
  };

  // Expose the module to window
  window.TeamHandlers = TeamHandlers;
})(window);
