// /modules/screen/main.js

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize values from constants
  if (CONSTANTS && CONSTANTS.ROUNDS) {
    window.screenDOM.elements.totalRounds.textContent = CONSTANTS.ROUNDS;
  }

  // Initialize socket connection
  window.screenSocket.init();

  // Initialize game status text
  window.screenDOM.elements.gameStatus.textContent =
    CONSTANTS.UI_TEXT.STATUS_WAITING_FOR_GAME;

  // Add initial event when page loads
  window.screenDOM.addEvent('init', 'Screen dashboard initialized', true);
});
