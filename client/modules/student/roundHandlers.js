/**
 * Student Round Handlers
 * Manages round-specific events for student interface
 */
(function (window) {
  'use strict';

  /**
   * Round handlers for student client
   * @namespace
   */
  const RoundHandlers = {
    /**
     * Handle round start event
     * @param {Object} data - Round data
     */
    handleRoundStart: function (data) {
      SocketUtils.logEvent('Round start', data);
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

      // Update round status
      SocketUtils.updateElementText(
        elements.roundStatus,
        CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS
      );

      // Update duplicate round status if it exists
      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_ROUND_IN_PROGRESS;
      }

      // Make sure game over UI is hidden
      if (
        elements.gameOverUI &&
        !elements.gameOverUI.classList.contains('hidden')
      ) {
        StudentDom.resetGameUI();
      }

      // Configure investment UI for new round
      this.configureInvestmentUI(elements, data);

      // Initialize timer with the server's time
      SocketUtils.updateElementText(elements.timer, data.timeRemaining);
    },

    /**
     * Update capital and output values
     * @param {Object} elements - DOM elements
     * @param {Object} data - Game data
     */
    updateCapitalOutput: function (elements, data) {
      if (data.capital !== undefined && elements.capital) {
        elements.capital.textContent = data.capital;
        StudentGame.state.lastCapital = data.capital;
      }

      if (data.output !== undefined && elements.output) {
        elements.output.textContent = data.output;
        StudentGame.state.currentOutput = data.output;
        StudentGame.state.lastOutput = data.output;
      }
    },

    /**
     * Configure investment UI for new round
     * @param {Object} elements - DOM elements
     * @param {Object} data - Round data
     */
    configureInvestmentUI: function (elements, data) {
      // Configure investment slider
      if (elements.investmentSlider) {
        elements.investmentSlider.min = CONSTANTS.INVESTMENT_MIN;
        elements.investmentSlider.max = data.output;
        elements.investmentSlider.value = CONSTANTS.INVESTMENT_MIN;
      }

      // Configure investment value input
      if (elements.investmentValue) {
        elements.investmentValue.value = CONSTANTS.INVESTMENT_MIN;
      }

      // Update max output display
      SocketUtils.updateElementText(elements.maxOutput, data.output);

      // Reset investment state
      StudentGame.resetInvestmentState();

      // Show investment UI
      StudentDom.showInvestmentUI();
    },

    /**
     * Handle investment received confirmation
     * @param {Object} data - Investment data
     */
    handleInvestmentReceived: function (data) {
      SocketUtils.logEvent('Investment received', data);

      // Update UI to show investment was received
      const element = StudentDom.elements.investmentResult;
      if (element && data && data.investment !== undefined) {
        element.textContent = data.investment;
      }

      // Ensure the student's investment state is properly updated
      StudentGame.state.hasSubmittedInvestment = true;

      // Disable the investment controls
      StudentGame.disableInvestmentControls(
        CONSTANTS.UI_TEXT.STATUS_INVESTMENT_SUBMITTED
      );
    },

    /**
     * Handle all students submitted event
     * @param {Object} data - Submission data
     */
    handleAllSubmitted: function (data) {
      SocketUtils.logEvent('All submitted', data);
      const elements = StudentDom.elements;

      // Show message that round is ending early
      if (elements.investmentStatus && data.message) {
        elements.investmentStatus.innerHTML = `<span class="all-submitted-message">${data.message}</span>`;
      }

      // Disable controls if not already submitted
      if (!StudentGame.state.hasSubmittedInvestment) {
        StudentGame.disableInvestmentControls();
      }

      // Adjust timer display
      if (elements.timer) {
        elements.timer.classList.add('timer-ending');
        elements.timer.textContent = CONSTANTS.UI_TEXT.STATUS_ENDING;
      }
    },

    /**
     * Handle round results event
     * @param {Object} data - Results data
     */
    handleRoundResults: function (data) {
      SocketUtils.logEvent('Round results', data);
      const elements = StudentDom.elements;

      // Update capital and output with round results
      if (data.capital !== undefined) {
        elements.capital.textContent = data.capital;
        StudentGame.state.lastCapital = data.capital;
      }

      if (data.output !== undefined) {
        elements.output.textContent = data.output;
        StudentGame.state.lastOutput = data.output;
      }

      // Update round status
      elements.roundStatus.textContent = CONSTANTS.UI_TEXT.STATUS_ROUND_ENDED;

      // Update duplicate round status if it exists
      if (document.getElementById('roundStatusDuplicate')) {
        document.getElementById('roundStatusDuplicate').textContent =
          CONSTANTS.UI_TEXT.STATUS_ROUND_ENDED;
      }

      // Hide investment UI until next round
      StudentDom.hideInvestmentUI();
    },
  };

  // Export the handlers to the global scope
  window.RoundHandlers = RoundHandlers;
})(window);
