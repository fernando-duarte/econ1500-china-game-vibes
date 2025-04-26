// client/modules/game.js
(function (window) {
  'use strict';

  // Define StudentGame module
  const StudentGame = {
    // Game state
    state: {
      currentPlayerName: '',
      teamName: '',
      teamMembers: [],
      timerInterval: null,
      currentOutput: CONSTANTS.NEGATIVE_INITIAL_VALUE + 1 * 0,
      hasSubmittedInvestment: false,
      lastCapital: CONSTANTS.NEGATIVE_INITIAL_VALUE + 1 * 0,
      lastOutput: CONSTANTS.NEGATIVE_INITIAL_VALUE + 1 * 0,
    },

    // Methods
    startTimer: function (seconds, onTimeExpired) {
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
      }

      const timer = StudentDom.elements.timer;
      timer.classList.remove('timer-ending');
      timer.textContent = seconds;

      this.state.timerInterval = setInterval(() => {
        seconds--;
        timer.textContent = seconds;

        // When timer reaches warning threshold or less, add warning class
        if (seconds <= CONSTANTS.TIMER_WARNING_THRESHOLD_SECONDS) {
          timer.classList.add('timer-warning');
        }

        if (seconds <= 0) {
          clearInterval(this.state.timerInterval);

          if (onTimeExpired) {
            onTimeExpired();
          }
        }
      }, CONSTANTS.MILLISECONDS_PER_SECOND);
    },
    stopTimer: function () {
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = null;
      }
    },
    resetInvestmentState: function () {
      const elements = StudentDom.elements;

      this.state.hasSubmittedInvestment = false;
      elements.submitInvestment.disabled = false;
      elements.investmentSlider.disabled = false;
      elements.investmentValue.disabled = false;
      elements.investmentStatus.textContent = '';
    },
    disableInvestmentControls: function (statusMessage) {
      const elements = StudentDom.elements;

      elements.submitInvestment.disabled = true;
      elements.investmentSlider.disabled = true;
      elements.investmentValue.disabled = true;
      if (statusMessage) {
        elements.investmentStatus.textContent = statusMessage;
      }
      this.state.hasSubmittedInvestment = true;
    },
    autoSubmitInvestment: function () {
      if (!this.state.hasSubmittedInvestment) {
        const elements = StudentDom.elements;
        const investment =
          parseFloat(elements.investmentValue.value) ||
          CONSTANTS.INVESTMENT_MIN;
        StudentSocket.submitInvestment(investment, true);
        this.disableInvestmentControls(
          CONSTANTS.UI_TEXT.STATUS_TIMES_UP_AUTO_SUBMIT
        );
      }
    },
  };

  // Expose the module to window
  window.StudentGame = StudentGame;
})(window);
