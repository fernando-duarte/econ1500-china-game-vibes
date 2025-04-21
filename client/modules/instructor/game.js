// client/modules/instructor/game.js
(function (window) {
  'use strict';

  // Define InstructorGame module
  const InstructorGame = {
    // Game state
    state: {
      players: [],
      submittedPlayers: [],
      autoSubmittedPlayers: [],
      currentRoundInvestments: {},
    },

    // Methods
    resetGameState: function () {
      this.state.players = [];
      this.state.submittedPlayers = [];
      this.state.autoSubmittedPlayers = [];
      this.state.currentRoundInvestments = {};
    },

    addPlayer: function (playerName) {
      // Add player to the list if not already there
      if (!this.state.players.includes(playerName)) {
        console.log(`Adding ${playerName} to players array`);
        this.state.players.push(playerName);
        console.log('Updated players array:', this.state.players);
        return true;
      } else {
        console.log(`Player ${playerName} already in list`);
        return false;
      }
    },

    recordInvestment: function (playerName, investment, isAutoSubmit = false) {
      // Store the investment value for the current round
      if (investment !== undefined) {
        this.state.currentRoundInvestments[playerName] = {
          investment: investment,
          isAutoSubmit: isAutoSubmit || false,
        };
      }

      // Mark player as submitted
      if (!this.state.submittedPlayers.includes(playerName)) {
        this.state.submittedPlayers.push(playerName);

        // Track auto-submitted investments
        if (isAutoSubmit) {
          this.state.autoSubmittedPlayers.push(playerName);
        }
        return true;
      }
      return false;
    },

    resetRoundState: function () {
      this.state.submittedPlayers = [];
      this.state.autoSubmittedPlayers = [];
      this.state.currentRoundInvestments = {};
    },

    areAllPlayersSubmitted: function () {
      return (
        this.state.submittedPlayers.length === this.state.players.length &&
        this.state.players.length > 0
      );
    },
  };

  // Expose the module to window
  window.InstructorGame = InstructorGame;
})(window);
