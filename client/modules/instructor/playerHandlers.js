/**
 * Instructor Player Handlers
 * Manages player-related events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Player handlers for instructor client
   * @namespace
   */
  const PlayerHandlers = {
    /**
     * Handle player joined event
     * @param {Object} data - Player data
     */
    handlePlayerJoined: function (data) {
      SocketUtils.logEvent('Player joined', data);

      // Add player to game state
      InstructorGame.addPlayer(data.playerName);

      // Update player list UI
      InstructorDom.updatePlayerList(
        InstructorGame.state.players,
        InstructorGame.state.submittedPlayers,
        InstructorGame.state.autoSubmittedPlayers
      );

      // Update player count
      this.updatePlayerCount();

      // Show notification for reconnection
      if (data.isReconnect) {
        InstructorDom.displayStatusMessage(
          `${data.playerName} reconnected to the game`
        );
      }

      // Update manual start controls if needed
      if (data.manualStartEnabled !== undefined) {
        this.updateManualStartControls(data.manualStartEnabled);
      }
    },

    /**
     * Update player count display
     */
    updatePlayerCount: function () {
      const elements = InstructorDom.elements;
      const count = InstructorGame.state.players.length;

      if (elements.playerCount) {
        const countText = `${count} player${count !== 1 ? CONSTANTS.UI_TEXT.PLAYER_PLURAL_SUFFIX : ''}${CONSTANTS.UI_TEXT.PLAYER_JOINED_SUFFIX}`;
        elements.playerCount.textContent = countText;
      }
    },

    /**
     * Handle player disconnected event
     * @param {Object} data - Player disconnection data
     */
    handlePlayerDisconnected: function (data) {
      SocketUtils.logEvent('Player disconnected', data);

      if (data && data.playerName) {
        InstructorDom.displayStatusMessage(
          `${data.playerName} disconnected from the game`
        );

        // Update UI if needed - we don't remove the player from the list
        // as they might reconnect, but we could mark them as disconnected
        InstructorDom.updatePlayerList(
          InstructorGame.state.players,
          InstructorGame.state.submittedPlayers,
          InstructorGame.state.autoSubmittedPlayers,
          data.playerName
        );
      }
    },
  };

  // Expose the module to window
  window.InstructorPlayerHandlers = PlayerHandlers;
})(window);
