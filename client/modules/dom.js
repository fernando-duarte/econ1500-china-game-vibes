// client/modules/dom.js
(function(window) {
  'use strict';
  
  // Define StudentDom module
  const StudentDom = {
    // DOM Elements
    elements: {
      // Join form elements
      joinForm: document.getElementById('joinForm'),
      playerName: document.getElementById('playerName'),
      joinButton: document.getElementById('joinButton'),
      joinError: document.getElementById('joinError'),
      
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
      finalRankings: document.getElementById('finalRankings')
    },
    
    // Methods
    initializeUI: function() {
      const elements = this.elements;
      
      elements.totalRounds.textContent = CONSTANTS.ROUNDS;
      elements.investmentSlider.step = CONSTANTS.INVESTMENT_STEP;
      elements.investmentValue.step = CONSTANTS.INVESTMENT_STEP;
      elements.timer.textContent = CONSTANTS.ROUND_DURATION_SECONDS;
      
      // Input constraints from constants
      elements.investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
      elements.investmentValue.min = CONSTANTS.INVESTMENT_MIN;

      // Initialize placeholder values
      elements.capital.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.output.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.roundNumber.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.maxOutput.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.investmentResult.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.newCapital.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.newOutput.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.finalOutput.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;
      elements.winner.textContent = CONSTANTS.UI_TEXT.PLACEHOLDER_TEXT;

      // Initialize status messages
      elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME_START;
      elements.waitingNextRound.textContent = CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_NEXT_ROUND;

      // Initialize input placeholders
      elements.playerName.placeholder = CONSTANTS.UI_TEXT.PLAYER_NAME_PLACEHOLDER;
    },
    
    showGameUI: function() {
      this.elements.joinForm.classList.add('hidden');
      this.elements.gameUI.classList.remove('hidden');
    },
    
    showInvestmentUI: function() {
      this.elements.roundResults.classList.add('hidden');
      this.elements.investmentUI.classList.remove('hidden');
    },
    
    showRoundResults: function() {
      this.elements.investmentUI.classList.add('hidden');
      this.elements.roundResults.classList.remove('hidden');
    },
    
    showGameOver: function() {
      this.elements.roundResults.classList.add('hidden');
      this.elements.gameOverUI.classList.remove('hidden');
    },
    
    updateFinalRankings: function(finalResults, currentPlayerName) {
      let rankingsHTML = '<ol>';
      finalResults.forEach(result => {
        const isCurrentPlayer = result.playerName === currentPlayerName;
        rankingsHTML += `<li${isCurrentPlayer ? ' class="current-player"' : ''}>${result.playerName}: ${result.finalOutput}</li>`;
      });
      rankingsHTML += '</ol>';
      this.elements.finalRankings.innerHTML = rankingsHTML;
    },
    
    displayAdminNotification: function(message, type) {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.classList.add('admin-notification', `admin-notification-${type || 'info'}`);
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, CONSTANTS.NOTIFICATION_DISPLAY_MS);
    }
  };
  
  // Expose the module to window
  window.StudentDom = StudentDom;
})(window); 