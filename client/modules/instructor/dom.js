// client/modules/instructor/dom.js
(function(window) {
  'use strict';
  
  // Define InstructorDom module
  const InstructorDom = {
    // DOM Elements
    elements: {
      gameStatus: document.getElementById('gameStatus'),
      playerCount: document.getElementById('playerCount'),
      gameControls: document.getElementById('gameControls'),
      playerListSection: document.getElementById('playerListSection'),
      playerList: document.getElementById('playerList'),
      roundNumber: document.getElementById('roundNumber'),
      totalRounds: document.getElementById('totalRounds'),
      roundStatus: document.getElementById('roundStatus'),
      currentInvestmentsSection: document.getElementById('currentInvestmentsSection'),
      currentInvestmentsBody: document.getElementById('currentInvestmentsBody'),
      roundResultsSection: document.getElementById('roundResultsSection'),
      roundResultsBody: document.getElementById('roundResultsBody'),
      gameOverSection: document.getElementById('gameOverSection'),
      winnerName: document.getElementById('winnerName'),
      finalResultsBody: document.getElementById('finalResultsBody'),
      resetGameButton: document.getElementById('resetGameButton'),
      roundTimer: document.getElementById('roundTimer'),
      forceEndGameButton: document.getElementById('forceEndGameButton'),
      startGameButton: document.getElementById('startGameButton'),
      manualStartToggle: document.getElementById('manualStartToggle'),
      manualStartStatus: document.getElementById('manualStartStatus'),
      gameSetup: document.getElementById('gameSetup')
    },
    
    // Methods
    initializeUI: function() {
      const elements = this.elements;
      
      elements.totalRounds.textContent = CONSTANTS.ROUNDS;
      
      // Debug DOM elements
      console.log('DOM Elements check:');
      console.log('currentInvestmentsSection found:', !!elements.currentInvestmentsSection);
      console.log('currentInvestmentsBody found:', !!elements.currentInvestmentsBody);
      
      // Style check
      console.log('currentInvestmentsSection classes:', elements.currentInvestmentsSection.className);
    },
    
    updatePlayerList: function(players, submittedPlayers, autoSubmittedPlayers) {
      console.log('Updating player list - players:', players);
      console.log('Submitted players:', submittedPlayers);
      console.log('Auto-submitted players:', autoSubmittedPlayers);
      
      const playerList = this.elements.playerList;
      
      // Clear existing player list
      playerList.innerHTML = '';
      
      // Add all players to the list
      players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.classList.add(CONSTANTS.CSS.PLAYER_ITEM);
        
        const isSubmitted = submittedPlayers.includes(player);
        const isAutoSubmitted = autoSubmittedPlayers.includes(player);
        
        // Add submitted class if the player has submitted their investment
        if (isSubmitted) {
          console.log(`Marking player ${player} as submitted`);
          playerElement.classList.add(CONSTANTS.CSS.PLAYER_SUBMITTED);
          
          // Add auto-submitted class if the player's investment was auto-submitted
          if (isAutoSubmitted) {
            console.log(`Marking player ${player} as auto-submitted`);
            playerElement.classList.add(CONSTANTS.CSS.PLAYER_AUTO_SUBMITTED);
            playerElement.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
          }
        }
        
        // Create a more informative player display
        playerElement.innerHTML = `
          <span class="${CONSTANTS.CSS.PLAYER_NAME}">${player}</span>
          ${isSubmitted ?
              `<span class="${CONSTANTS.CSS.PLAYER_STATUS}">${CONSTANTS.UI_TEXT.STATUS_PLAYER_SUBMITTED}</span>` :
              `<span class="${CONSTANTS.CSS.PLAYER_STATUS} ${CONSTANTS.CSS.PLAYER_STATUS_PENDING}">${CONSTANTS.UI_TEXT.STATUS_PLAYER_PENDING}</span>`}
        `;
        
        playerList.appendChild(playerElement);
      });
      
      // Force a re-paint - sometimes needed to make sure the UI updates
      playerList.style.opacity = CONSTANTS.REPAINT_HACK_OPACITY;
      setTimeout(() => {
        playerList.style.opacity = CONSTANTS.OPACITY_FULL;
      }, CONSTANTS.SHORT_UI_DELAY_MS);
    },
    
    updateCurrentInvestmentsTable: function(currentRoundInvestments) {
      console.log('Updating current investments table');
      
      const currentInvestmentsSection = this.elements.currentInvestmentsSection;
      const currentInvestmentsBody = this.elements.currentInvestmentsBody;
      
      // Ensure the section is visible
      currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      
      // Clear existing rows
      currentInvestmentsBody.innerHTML = '';
      
      // Check if we have any investments to display
      const investmentCount = Object.keys(currentRoundInvestments).length;
      console.log(`Have ${investmentCount} investments to display`);
      
      if (investmentCount === 0) {
        // Add a placeholder row
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="${CONSTANTS.INVESTMENTS_TABLE_COLUMN_COUNT}" class="${CONSTANTS.CSS.PLACEHOLDER_TEXT}">${CONSTANTS.UI_TEXT.PLACEHOLDER_INVESTMENT_SUBMITTED}</td>`;
        currentInvestmentsBody.appendChild(row);
        return;
      }
      
      // Add investments to the table
      Object.entries(currentRoundInvestments).forEach(([playerName, data]) => {
        const row = document.createElement('tr');
        
        // Add auto-submitted class if needed
        if (data.isAutoSubmit) {
          row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
          row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
        }
        
        // Format investment with consistent decimal precision
        const formattedInvestment = parseFloat(data.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);
        
        row.innerHTML = `
          <td>${playerName}</td>
          <td>${formattedInvestment}${data.isAutoSubmit ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX : ''}</td>
        `;
        currentInvestmentsBody.appendChild(row);
      });
      
      // Add visual highlight to show the table updated
      currentInvestmentsSection.style.animation = 'none';
      setTimeout(() => {
        currentInvestmentsSection.style.animation = `flashUpdate ${CONSTANTS.CSS_ANIMATION_DURATION_SECONDS}s`;
      }, CONSTANTS.SHORT_UI_DELAY_MS);
    },
    
    displayStatusMessage: function(message, duration = CONSTANTS.STATUS_MESSAGE_DISPLAY_MS) {
      const statusElement = document.createElement('div');
      statusElement.textContent = message;
      statusElement.classList.add(CONSTANTS.CSS.STATUS_MESSAGE);
      document.body.appendChild(statusElement);
      
      // Remove the message after a specified time
      setTimeout(() => {
        statusElement.remove();
      }, duration);
    }
  };
  
  // Expose the module to window
  window.InstructorDom = InstructorDom;
})(window); 