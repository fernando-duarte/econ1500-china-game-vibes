/**
 * Instructor Result Handlers
 * Manages game result events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Result handlers for instructor client
   * @namespace
   */
  const ResultHandlers = {
    /**
     * Handle game over event
     * @param {Object} data - Game over data with results
     */
    handleGameOver: function (data) {
      SocketUtils.logEvent('Game over', data);
      const elements = InstructorDom.elements;

      // Update game status
      if (elements.roundStatus) {
        elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_GAME_OVER;
      }

      // Build final rankings
      if (elements.finalRankings && data.results) {
        elements.finalRankings.innerHTML = this.createFinalRankingsHTML(
          data.results
        );
      }

      // Show winner announcement if available
      if (elements.winner && data.winner) {
        elements.winner.textContent = data.winner;
      }

      // Show game over UI
      if (elements.gameOverSection) {
        elements.gameOverSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      // Hide current investments section
      if (elements.currentInvestmentsSection) {
        elements.currentInvestmentsSection.classList.add(CONSTANTS.CSS.HIDDEN);
      }
    },

    /**
     * Create HTML for final rankings table
     * @param {Array} results - Final results data
     * @returns {string} HTML for rankings
     */
    createFinalRankingsHTML: function (results) {
      if (!Array.isArray(results) || results.length === 0) {
        return '<p>No results available</p>';
      }

      let html =
        '<table class="rankings-table"><thead><tr><th>Rank</th><th>Player</th><th>Final Output</th></tr></thead><tbody>';

      results.forEach((result, index) => {
        const formattedOutput = SocketUtils.formatNumber(
          result.finalOutput,
          CONSTANTS.DECIMAL_PRECISION
        );

        html += `<tr>
          <td>${index + 1}</td>
          <td>${result.playerName}</td>
          <td>${formattedOutput}</td>
        </tr>`;
      });

      html += '</tbody></table>';
      return html;
    },
  };

  // Expose the module to window
  window.InstructorResultHandlers = ResultHandlers;
})(window);
