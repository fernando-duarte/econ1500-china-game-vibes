// client/modules/dom.js
(function (window) {
  'use strict';

  // Define StudentDom module
  const StudentDom = {
    // DOM Elements - will be properly initialized in initElements method
    elements: null,

    /**
     * Initialize all DOM element references
     * This ensures we have the most up-to-date references
     */
    initElements: function () {
      console.log('StudentDom: Initializing DOM elements');

      this.elements = {
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
      };

      // Log the critical elements
      console.log('Critical DOM elements after initialization:', {
        studentSelectionContainer: !!this.elements.studentSelectionContainer,
        teamRegistrationForm: !!this.elements.teamRegistrationForm,
        studentSearch: !!this.elements.studentSearch,
      });

      // Fix any missing critical elements
      if (!this.elements.studentSelectionContainer) {
        console.error(
          'ERROR: studentSelectionContainer element not found during initialization'
        );
        this.elements.studentSelectionContainer = document.getElementById(
          'studentSelectionContainer'
        );
        console.log(
          'Re-attempted to find studentSelectionContainer:',
          !!this.elements.studentSelectionContainer
        );

        // If still not found, try to delay the initialization
        if (!this.elements.studentSelectionContainer) {
          console.log(
            'Scheduling another attempt to find studentSelectionContainer'
          );
          setTimeout(() => {
            console.log('Re-initializing DOM elements after delay');
            this.initElements();
          }, 500);
        }
      }
    },

    /**
     * Initialize the UI elements
     */
    initializeUI: function () {
      // Ensure elements are properly initialized first
      if (!this.elements) {
        this.initElements();
      }

      // Re-check studentSelectionContainer specifically
      if (!this.elements.studentSelectionContainer) {
        console.error(
          'studentSelectionContainer is still missing after initialization'
        );
        this.elements.studentSelectionContainer = document.getElementById(
          'studentSelectionContainer'
        );
        if (!this.elements.studentSelectionContainer) {
          console.error(
            'CRITICAL ERROR: Cannot initialize UI without studentSelectionContainer'
          );
          return;
        }
      }

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
      if (elements.teamName) {
        elements.teamName.placeholder = CONSTANTS.UI_TEXT.TEAM_NAME_PLACEHOLDER;
      }

      if (elements.studentSelectionContainer) {
        elements.studentSelectionContainer.innerHTML =
          CONSTANTS.UI_TEXT.LOADING_STUDENT_LIST;
      } else {
        console.error(
          'CRITICAL: studentSelectionContainer is null during initialization'
        );
      }

      // Prevent cross-client team name updates by isolating the team name input
      // This prevents the value from being synchronized across clients
      if (elements.teamName) {
        const teamNameInput = elements.teamName;
        teamNameInput.setAttribute('autocomplete', 'off');
        teamNameInput.setAttribute('data-private', 'true');
      }
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
     * Generate a safe DOM id for a student (no spaces / duplicate safety)
     * @param {string} name Student full name
     */
    generateStudentId: function (name) {
      return `student-${name.replace(/\s+/g, '_')}`;
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

      // Directly check if the dom element exists before proceeding
      const container = this.elements.studentSelectionContainer;
      if (!container) {
        console.error(
          'ERROR: studentSelectionContainer element not found in populateStudentList!'
        );

        // Try to find it directly as fallback
        const containerFallback = document.getElementById(
          'studentSelectionContainer'
        );
        if (containerFallback) {
          console.log(
            'Found container with direct DOM query, updating elements reference'
          );
          this.elements.studentSelectionContainer = containerFallback;
        } else {
          console.error(
            'CRITICAL: studentSelectionContainer not found even with direct DOM query!'
          );
          return;
        }
      }

      // Initialize search functionality if not already done
      this.initializeStudentSearch();

      // Render the student list with the current filter
      this.renderStudentList();

      // Diagnostic function to directly check student list DOM
      this.diagnoseStudentList('populateStudentList');

      // Force another render after a delay as a backup
      setTimeout(() => {
        console.log('Forcing re-render of student list after delay');
        this.renderStudentList();
      }, 300);
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
      console.log(
        'renderStudentList: Found studentSelectionContainer element:',
        container
      );

      // First, ensure the container exists
      if (!container) {
        console.error(
          'renderStudentList: studentSelectionContainer element not found!'
        );

        // Try direct DOM query as fallback
        const containerFallback = document.getElementById(
          'studentSelectionContainer'
        );
        if (containerFallback) {
          console.log(
            'Found container with direct DOM query in renderStudentList'
          );
          this.elements.studentSelectionContainer = containerFallback;
          // Update our reference and continue
          return this.renderStudentList(searchQuery);
        }
        return;
      }

      // Ensure we have student data to display
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

      console.log(
        'renderStudentList: Rendering with allStudents:',
        allStudents
      );

      // Clear existing content
      container.innerHTML = '';

      // If no student data, show a message
      if (!allStudents || allStudents.length === 0) {
        console.log('No students available to render');
        container.innerHTML =
          '<p>No students available. Please refresh the page.</p>';
        return;
      }

      // Add info about unavailable students if any
      if (unavailableCount > 0) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'student-info';
        infoDiv.innerHTML = `<p class="student-unavailable-info">${unavailableCount} student${
          unavailableCount > 1 ? 's' : ''
        } already in teams.</p>`;
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

      // Create a wrapper for better styling and handling
      const listWrapper = document.createElement('div');
      listWrapper.className = 'student-list-wrapper';

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
        const checkboxId = this.generateStudentId(student);

        let checkboxHtml = `
          <input type="checkbox" id="${checkboxId}" name="student" value="${student}"${
            isInTeam ? ' disabled' : ''
          }${isSelected ? ' checked' : ''}>
          <label for="${checkboxId}">${student}</label>
        `;

        // Add team info if student is in a team
        if (isInTeam && teamInfo && teamInfo[student]) {
          checkboxHtml += `<span class="team-info">(in team ${teamInfo[student]})</span>`;
        }

        checkbox.innerHTML = checkboxHtml;
        listWrapper.appendChild(checkbox);

        // Only set up event listeners for students not in teams
        if (!isInTeam) {
          const input = checkbox.querySelector('input[type="checkbox"]');
          if (input) {
            input.addEventListener('change', (e) => {
              if (e.target.checked) {
                selectedStudents.add(student);
              } else {
                selectedStudents.delete(student);
              }
            });
          }
        }
      });

      // Add the wrapper to the container
      container.appendChild(listWrapper);

      // Log a diagnostic message about what was added
      console.log(
        `Added ${filteredStudents.length} student checkboxes to the container`
      );

      // Diagnostic call to verify the DOM was updated
      this.diagnoseStudentList('renderStudentList');
    },

    /**
     * Diagnostic function to directly check student list DOM
     * @param {string} caller - Name of function calling this diagnostic
     */
    diagnoseStudentList: function (caller = 'unknown') {
      const container = this.elements.studentSelectionContainer;
      console.log(`DIAGNOSIS (called from ${caller}):`);

      if (!container) {
        console.error('DIAGNOSIS: studentSelectionContainer element is NULL');
        return;
      }

      console.log(
        `DIAGNOSIS: Container HTML: "${container.innerHTML.substring(0, 100)}..."`
      );
      console.log(`DIAGNOSIS: Student data:`, {
        studentsLoaded: this.studentData.allStudents.length,
        selectedCount: this.studentData.selectedStudents.size,
      });

      // Try to force a repaint
      if (
        this.studentData.allStudents.length > 0 &&
        container.innerHTML.includes('Loading')
      ) {
        console.log('DIAGNOSIS: Forcing rerender of student list');
        this.renderStudentList();
      }
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
        const checkbox = document.getElementById(
          this.generateStudentId(student)
        );

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
