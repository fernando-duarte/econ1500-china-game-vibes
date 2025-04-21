// client/modules/instructor/main.js
(function(window) {
  'use strict';
  
  // Define InstructorMain module
  const InstructorMain = {
    // Methods
    initializeDOMEventHandlers: function() {
      const elements = InstructorDom.elements;
      
      // Reset game button click event
      elements.resetGameButton.addEventListener('click', () => {
        // Show the game setup section again before reloading
        elements.gameSetup.classList.remove(CONSTANTS.CSS.HIDDEN);
        
        location.reload();
      });
      
      // Force end game button click event
      elements.forceEndGameButton.addEventListener('click', () => {
        if (confirm(CONSTANTS.UI_TEXT.CONFIRM_FORCE_END)) {
          InstructorSocket.forceEndGame();
          console.log('Force end game request sent');
        }
      });
      
      // Manual start toggle change event
      elements.manualStartToggle.addEventListener('change', () => {
        const enabled = elements.manualStartToggle.checked;
        InstructorSocket.setManualStart(enabled);
        
        // Update UI immediately for responsiveness
        elements.manualStartStatus.textContent = enabled ? CONSTANTS.UI_TEXT.STATUS_ENABLED : CONSTANTS.UI_TEXT.STATUS_DISABLED;
        elements.startGameButton.disabled = !enabled;
      });
      
      // Start game button click event
      elements.startGameButton.addEventListener('click', () => {
        if (InstructorGame.state.players.length === 0) {
          alert(CONSTANTS.UI_TEXT.ALERT_NO_PLAYERS);
          return;
        }
        
        if (confirm(`${CONSTANTS.UI_TEXT.CONFIRM_START_GAME_PREFIX}${InstructorGame.state.players.length}${CONSTANTS.UI_TEXT.CONFIRM_START_GAME_SUFFIX}`)) {
          InstructorSocket.startGame();
          console.log('Start game request sent');
          elements.startGameButton.disabled = true;
        }
      });
    },
    
    init: function() {
      // Initialize UI
      InstructorDom.initializeUI();
      
      // Initialize socket event handlers
      InstructorSocket.initializeSocketEvents();
      
      // Initialize DOM event handlers
      this.initializeDOMEventHandlers();
      
      console.log('Instructor app initialized');
    }
  };
  
  // Expose the module to window
  window.InstructorMain = InstructorMain;
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    InstructorMain.init();
  });
})(window); 