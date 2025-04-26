const CONSTANTS = require('../shared/constants');

/**
 * Get the room identifier for a specific player
 * @param {string} playerName - The name of the player
 * @return {string} The room identifier for the player
 */
function getPlayerRoom(playerName) {
  return `${CONSTANTS.SOCKET_ROOMS.PLAYER_PREFIX}${playerName}`;
}

module.exports = { getPlayerRoom };
