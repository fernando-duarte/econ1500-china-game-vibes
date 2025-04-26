// client/modules/dom.js
(function (window) {
  'use strict';

  // Define StudentDom module
  const StudentDom = {
    // DOM Elements
    elements: {
      // Team registration elements
      teamRegistrationForm: document.getElementById('teamRegistrationForm'),
      teamName: document.getElementById('teamName'),
      studentSearch: document.getElementById('studentSearch'),
      studentSelectionContainer: document.getElementById(
        'studentSelectionContainer'
      ),
      registerTeamButton: document.getElementById('registerTeamButton'),
      teamRegistrationError: document.getElementById('teamRegistrationError'),

      // Game UI elements
      gameUI: document.getElementById('gameUI'),
      displayName: document.getElementById('displayName'),
      roundNumber: document.getElementById('roundNumber'),
      totalRounds: document.getElementById('totalRounds'),
      roundStatus: document.getElementById('roundStatus'),
      capital: document.getElementById('capital'),
      output: document.getElementById('output'),

      // Investment UI elements
      investmentUI: document.getElementById('investmentUI'),
      timer: document.getElementById('timer'),
      investmentSlider: document.getElementById('investmentSlider'),
      investmentValue: document.getElementById('investmentValue'),
      maxOutput: document.getElementById('maxOutput'),
      submitInvestment: document.getElementById('submitInvestment'),
      investmentStatus: document.getElementById('investmentStatus'),

      // Results UI elements
      roundResults: document.getElementById('roundResults'),
      investmentResult: document.getElementById('investmentResult'),
      newCapital: document.getElementById('newCapital'),
      newOutput: document.getElementById('newOutput'),
      waitingNextRound: document.getElementById('waitingNextRound'),

      // Game over UI elements
      gameOverUI: document.getElementById('gameOverUI'),
      finalOutput: document.getElementById('finalOutput'),
      winner: document.getElementById('winner'),
      finalRankings: document.getElementById('finalRankings'),
    },

    /**
     * Initialize the UI elements
     */
    initializeUI: function () {
      const elements = this.elements;

      // Set up rounds info
      if (elements.totalRounds) {
        elements.totalRounds.textContent = CONSTANTS.ROUNDS;
      }

      if (document.getElementById('totalRoundsDuplicate')) {
        document.getElementById('totalRoundsDuplicate').textContent =
          CONSTANTS.ROUNDS;
      }

      // Set up round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START;
      }

      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START;
      }

      // Initialize input placeholders
      elements.teamName.placeholder = CONSTANTS.UI_TEXT.TEAM_NAME_PLACEHOLDER;
      elements.studentSelectionContainer.innerHTML =
        CONSTANTS.UI_TEXT.LOADING_STUDENT_LIST;

      // Prevent cross-client team name updates by isolating the team name input
      // This prevents the value from being synchronized across clients
      const teamNameInput = elements.teamName;
      teamNameInput.setAttribute('autocomplete', 'off');
      teamNameInput.setAttribute('data-private', 'true');
    },

    // Store student data for filtering
    studentData: {
      allStudents: [],
      studentsInTeams: [],
      teamInfo: {},
      unavailableCount: 0,
      selectedStudents: new Set(), // Track selected students
    },

    /**
     * Populate the student selection container with checkboxes
     * @param {Array} students - Array of all student names
     * @param {Array} studentsInTeams - Array of student names already in teams
     * @param {Object} teamInfo - Map of student names to team names
     * @param {number} unavailableCount - Number of students already in teams
     */
    populateStudentList: function (
      students,
      studentsInTeams,
      teamInfo,
      unavailableCount
    ) {
      console.log('populateStudentList called with:', {
        studentsCount: students ? students.length : 0,
        studentsInTeamsCount: studentsInTeams ? studentsInTeams.length : 0,
        unavailableCount: unavailableCount || 0,
      });

      // Store the data for filtering
      this.studentData.allStudents = students || [];
      this.studentData.studentsInTeams = studentsInTeams || [];
      this.studentData.teamInfo = teamInfo || {};
      this.studentData.unavailableCount = unavailableCount || 0;

      // Initialize search functionality if not already done
      this.initializeStudentSearch();

      // Render the student list with the current filter
      this.renderStudentList();
    },

    /**
     * Initialize the student search functionality
     */
    initializeStudentSearch: function () {
      // Only initialize once
      if (this.searchInitialized) return;

      const searchInput = this.elements.studentSearch;

      // Add event listener for search input
      searchInput.addEventListener('input', () => {
        this.renderStudentList(searchInput.value.trim().toLowerCase());
      });

      this.searchInitialized = true;
    },

    /**
     * Render the student list with optional search filter
     * @param {string} searchQuery - Optional search query to filter students
     */
    renderStudentList: function (searchQuery = '') {
      console.log('renderStudentList called with searchQuery:', searchQuery);
      const container = this.elements.studentSelectionContainer;
      console.log('studentSelectionContainer element:', container);
      const {
        allStudents,
        studentsInTeams,
        teamInfo,
        unavailableCount,
        selectedStudents,
      } = this.studentData;
      console.log('Student data for rendering:', {
        allStudentsCount: allStudents.length,
        studentsInTeamsCount: studentsInTeams.length,
        unavailableCount: unavailableCount,
      });

      container.innerHTML = '';

      if (!allStudents || allStudents.length === 0) {
        console.log('No students available to render');
        container.innerHTML = '<p>No students available</p>';
        return;
      }

      // Add info about unavailable students if any
      if (unavailableCount > 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'student-info';
        infoDiv.innerHTML = `<p class="student-unavailable-info">${unavailableCount} student${unavailableCount > 1 ? 's' : ''} already in teams.</p>`;
        container.appendChild(infoDiv);
      }

      // Convert studentsInTeams array to a Set for faster lookups
      const studentsInTeamsSet = new Set(studentsInTeams);

      // Filter students based on search query
      console.log('Filtering students with search query:', searchQuery);
      const filteredStudents = searchQuery
        ? allStudents.filter((student) =>
            student.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : allStudents;
      console.log(
        `Filtered ${filteredStudents.length} students out of ${allStudents.length} total`
      );

      // Show message if no students match the search
      if (filteredStudents.length === 0) {
        console.log('No students match the search query');
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No students match your search.';
        container.appendChild(noResults);
        return;
      }

      console.log('Creating checkboxes for filtered students...');
      filteredStudents.forEach((student, index) => {
        if (index < 5) console.log(`Creating checkbox for student: ${student}`);
        const checkbox = document.createElement('div');
        const isInTeam = studentsInTeamsSet.has(student);

        // Add class if student is already in a team
        checkbox.className = isInTeam
          ? 'student-checkbox student-in-team'
          : 'student-checkbox';

        // If student is in a team, remove from selected students set
        if (isInTeam && selectedStudents.has(student)) {
          selectedStudents.delete(student);
        }

        // Check if this student was previously selected and is not in a team
        const isSelected = !isInTeam && selectedStudents.has(student);

        // Create the checkbox HTML
        let checkboxHtml = `
          <input type="checkbox" id="student-${student}" name="student" value="${student}"${isInTeam ? ' disabled' : ''}${isSelected ? ' checked' : ''}>
          <label for="student-${student}">${student}</label>
        `;

        // Add team info if student is in a team
        if (isInTeam && teamInfo && teamInfo[student]) {
          checkboxHtml += `<span class="team-info">(in team ${teamInfo[student]})</span>`;
        }

        checkbox.innerHTML = checkboxHtml;
        container.appendChild(checkbox);

        // Add event listener to track checkbox changes
        const checkboxInput = checkbox.querySelector('input[type="checkbox"]');
        if (checkboxInput && !isInTeam) {
          checkboxInput.addEventListener('change', (e) => {
            if (e.target.checked) {
              this.studentData.selectedStudents.add(student);
            } else {
              this.studentData.selectedStudents.delete(student);
            }
          });
        }
      });
    },

    /**
     * Show the team registration UI and hide other UIs
     */
    showTeamRegistrationUI: function () {
      this.elements.teamRegistrationForm.classList.remove('hidden');
      this.elements.gameUI.classList.add('hidden');
    },

    /**
     * Show the game UI and hide other UIs
     */
    showGameUI: function () {
      this.elements.teamRegistrationForm.classList.add('hidden');
      this.elements.gameUI.classList.remove('hidden');
    },

    showInvestmentUI: function () {
      this.elements.roundResults.classList.add('hidden');
      this.elements.investmentUI.classList.remove('hidden');
    },

    showRoundResults: function () {
      this.elements.investmentUI.classList.add('hidden');
      this.elements.roundResults.classList.remove('hidden');
    },
    showGameOver: function () {
      this.elements.roundResults.classList.add('hidden');
      this.elements.gameOverUI.classList.remove('hidden');
    },

    /**
     * Reset the game UI for a new game
     * Hides game over UI and round results, resets values
     */
    resetGameUI: function () {
      const elements = this.elements;

      // Hide game over UI
      if (elements.gameOverUI) {
        elements.gameOverUI.classList.add('hidden');
      }

      // Hide round results
      if (elements.roundResults) {
        elements.roundResults.classList.add('hidden');
      }

      // Reset investment UI
      if (elements.investmentUI) {
        elements.investmentUI.classList.remove('hidden');
      }

      // Reset status messages
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START;
      }
      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START;
      }
    },
    updateFinalRankings: function (finalResults, currentPlayerName) {
      let rankingsHTML = '<ol>';
      finalResults.forEach((result) => {
        const isCurrentPlayer = result.playerName === currentPlayerName;
        rankingsHTML += `<li${isCurrentPlayer ? ' class="current-player"' : ''}>${result.playerName}: ${result.finalOutput}</li>`;
      });
      rankingsHTML += '</ol>';
      this.elements.finalRankings.innerHTML = rankingsHTML;
    },

    displayAdminNotification: function (message, type) {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.classList.add(
        'admin-notification',
        `admin-notification-${type || 'info'}`
      );
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
    },

    /**
     * Update student availability without changing the whole list
     * @param {Array} studentsInTeams - Array of student names already in teams
     * @param {number} unavailableCount - Number of students already in teams
     */
    updateStudentAvailability: function (studentsInTeams, unavailableCount) {
      console.log('Updating student availability:', {
        newlyUnavailableStudents: studentsInTeams,
        unavailableCount,
      });

      // Store the updated availability data
      this.studentData.studentsInTeams = studentsInTeams || [];
      this.studentData.unavailableCount = unavailableCount || 0;

      // Convert studentsInTeams array to a Set for faster lookups
      const studentsInTeamsSet = new Set(studentsInTeams);

      // Update UI for each student checkbox
      this.studentData.allStudents.forEach((student) => {
        const isInTeam = studentsInTeamsSet.has(student);
        const checkbox = document.getElementById(`student-${student}`);

        if (checkbox) {
          // If student is now in a team, disable their checkbox
          if (isInTeam) {
            const checkboxParent = checkbox.parentNode;
            checkbox.disabled = true;

            // Add the student-in-team class to the parent
            if (!checkboxParent.classList.contains('student-in-team')) {
              checkboxParent.classList.add('student-in-team');
            }

            // Remove from selected students if they were selected
            if (this.studentData.selectedStudents.has(student)) {
              this.studentData.selectedStudents.delete(student);
              checkbox.checked = false;
            }
          }
        }
      });

      // Update the info about unavailable students if any
      const container = this.elements.studentSelectionContainer;
      let infoDiv = container.querySelector('.student-info');

      if (!infoDiv && unavailableCount > 0) {
        // Create info div if it doesn't exist
        infoDiv = document.createElement('div');
        infoDiv.className = 'student-info';
        container.insertBefore(infoDiv, container.firstChild);
      }

      if (infoDiv && unavailableCount > 0) {
        infoDiv.innerHTML = `<p class="student-unavailable-info">${unavailableCount} student${unavailableCount > 1 ? 's' : ''} already in teams.</p>`;
      } else if (infoDiv) {
        infoDiv.remove();
      }
    },
  };

  // Expose the module to window
  window.StudentDom = StudentDom;
})(window);
