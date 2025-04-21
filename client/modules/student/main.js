// client/modules/main.js
(function(window) {
  'use strict';

  // Define StudentMain module
  const StudentMain = {
    // Methods
    initializeDOMEventHandlers: function() {
      const elements = StudentDom.elements;

      // Team registration button click event
      elements.registerTeamButton.addEventListener('click', () => {
        const teamName = elements.teamName.value.trim();
        if (!teamName) {
          elements.teamRegistrationError.textContent = CONSTANTS.UI_TEXT.ERROR_ENTER_TEAM_NAME;
          return;
        }

        // Get selected students from our tracked selections
        const selectedStudents = Array.from(StudentDom.studentData.selectedStudents);

        if (selectedStudents.length === 0) {
          elements.teamRegistrationError.textContent = CONSTANTS.UI_TEXT.ERROR_SELECT_STUDENTS;
          return;
        }

        elements.teamRegistrationError.textContent = '';
        elements.registerTeamButton.disabled = true;

        StudentSocket.registerTeam(teamName, selectedStudents);
      });

      // Join game button click event
      elements.joinButton.addEventListener('click', () => {
        const name = elements.playerName.value.trim();

        if (!name) {
          elements.joinError.textContent = CONSTANTS.UI_TEXT.ERROR_ENTER_NAME;
          return;
        }

        elements.joinError.textContent = '';
        elements.joinButton.disabled = true;

        StudentSocket.joinGame(name);
      });

      // Handle investment slider and value sync
      elements.investmentSlider.addEventListener('input', () => {
        elements.investmentValue.value = elements.investmentSlider.value;
      });

      elements.investmentValue.addEventListener('input', () => {
        // Clamp the value between 0 and max output
        const value = parseFloat(elements.investmentValue.value);
        if (!isNaN(value)) {
          const clampedValue = Math.min(Math.max(CONSTANTS.INVESTMENT_MIN, value), StudentGame.state.currentOutput);
          elements.investmentValue.value = clampedValue;
          elements.investmentSlider.value = clampedValue;
        }
      });

      // Submit investment button click event
      elements.submitInvestment.addEventListener('click', () => {
        if (StudentGame.state.hasSubmittedInvestment) return;

        const investment = parseFloat(elements.investmentValue.value);
        if (isNaN(investment)) {
          elements.investmentStatus.textContent = CONSTANTS.UI_TEXT.ERROR_ENTER_VALID_NUMBER;
          return;
        }

        StudentSocket.submitInvestment(investment);
        StudentGame.disableInvestmentControls(CONSTANTS.UI_TEXT.STATUS_INVESTMENT_SUBMITTED);
      });
    },

    init: function() {
      // Initialize UI
      StudentDom.initializeUI();

      // Initialize socket event handlers
      StudentSocket.initializeSocketEvents();

      // Initialize DOM event handlers
      this.initializeDOMEventHandlers();

      // Show team registration UI first
      StudentDom.showTeamRegistrationUI();

      // Request student list
      StudentSocket.getStudentList();

      console.log('Student app initialized');
    }
  };

  // Expose the module to window
  window.StudentMain = StudentMain;

  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    StudentMain.init();
  });
})(window);