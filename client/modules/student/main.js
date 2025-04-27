// client/modules/student/main.js
/**
 * Student Main Module
 * Entry point for the student interface
 */
(function (window) {
  'use strict';

  const StudentMain = {
    // Methods
    /**
     * Initialize event handlers for DOM elements
     */
    initializeDOMEventHandlers: function () {
      // Only call if DOM elements are ready
      if (!window.StudentDom || !window.StudentDom.elements) {
        console.error('StudentDom not available, cannot set up event handlers');
        return;
      }

      const elements = window.StudentDom.elements;

      // Team registration form submission
      elements.teamRegistrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const teamName = elements.teamName.value.trim();
        const selectedStudents = Array.from(
          window.StudentDom.studentData.selectedStudents
        );

        if (!teamName) {
          elements.teamRegistrationError.textContent =
            'Please enter a team name.';
          return;
        }

        if (selectedStudents.length === 0) {
          elements.teamRegistrationError.textContent =
            'Please select at least one student.';
          return;
        }

        console.log(
          `Registering team: ${teamName} with students: ${selectedStudents.join(
            ', '
          )}`
        );

        // Clear error message
        elements.teamRegistrationError.textContent = '';

        // Disable register button to prevent double submission
        elements.registerTeamButton.disabled = true;

        // Register the team via socket
        if (window.TeamHandlers) {
          window.TeamHandlers.registerTeam(teamName, selectedStudents);
        } else if (window.StudentSocket) {
          window.StudentSocket.registerTeam(teamName, selectedStudents);
        } else {
          console.error('Cannot register team: Socket handlers not available');
          elements.registerTeamButton.disabled = false;
        }
      });

      // Investment submission
      elements.submitInvestment.addEventListener('click', () => {
        // Get investment value
        const investment = parseFloat(elements.investmentValue.value);
        const maxInvestment = window.StudentGame.state.currentOutput;

        if (isNaN(investment)) {
          elements.investmentStatus.textContent =
            'Please enter a valid investment amount.';
          return;
        }

        if (investment < 0) {
          elements.investmentStatus.textContent =
            'Investment cannot be negative.';
          return;
        }

        if (investment > maxInvestment) {
          elements.investmentStatus.textContent = `Investment cannot exceed your output of ${maxInvestment}.`;
          return;
        }

        // Clear status message
        elements.investmentStatus.textContent = '';

        // Disable submit button
        elements.submitInvestment.disabled = true;

        // Submit the investment via socket
        console.log(`Submitting investment: ${investment}`);
        if (window.socket) {
          window.socket.emit(window.CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, {
            investment,
          });
        } else {
          console.error('Socket not available for investment submission');
        }
      });

      // Investment slider updates numeric input
      elements.investmentSlider.addEventListener('input', () => {
        elements.investmentValue.value = elements.investmentSlider.value;
      });

      // Numeric input updates slider
      elements.investmentValue.addEventListener('input', () => {
        elements.investmentSlider.value = elements.investmentValue.value;
      });
    },

    /**
     * Initialize the application
     */
    init: function () {
      console.log('Initializing student app...');

      // Initialize UI
      if (window.StudentDom) {
        window.StudentDom.initializeUI();
      } else {
        console.error('StudentDom module not available, cannot initialize UI');
      }

      // Initialize socket event handlers
      if (window.StudentSocket) {
        window.StudentSocket.initializeSocketEvents();
      } else {
        console.error(
          'StudentSocket module not available, cannot initialize socket events'
        );
      }

      // Initialize DOM event handlers
      this.initializeDOMEventHandlers();

      // Show team registration UI first
      if (window.StudentDom) {
        window.StudentDom.showTeamRegistrationUI();
      }

      console.log('Student app initialized');

      // Wait for socket to connect before requesting student list
      // This ensures the socket is properly established
      if (window.StudentSocket && window.StudentSocket.socket) {
        if (window.StudentSocket.socket.connected) {
          console.log('Socket already connected, requesting student list...');
          this.requestStudentList();
        } else {
          console.log(
            'Waiting for socket connection before requesting student list...'
          );
          window.StudentSocket.socket.on('connect', () => {
            console.log('Socket connected, now requesting student list...');
            // Use a small delay to ensure connection is fully established
            setTimeout(() => this.requestStudentList(), 200);
          });
        }
      } else {
        console.error('Socket not available for student list request');
      }
    },

    /**
     * Request student list from server
     * Uses either TeamHandlers or StudentSocket
     */
    requestStudentList: function () {
      console.log('requestStudentList called at', new Date().toISOString());

      if (window.TeamHandlers && window.TeamHandlers.getStudentList) {
        console.log('Using TeamHandlers.getStudentList');
        window.TeamHandlers.getStudentList();
      } else if (window.StudentSocket && window.StudentSocket.getStudentList) {
        console.log('Using StudentSocket.getStudentList');
        window.StudentSocket.getStudentList();
      } else {
        console.error('Cannot request student list: handlers not available');

        // Try a direct socket emit as a fallback
        if (window.socket) {
          console.log('Using window.socket directly as fallback');
          window.socket.emit('get_student_list');
        } else {
          console.error('No socket available as fallback');
        }
      }
    },

    /**
     * Schedule multiple attempts to request the student list
     * to handle race conditions or timing issues
     */
    scheduleStudentListRequests: function () {
      // First attempt
      this.requestStudentList();

      // Second attempt after a short delay
      setTimeout(() => {
        console.log('Making second attempt to request student list');
        this.requestStudentList();
      }, 1500);

      // Third attempt after a longer delay
      setTimeout(() => {
        console.log('Making third attempt to request student list');
        this.requestStudentList();
      }, 3000);

      // Final attempt after socket should definitely be connected
      setTimeout(() => {
        console.log('Making final attempt to request student list');
        this.requestStudentList();
      }, 5000);
    },
  };

  // Expose the module to window
  window.StudentMain = StudentMain;

  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.StudentMain.init();
  });
})(window);
