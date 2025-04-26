// /modules/screen/dom.js

// Expose functions and elements through window object
window.screenDOM = {};

// DOM Elements
window.screenDOM.elements = {
  gameStatus: document.getElementById('gameStatus'),
  roundNumber: document.getElementById('roundNumber'),
  totalRounds: document.getElementById('totalRounds'),
  timer: document.getElementById('timer'),
  eventLog: document.getElementById('eventLog'),
  playerList: document.getElementById('playerList'),
  playerCount: document.getElementById('playerCount'),
  submissionCount: document.getElementById('submissionCount'),
  avgCapital: document.getElementById('avgCapital'),
  avgOutput: document.getElementById('avgOutput'),
};

// Helper function to add an event to the log
window.screenDOM.addEvent = function (type, message, highlight = false) {
  const eventElement = document.createElement('div');
  eventElement.classList.add('event');
  if (highlight) {
    eventElement.classList.add('highlight');
  }

  // Format timestamp
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  eventElement.innerHTML = `
    <div class="event-time">${timeString}</div>
    <div class="event-message">${message}</div>
  `;

  // Add the event to the top of the log
  const eventLog = window.screenDOM.elements.eventLog;
  eventLog.insertBefore(eventElement, eventLog.firstChild);

  // Auto-scroll to the top
  eventLog.scrollTop = 0;

  // Cleanup old events if there are too many
  if (eventLog.children.length > CONSTANTS.MAX_EVENT_LOG_SIZE) {
    eventLog.removeChild(eventLog.lastChild);
  }
};

// Helper function to update player list
window.screenDOM.updatePlayerList = function () {
  const { playerList, playerCount, submissionCount } =
    window.screenDOM.elements;
  const { players, submittedPlayers, autoSubmittedPlayers } =
    window.screenGame.getState();

  // Clear existing player list
  playerList.innerHTML = '';

  // Update player count
  playerCount.textContent = players.length;

  // Update submission count
  submissionCount.textContent = `${submittedPlayers.length}/${players.length}`;

  // Add all players to the list
  players.forEach((player) => {
    const playerElement = document.createElement('div');
    playerElement.classList.add(CONSTANTS.CSS.PLAYER_ITEM);

    const isSubmitted = submittedPlayers.includes(player);
    const isAutoSubmitted = autoSubmittedPlayers.includes(player);

    // Add submitted class if the player has submitted their investment
    if (isSubmitted) {
      playerElement.classList.add(CONSTANTS.CSS.PLAYER_SUBMITTED);

      // Add auto-submitted class if the player's investment was auto-submitted
      if (isAutoSubmitted) {
        playerElement.classList.add(CONSTANTS.CSS.PLAYER_AUTO_SUBMITTED);
        playerElement.title = CONSTANTS.UI_TEXT.TITLE_AUTO_SUBMITTED;
      }
    }

    // Add player name
    playerElement.textContent = player;

    playerList.appendChild(playerElement);
  });
};

// Helper function to calculate averages
window.screenDOM.updateAverages = function () {
  const { avgCapital, avgOutput } = window.screenDOM.elements;
  const { capitalValues, outputValues } = window.screenGame.getState();

  // Calculate average capital
  if (capitalValues.length > 0) {
    const total = capitalValues.reduce(
      (sum, value) => sum + parseFloat(value),
      0
    );
    const average = total / capitalValues.length;
    avgCapital.textContent = average.toFixed(CONSTANTS.DECIMAL_PRECISION);
  }

  // Calculate average output
  if (outputValues.length > 0) {
    const total = outputValues.reduce(
      (sum, value) => sum + parseFloat(value),
      0
    );
    const average = total / outputValues.length;
    avgOutput.textContent = average.toFixed(CONSTANTS.DECIMAL_PRECISION);
  }
};
