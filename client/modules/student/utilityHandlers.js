/**
 * Student Utility Handlers
 * Manages utility events for student interface
 */
(function (window) {
  'use strict';

  /**
   * Utility handlers for student client
   * @namespace
   */
  const UtilityHandlers = {
    /**
     * Handle state snapshot event
     * @param {Object} data - State snapshot data
     */
    handleStateSnapshot: function (data) {
      SocketUtils.logEvent('State snapshot', data);
      const elements = StudentDom.elements;

      // Update round number
      SocketUtils.updateElementText(elements.roundNumber, data.roundNumber);

      // Update duplicate round number if it exists
      if (document.getElementById('roundNumberDuplicate')) {
        document.getElementById('roundNumberDuplicate').textContent =
          data.roundNumber;
      }
      if (document.getElementById('totalRoundsDuplicate')) {
        document.getElementById('totalRoundsDuplicate').textContent =
          CONSTANTS.ROUNDS;
      }

      // Update capital and output values
      this.updateCapitalOutput(elements, data);

      // Handle submission status
      if (data.submitted && elements.investmentStatus) {
        elements.investmentStatus.textContent =
          CONSTANTS.UI_TEXT.STATUS_ALREADY_SUBMITTED;
        StudentGame.disableInvestmentControls();
      }

      // Show the appropriate UI
      StudentDom.showInvestmentUI();

      // Initialize timer display from state
      if (data.timeRemaining && elements.timer) {
        elements.timer.textContent = data.timeRemaining;
      }
    },

    /**
     * Handle timer update event
     * @param {Object} data - Timer data
     */
    handleTimerUpdate: function (data) {
      SocketUtils.logEvent('Timer update', data);
      const elements = StudentDom.elements;

      // Update timer display
      if (elements.timer && data.timeRemaining !== undefined) {
        elements.timer.textContent = data.timeRemaining;
      }

      // Auto-submit if time is below threshold and no submission yet
      if (
        data.timeRemaining <= CONSTANTS.AUTO_SUBMIT_THRESHOLD_SECONDS &&
        !StudentGame.state.hasSubmittedInvestment &&
        elements.investmentSlider
      ) {
        const currentInvestment = parseFloat(elements.investmentSlider.value);
        this.submitInvestment(currentInvestment, true);
        StudentGame.disableInvestmentControls(
          CONSTANTS.UI_TEXT.STATUS_TIME_EXPIRED
        );
      }
    },

    /**
     * Handle error event
     * @param {Object} data - Error data
     */
    handleError: function (data) {
      SocketUtils.logEvent('Error', data);
      // General error handling - log to console
      console.error('Server error:', data.message);
    },

    /**
     * Handle admin notification event
     * @param {Object} data - Notification data
     */
    handleAdminNotification: function (data) {
      SocketUtils.logEvent('Admin notification', data);
      if (data.message) {
        StudentDom.displayAdminNotification(data.message, data.type || 'info');
      }
    },
  };

  // Expose the module to window
  window.StudentUtilityHandlers = UtilityHandlers;
})(window);
