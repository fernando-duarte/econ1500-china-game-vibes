/**
 * Student Result Handlers
 * Manages game results and end-game events for student interface
 */
(function (window) {
  'use strict';

  /**
   * Result handlers for student client
   * @namespace
   */
  const ResultHandlers = {
    /**
     * Handle game over event
     * @param {Object} data - Game over data
     */
    handleGameOver: function (data) {
      SocketUtils.logEvent('Game over', data);
      const elements = StudentDom.elements;

      // Find this player's result
      const playerResult = data.finalResults.find(
        (r) => r.playerName === StudentGame.state.currentPlayerName
      );

      // Update UI with player's results
      this.updateGameOverResults(elements, playerResult);

      // Update winner
      SocketUtils.updateElementText(elements.winner, data.winner);

      // Generate rankings
      StudentDom.updateFinalRankings(
        data.finalResults,
        StudentGame.state.currentPlayerName
      );

      // Hide round content and show game over UI
      StudentDom.showGameOver();

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_GAME_OVER
      );

      // Update duplicate round status if it exists
      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
      }

      // Disable all investment controls
      StudentGame.disableInvestmentControls(
        CONSTANTS.UI_TEXT.STATUS_GAME_OVER_NO_INVESTMENTS
      );
    },

    /**
     * Update UI with game over results
     * @param {Object} elements - DOM elements
     * @param {Object} playerResult - Player's final result data
     */
    updateGameOverResults: function (elements, playerResult) {
      if (!playerResult) return;

      // Update final output display
      SocketUtils.updateElementText(
        elements.finalOutput,
        playerResult.finalOutput
      );

      // Update main capital/output display
      if (playerResult.finalCapital || playerResult.capital) {
        const finalCapital = playerResult.finalCapital || playerResult.capital;
        SocketUtils.updateElementText(elements.capital, finalCapital);
        StudentGame.state.lastCapital = finalCapital;
      }

      if (playerResult.finalOutput) {
        SocketUtils.updateElementText(
          elements.output,
          playerResult.finalOutput
        );
        StudentGame.state.lastOutput = playerResult.finalOutput;
      }
    },
  };

  // Export the handlers to the global scope
  window.ResultHandlers = ResultHandlers;
})(window);
