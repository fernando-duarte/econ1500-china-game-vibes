// client/modules/instructor/socket.js
(function(window) {
  'use strict';
  
  // Define InstructorSocket module
  const InstructorSocket = {
    // Socket instance
    socket: io(),
    
    // Methods
    initializeSocketEvents: function() {
      const socket = this.socket;
      
      // Debug socket connection
      socket.on(CONSTANTS.SOCKET.EVENT_CONNECT, () => {
        console.log('Instructor connected to server with socket ID:', socket.id);
      });
      
      // Game created event
      socket.on(CONSTANTS.SOCKET.EVENT_GAME_CREATED, (data) => {
        console.log('Game created event received by instructor client', data);
        
        // Update manual start controls if info is provided
        if (data && data.manualStartEnabled !== undefined) {
          const elements = InstructorDom.elements;
          elements.manualStartToggle.checked = data.manualStartEnabled;
          elements.manualStartStatus.textContent = data.manualStartEnabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
          elements.startGameButton.disabled = !data.manualStartEnabled;
        }
      });
      
      // Player joined event
      socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_JOINED, (data) => {
        console.log('Player joined event received:', data);
        
        // Add player to game state
        const playerAdded = InstructorGame.addPlayer(data.playerName);
        
        // Update player list UI
        InstructorDom.updatePlayerList(
          InstructorGame.state.players,
          InstructorGame.state.submittedPlayers,
          InstructorGame.state.autoSubmittedPlayers
        );
        
        // Update player count
        const countText = `${InstructorGame.state.players.length} player${InstructorGame.state.players.length !== 1 ? CONSTANTS.UI_TEXT.PLAYER_PLURAL_SUFFIX : ''}${CONSTANTS.UI_TEXT.PLAYER_JOINED_SUFFIX}`;
        console.log(`Updating player count to: ${countText}`);
        InstructorDom.elements.playerCount.textContent = countText;
        
        // Show notification for reconnection
        if (data.isReconnect) {
          InstructorDom.displayStatusMessage(`${data.playerName} reconnected to the game`);
        }
        
        // If data includes manual start info, update the controls
        if (data.manualStartEnabled !== undefined) {
          const elements = InstructorDom.elements;
          elements.manualStartToggle.checked = data.manualStartEnabled;
          elements.manualStartStatus.textContent = data.manualStartEnabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
          elements.startGameButton.disabled = !data.manualStartEnabled;
        }
      });
      
      // Game started event
      socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
        console.log('Game started');
        const elements = InstructorDom.elements;
        
        // Hide game setup section (auto-start toggle and start game button)
        elements.gameSetup.classList.add(CONSTANTS.CSS.HIDDEN);
        
        // Show game controls and player list
        elements.gameControls.classList.remove(CONSTANTS.CSS.HIDDEN);
        elements.playerListSection.classList.remove(CONSTANTS.CSS.HIDDEN);
        
        // Make sure current investments section is visible
        elements.currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
        console.log('Made current investments section visible');
        console.log('Current investments section classes:', elements.currentInvestmentsSection.className);
        
        // Display first round immediately when game starts
        elements.roundNumber.textContent = CONSTANTS.FIRST_ROUND_NUMBER;
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      });
      
      // Round start event
      socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
        console.log('Round started:', data);
        const elements = InstructorDom.elements;
        
        // Update round number
        elements.roundNumber.textContent = data.roundNumber;
        
        // Update round status - change from "Game starting..." to "Round in progress" for any round ≥ 1
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
        
        // Initialize timer with server time
        if (elements.roundTimer) {
          elements.roundTimer.textContent = data.timeRemaining;
        }
        
        // Reset submitted players list
        InstructorGame.resetRoundState();
        
        // Update UI
        InstructorDom.updatePlayerList(
          InstructorGame.state.players,
          InstructorGame.state.submittedPlayers,
          InstructorGame.state.autoSubmittedPlayers
        );
        InstructorDom.updateCurrentInvestmentsTable(InstructorGame.state.currentRoundInvestments);
        
        // Show round results section if it's not the first round
        if (data.roundNumber > CONSTANTS.FIRST_ROUND_NUMBER) {
          elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
        }
        
        // Show current investments section
        elements.currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      });
      
      // Investment received event
      socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
        console.log('Investment received event on instructor client:', data);
        
        // Make sure we have the data we need
        if (!data || !data.playerName) {
          console.error('Invalid investment_received data:', data);
          return;
        }
        
        // Debugging
        console.log('Before update - currentRoundInvestments:', JSON.stringify(InstructorGame.state.currentRoundInvestments));
        console.log('Current investments section visibility:', !InstructorDom.elements.currentInvestmentsSection.classList.contains(CONSTANTS.CSS.HIDDEN));
        
        // Record investment in game state
        InstructorGame.recordInvestment(data.playerName, data.investment, data.isAutoSubmit);
        
        // Ensure investments section is visible
        if (InstructorDom.elements.currentInvestmentsSection.classList.contains(CONSTANTS.CSS.HIDDEN)) {
          console.log('Current investments section was hidden, making visible');
          InstructorDom.elements.currentInvestmentsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
        }
        
        // Call function to update the table with a slight delay to ensure DOM updates
        setTimeout(() => {
          console.log('Calling updateCurrentInvestmentsTable after delay');
          InstructorDom.updateCurrentInvestmentsTable(InstructorGame.state.currentRoundInvestments);
        }, CONSTANTS.MEDIUM_UI_DELAY_MS);
        
        // Force UI update
        InstructorDom.updatePlayerList(
          InstructorGame.state.players,
          InstructorGame.state.submittedPlayers,
          InstructorGame.state.autoSubmittedPlayers
        );
        
        // Format investment with consistent decimal precision
        const formattedInvestment = parseFloat(data.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);
        
        // Display status message
        InstructorDom.displayStatusMessage(`${data.playerName} submitted their investment: ${formattedInvestment}`);
        
        // Check for all submitted
        if (InstructorGame.areAllPlayersSubmitted()) {
          console.log('All players have submitted - round should end soon');
          
          // If we're in round 0 and all players submitted, update the UI to "Round 1" proactively
          if (InstructorDom.elements.roundNumber.textContent === String(CONSTANTS.FIRST_ROUND_NUMBER - 1)) {
            InstructorDom.elements.roundNumber.textContent = String(CONSTANTS.FIRST_ROUND_NUMBER);
            InstructorDom.elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
          }
        }
      });
      
      // All submitted event
      socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
        console.log('All students have submitted, round ending early:', data);
        const elements = InstructorDom.elements;
        
        // Update round status
        const oldText = elements.roundStatus.textContent;
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
        elements.roundStatus.classList.add(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);
        
        // Restore previous status after the early end
        setTimeout(() => {
          elements.roundStatus.classList.remove(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);
        }, data.timeRemaining * CONSTANTS.MILLISECONDS_PER_SECOND);
      });
      
      // Round summary event
      socket.on(CONSTANTS.SOCKET.EVENT_ROUND_SUMMARY, (data) => {
        console.log('Round summary:', data);
        const elements = InstructorDom.elements;
        
        // Update numeric round display
        elements.roundNumber.textContent = data.roundNumber;
        
        // Update round status
        elements.roundStatus.textContent = `${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_PREFIX}${data.roundNumber}${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_SUFFIX}`;
        
        // Clear existing rows
        elements.roundResultsBody.innerHTML = '';
        
        // Add results to the table
        data.results.forEach(result => {
          const row = document.createElement('tr');
          
          // Add auto-submitted class if needed
          if (result.isAutoSubmit) {
            row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
            row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
          }
          
          // Format investment with consistent decimal precision
          const formattedInvestment = parseFloat(result.investment).toFixed(CONSTANTS.DECIMAL_PRECISION);
          
          row.innerHTML = `
            <td>${result.playerName}</td>
            <td>${formattedInvestment}${result.isAutoSubmit ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX : ''}</td>
            <td>${result.newCapital}</td>
            <td>${result.newOutput}</td>
          `;
          elements.roundResultsBody.appendChild(row);
        });
        
        // Show round results section
        elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      });
      
      // Game over event
      socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
        console.log('Game over:', data);
        const elements = InstructorDom.elements;
        
        // Update winner
        elements.winnerName.textContent = data.winner;
        
        // Clear existing rows
        elements.finalResultsBody.innerHTML = '';
        
        // Add final results to the table
        data.finalResults.forEach((result, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + CONSTANTS.DISPLAY_INDEX_OFFSET}</td>
            <td>${result.playerName}</td>
            <td>${result.finalOutput}</td>
          `;
          elements.finalResultsBody.appendChild(row);
        });
        
        // Show game over section
        elements.gameOverSection.classList.remove(CONSTANTS.CSS.HIDDEN);
        
        // Update round status
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
      });
      
      // Error event
      socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
        console.error('Socket error:', data.message);
        alert(CONSTANTS.UI_TEXT.ERROR_PREFIX + data.message);
      });
      
      // Manual start mode event
      socket.on(CONSTANTS.SOCKET.EVENT_MANUAL_START_MODE, (data) => {
        console.log('Manual start mode update:', data);
        const elements = InstructorDom.elements;
        
        elements.manualStartToggle.checked = data.enabled;
        elements.manualStartStatus.textContent = data.enabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
        elements.startGameButton.disabled = !data.enabled;
      });
      
      // Admin notification event
      socket.on(CONSTANTS.SOCKET.EVENT_ADMIN_NOTIFICATION, (data) => {
        console.log('Admin notification:', data);
        
        // Display notification to user
        const notification = document.createElement('div');
        notification.textContent = data.message;
        notification.classList.add(CONSTANTS.CSS.ADMIN_NOTIFICATION, `${CONSTANTS.CSS.ADMIN_NOTIFICATION_PREFIX}${data.type || CONSTANTS.NOTIFICATION.DEFAULT_TYPE}`);
        document.body.appendChild(notification);
        
        // Remove notification after specified time
        setTimeout(() => {
          notification.remove();
        }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
      });
      
      // Player disconnected event
      socket.on(CONSTANTS.SOCKET.EVENT_PLAYER_DISCONNECTED, (data) => {
        console.log('Player disconnected:', data.playerName);
        
        // Show temporary notification
        InstructorDom.displayStatusMessage(`${data.playerName} disconnected from the game`);
      });
      
      // Timer update event
      socket.on(CONSTANTS.SOCKET.EVENT_TIMER_UPDATE, (data) => {
        // Update timer display if element exists
        const roundTimer = InstructorDom.elements.roundTimer;
        if (roundTimer) {
          roundTimer.textContent = data.timeRemaining;
        }
      });
    },
    
    setManualStart: function(enabled) {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, { enabled });
    },
    
    startGame: function() {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_START_GAME);
    },
    
    forceEndGame: function() {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME);
    }
  };
  
  // Expose the module to window
  window.InstructorSocket = InstructorSocket;
})(window); 