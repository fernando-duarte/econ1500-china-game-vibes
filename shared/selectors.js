/**
 * Shared selectors used by both the application and tests
 * When HTML IDs change, update only this file instead of both app and tests
 */
const SELECTORS = {
  STUDENT: {
    JOIN_FORM: 'joinForm',
    PLAYER_NAME: 'playerName',
    GAME_CODE: 'gameCode',
    JOIN_BUTTON: 'joinButton',
    GAME_UI: 'gameUI',
    DECISION_FORM: 'decisionForm',
    INVESTMENT: 'investment',
    SUBMIT_DECISION: 'submitDecision',
    CONFIRMATION_MESSAGE: 'confirmationMessage',
  },
  INSTRUCTOR: {
    CREATE_FORM: 'createGameForm',
    INSTRUCTOR_NAME: 'instructorName',
    CREATE_BUTTON: 'createGameButton',
    GAME_CONTROLS: 'gameControls',
    START_BUTTON: 'startGameButton',
    PAUSE_BUTTON: 'pauseGameButton',
    RESUME_BUTTON: 'resumeGameButton',
    END_BUTTON: 'endGameButton',
  },
  SCREEN: {
    GAME_SCREEN: 'gameScreen',
    GAME_STATE: 'gameState',
    GAME_INFO: 'gameInfo',
    PLAYER_TABLE: 'playerTable',
    AVERAGE_CAPITAL: 'averageCapital',
    PLAYER_COUNT: 'playerCount',
    ROUND_INFO: 'roundInfo',
  },
};

// Export for both browser and Node environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SELECTORS;
} else if (typeof window !== 'undefined') {
  window.SELECTORS = SELECTORS;
}
