/**
 * Instructor Round Handlers
 * Manages round-related events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Round handlers for instructor client
   * @namespace
   */
  const RoundHandlers = {
    /**
     * Handle round start event
     * @param {Object} data - Round data
     */
    handleRoundStart: function (data) {
      SocketUtils.logEvent('Round start', data);
      const elements = InstructorDom.elements;

      // Update round number
      if (elements.roundNumber) {
        elements.roundNumber.textContent = data.roundNumber;
      }

      // Update round status
      if (elements.roundStatus) {
        elements.roundStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      }

      // Initialize timer with server time
      if (elements.roundTimer && data.timeRemaining !== undefined) {
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

      InstructorDom.updateCurrentInvestmentsTable(
        InstructorGame.state.currentRoundInvestments
      );

      // Show round results section if it's not the first round
      if (
        data.roundNumber > CONSTANTS.FIRST_ROUND_NUMBER &&
        elements.roundResultsSection
      ) {
        elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }

      // Show current investments section
      if (elements.currentInvestmentsSection) {
        elements.currentInvestmentsSection.classList.remove(
          CONSTANTS.CSS.HIDDEN
        );
      }
    },

    /**
     * Handle round summary event
     * @param {Object} data - Round summary data
     */
    handleRoundSummary: function (data) {
      SocketUtils.logEvent('Round summary', data);
      const elements = InstructorDom.elements;

      // Update round number and status
      if (elements.roundNumber) {
        elements.roundNumber.textContent = data.roundNumber;
      }

      if (elements.roundStatus) {
        elements.roundStatus.textContent = `${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_PREFIX}${data.roundNumber}${CONSTANTS.UI_TEXT.STATUS_ROUND_COMPLETED_SUFFIX}`;
      }

      // Update results table
      window.InstructorRoundResultsHandlers.updateRoundResultsTable(
        elements,
        data.results
      );

      // Show round results section
      if (elements.roundResultsSection) {
        elements.roundResultsSection.classList.remove(CONSTANTS.CSS.HIDDEN);
      }
    },

    /**
     * Handle timer update event
     * @param {Object} data - Timer data
     */
    handleTimerUpdate: function (data) {
      if (!data || data.timeRemaining === undefined) return;

      const elements = InstructorDom.elements;
      if (elements.roundTimer) {
        elements.roundTimer.textContent = data.timeRemaining;

        // Add warning class for low time
        if (data.timeRemaining <= CONSTANTS.TIMER_WARNING_THRESHOLD_SECONDS) {
          elements.roundTimer.classList.add('timer-warning');
        } else {
          elements.roundTimer.classList.remove('timer-warning');
        }
      }
    },
  };

  // Expose the module to window
  window.InstructorRoundHandlers = RoundHandlers;
})(window);
