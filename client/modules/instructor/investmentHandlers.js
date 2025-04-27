/**
 * Instructor Investment Handlers
 * Manages investment-related events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Investment handlers for instructor client
   * @namespace
   */
  const InvestmentHandlers = {
    /**
     * Handle investment received event
     * @param {Object} data - Investment data
     */
    handleInvestmentReceived: function (data) {
      SocketUtils.logEvent('Investment received', data);

      // Make sure we have the data we need
      if (!data || !data.playerName) {
        console.error('Invalid investment_received data:', data);
        return;
      }

      // Record investment in game state
      InstructorGame.recordInvestment(
        data.playerName,
        data.investment,
        data.isAutoSubmit
      );

      // Ensure investments section is visible
      const elements = InstructorDom.elements;
      if (
        elements.currentInvestmentsSection &&
        elements.currentInvestmentsSection.classList.contains(
          CONSTANTS.CSS.HIDDEN
        )
      ) {
        elements.currentInvestmentsSection.classList.remove(
          CONSTANTS.CSS.HIDDEN
        );
      }

      // Update the investments table with a slight delay to ensure DOM updates
      setTimeout(() => {
        InstructorDom.updateCurrentInvestmentsTable(
          InstructorGame.state.currentRoundInvestments
        );
      }, CONSTANTS.MEDIUM_UI_DELAY_MS);

      // Force UI update for player list
      InstructorDom.updatePlayerList(
        InstructorGame.state.players,
        InstructorGame.state.submittedPlayers,
        InstructorGame.state.autoSubmittedPlayers
      );

      // Display status message
      const formattedInvestment = SocketUtils.formatNumber(
        data.investment,
        CONSTANTS.DECIMAL_PRECISION
      );
      InstructorDom.displayStatusMessage(
        `${data.playerName} submitted their investment: ${formattedInvestment}`
      );

      // Check for all submitted
      if (InstructorGame.areAllPlayersSubmitted()) {
        this.handleAllPlayersSubmitted();
      }
    },

    /**
     * Handle when all players have submitted investments
     */
    handleAllPlayersSubmitted: function () {
      const elements = InstructorDom.elements;

      // If we're in round 0 and all players submitted, update UI to "Round 1" proactively
      if (
        elements.roundNumber &&
        elements.roundNumber.textContent ===
          String(CONSTANTS.FIRST_ROUND_NUMBER - 1)
      ) {
        elements.roundNumber.textContent = String(CONSTANTS.FIRST_ROUND_NUMBER);

        if (elements.roundStatus) {
          elements.roundStatus.textContent =
            CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
        }
      }
    },

    /**
     * Handle all students submitted event
     * @param {Object} data - Submission data
     */
    handleAllSubmitted: function (data) {
      SocketUtils.logEvent('All submitted', data);
      const elements = InstructorDom.elements;

      // Update round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ALL_SUBMITTED_ENDING;
        elements.roundStatus.classList.add(CONSTANTS.CSS.ALL_SUBMITTED_STATUS);

        // Restore previous status after the early end
        setTimeout(() => {
          elements.roundStatus.classList.remove(
            CONSTANTS.CSS.ALL_SUBMITTED_STATUS
          );
        }, data.timeRemaining * CONSTANTS.MILLISECONDS_PER_SECOND);
      }
    },
  };

  // Expose the module to window
  window.InstructorInvestmentHandlers = InvestmentHandlers;
})(window);
