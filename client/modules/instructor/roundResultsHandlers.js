/**
 * Instructor Round Results Handlers
 * Manages round results UI for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Round results handlers for instructor client
   * @namespace
   */
  const RoundResultsHandlers = {
    /**
     * Update round results table with player data
     * @param {Object} elements - DOM elements
     * @param {Array} results - Player results array
     */
    updateRoundResultsTable: function (elements, results) {
      if (!elements.roundResultsBody || !Array.isArray(results)) {
        return;
      }

      // Clear existing rows
      elements.roundResultsBody.innerHTML = '';

      // Add results to the table
      results.forEach((result) => {
        const row = this.createResultRow(result);
        elements.roundResultsBody.appendChild(row);
      });
    },

    /**
     * Create a result row for the round results table
     * @param {Object} result - Player result data
     * @returns {HTMLElement} - Table row element
     */
    createResultRow: function (result) {
      if (!result || !result.playerName) {
        return document.createElement('tr');
      }

      const row = document.createElement('tr');

      // Add auto-submitted class if needed
      if (result.isAutoSubmit) {
        row.classList.add(CONSTANTS.CSS.AUTO_SUBMITTED_ROW);
        row.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
      }

      // Format investment with consistent decimal precision
      const formattedInvestment = SocketUtils.formatNumber(
        result.investment,
        CONSTANTS.DECIMAL_PRECISION
      );
      const autoSubmitSuffix = result.isAutoSubmit
        ? CONSTANTS.UI_TEXT.AUTO_SUBMIT_SUFFIX
        : '';

      row.innerHTML = `
        <td>${result.playerName}</td>
        <td>${formattedInvestment}${autoSubmitSuffix}</td>
        <td>${result.newCapital}</td>
        <td>${result.newOutput}</td>
      `;

      return row;
    },
  };

  // Expose the module to window
  window.InstructorRoundResultsHandlers = RoundResultsHandlers;
})(window);
