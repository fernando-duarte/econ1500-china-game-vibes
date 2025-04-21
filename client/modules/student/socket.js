// client/modules/socket.js
(function(window) {
  'use strict';
  
  // Define StudentSocket module
  const StudentSocket = {
    // Socket instance
    socket: io(),
    
    // Methods
    initializeSocketEvents: function() {
      // Game joined handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_GAME_JOINED, (data) => {
        const elements = StudentDom.elements;
        
        // Store player name from server data
        StudentGame.state.currentPlayerName = data.playerName;

        // Update UI with player name
        elements.displayName.textContent = StudentGame.state.currentPlayerName;

        // Set initial capital and output
        if (data.initialCapital !== undefined) {
          elements.capital.textContent = data.initialCapital;
          StudentGame.state.lastCapital = data.initialCapital;
        }

        if (data.initialOutput !== undefined) {
          elements.output.textContent = data.initialOutput;
          StudentGame.state.currentOutput = data.initialOutput;
          StudentGame.state.lastOutput = data.initialOutput;
        }

        console.log(`Successfully joined game as ${StudentGame.state.currentPlayerName}`);

        // Hide join form and show game interface
        StudentDom.showGameUI();
      });

      // Game started handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_GAME_STARTED, () => {
        const elements = StudentDom.elements;
        
        console.log('Game has started event received');
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_STARTED;

        // Ensure K and Y are still displayed
        if (elements.capital.textContent === '-' && StudentGame.state.lastCapital) {
          elements.capital.textContent = StudentGame.state.lastCapital;
        }
        if (elements.output.textContent === '-' && StudentGame.state.lastOutput) {
          elements.output.textContent = StudentGame.state.lastOutput;
        }
      });

      // Round start handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_ROUND_START, (data) => {
        const elements = StudentDom.elements;
        
        console.log('Round started:', data);

        // Update round number and capital/output
        elements.roundNumber.textContent = data.roundNumber;

        // Make sure we update capital and output values clearly
        if (data.capital !== undefined) {
          elements.capital.textContent = data.capital;
          StudentGame.state.lastCapital = data.capital;
        }

        if (data.output !== undefined) {
          elements.output.textContent = data.output;
          StudentGame.state.currentOutput = data.output;
          StudentGame.state.lastOutput = data.output;
        }

        // Update round status
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;

        // Reset investment UI
        elements.investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
        elements.investmentSlider.max = data.output;
        elements.investmentSlider.value = CONSTANTS.INVESTMENT_MIN;
        elements.investmentValue.value = CONSTANTS.INVESTMENT_MIN;
        elements.maxOutput.textContent = data.output;
        StudentGame.resetInvestmentState();

        // Hide round results and show investment UI
        StudentDom.showInvestmentUI();

        // Initialize timer with the server's time
        elements.timer.textContent = data.timeRemaining;
      });

      // Investment received handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_INVESTMENT_RECEIVED, (data) => {
        // Update UI to show investment was received
        StudentDom.elements.investmentResult.textContent = data.investment;
      });

      // All submitted handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_ALL_SUBMITTED, (data) => {
        const elements = StudentDom.elements;
        
        console.log('All students have submitted:', data);

        // Show message that round is ending early
        elements.investmentStatus.innerHTML = `<span class="all-submitted-message">${data.message}</span>`;

        // Disable controls if not already submitted
        if (!StudentGame.state.hasSubmittedInvestment) {
          StudentGame.disableInvestmentControls();
        }

        // Adjust timer display
        elements.timer.classList.add('timer-ending');
        elements.timer.textContent = CONSTANTS.UI_TEXT.STATUS_ENDING;

        // Stop the current timer
        StudentGame.stopTimer();
      });

      // Round end handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_ROUND_END, (data) => {
        const elements = StudentDom.elements;
        
        console.log('Round ended:', data);

        // Stop the timer
        StudentGame.stopTimer();

        // Update capital and output with new values
        if (data.newCapital !== undefined) {
          elements.capital.textContent = data.newCapital;
          StudentGame.state.lastCapital = data.newCapital;
        }

        if (data.newOutput !== undefined) {
          elements.output.textContent = data.newOutput;
          StudentGame.state.currentOutput = data.newOutput;
          StudentGame.state.lastOutput = data.newOutput;
        }

        // Also update the results section
        elements.newCapital.textContent = data.newCapital;
        elements.newOutput.textContent = data.newOutput;

        // Hide investment UI and show round results
        StudentDom.showRoundResults();

        // Update round status
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED;
      });

      // Game over handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_GAME_OVER, (data) => {
        const elements = StudentDom.elements;
        
        console.log('Game over:', data);

        // Update final output
        const playerResult = data.finalResults.find(r => r.playerName === StudentGame.state.currentPlayerName);
        if (playerResult) {
          elements.finalOutput.textContent = playerResult.finalOutput;

          // Also update the main capital/output display
          if (playerResult.finalCapital || playerResult.capital) {
            elements.capital.textContent = playerResult.finalCapital || playerResult.capital;
            StudentGame.state.lastCapital = playerResult.finalCapital || playerResult.capital;
          }

          if (playerResult.finalOutput) {
            elements.output.textContent = playerResult.finalOutput;
            StudentGame.state.lastOutput = playerResult.finalOutput;
          }
        }

        // Update winner
        elements.winner.textContent = data.winner;

        // Generate rankings
        StudentDom.updateFinalRankings(data.finalResults, StudentGame.state.currentPlayerName);

        // Hide round content and show game over UI
        StudentDom.showGameOver();

        // Update round status
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;

        // Disable all investment controls
        StudentGame.disableInvestmentControls(CONSTANTS.UI_TEXT.STATUS_GAME_OVER_NO_INVESTMENTS);
      });

      // State snapshot handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_STATE_SNAPSHOT, (data) => {
        const elements = StudentDom.elements;
        
        console.log('Received state snapshot:', data);

        // Update round number and capital/output
        elements.roundNumber.textContent = data.roundNumber;

        if (data.capital !== undefined) {
          elements.capital.textContent = data.capital;
          StudentGame.state.lastCapital = data.capital;
        }

        if (data.output !== undefined) {
          elements.output.textContent = data.output;
          StudentGame.state.currentOutput = data.output;
          StudentGame.state.lastOutput = data.output;
        }

        // If the player has already submitted their investment
        if (data.submitted) {
          elements.investmentStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ALREADY_SUBMITTED;
          StudentGame.disableInvestmentControls();
        }

        // Show the appropriate UI
        StudentDom.showInvestmentUI();

        // Initialize timer display from state
        if (data.timeRemaining) {
          elements.timer.textContent = data.timeRemaining;
        }
      });

      // Timer update handler
      this.socket.on('timer_update', (data) => {
        const elements = StudentDom.elements;
        
        // Update timer display with server time
        elements.timer.textContent = data.timeRemaining;

        // Auto-submit if time is below threshold and no submission yet
        if (data.timeRemaining <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS && !StudentGame.state.hasSubmittedInvestment) {
          const currentInvestment = parseFloat(elements.investmentSlider.value);
          this.socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, { investment: currentInvestment, isAutoSubmit: true });
          StudentGame.disableInvestmentControls(CONSTANTS.UI_TEXT.STATUS_TIME_EXPIRED);
        }
      });

      // Error handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_ERROR, (data) => {
        const elements = StudentDom.elements;
        
        elements.joinError.textContent = data.message;
        elements.joinButton.disabled = false;
      });

      // Admin notification handler
      this.socket.on('admin_notification', (data) => {
        console.log('Admin notification:', data);
        StudentDom.displayAdminNotification(data.message, data.type || 'info');
      });

      // Disconnect handler
      this.socket.on(CONSTANTS.SOCKET.EVENT_DISCONNECT, () => {
        console.log('Disconnected from server');
        StudentGame.stopTimer();
      });
    },
    
    joinGame: function(playerName) {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_JOIN_GAME, { playerName });
    },
    
    submitInvestment: function(investment, isAutoSubmit = false) {
      this.socket.emit(CONSTANTS.SOCKET.EVENT_SUBMIT_INVESTMENT, { investment, isAutoSubmit });
    }
  };
  
  // Expose the module to window
  window.StudentSocket = StudentSocket;
})(window); 