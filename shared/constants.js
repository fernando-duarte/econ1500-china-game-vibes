// Game configuration constants
const GAME_CONSTANTS = {
  // Round configuration
  ROUNDS: 10,
  ROUND_DURATION_SECONDS: 60,
  FIRST_ROUND_NUMBER: 1,
  MAX_PLAYERS: 50, // Maximum number of players allowed

  // Economic model constants
  INITIAL_CAPITAL: 100,
  ALPHA: 0.3,
  DEPRECIATION_RATE: 0.1,
  NEGATIVE_INITIAL_VALUE: -1, // Used as sentinel value for finding maximums

  // Display constants
  DECIMAL_PRECISION: 1,
  DISPLAY_INDEX_OFFSET: 1,
  TIMER_WARNING_THRESHOLD_SECONDS: 5, // When to show timer warning
  MAX_EVENT_LOG_SIZE: 50, // Maximum number of events in event log

  // Investment constants
  INVESTMENT_STEP: 0.1,
  INVESTMENT_MIN: 0,

  // Timing constants
  MILLISECONDS_PER_SECOND: 1000,
  AUTO_SUBMIT_THRESHOLD_SECONDS: 1,
  ALL_SUBMITTED_UI_DELAY_MS: 2000, // Delay before ending round after all players submitted (for UI updates)
  ALL_SUBMITTED_NOTIFICATION_SECONDS: 2, // How long to show all-submitted notification
  NOTIFICATION_DISPLAY_MS: 5000, // How long to show notifications
  STATUS_MESSAGE_DISPLAY_MS: 3000, // How long to show status messages
  SHORT_UI_DELAY_MS: 10, // Very short delay for UI repaints
  MEDIUM_UI_DELAY_MS: 50, // Medium delay for UI updates
  CSS_ANIMATION_DURATION_SECONDS: 0.5, // Duration for UI animations

  // UI Hacks
  REPAINT_HACK_OPACITY: '0.99', // Temporary opacity to force browser repaint
  OPACITY_FULL: '1', // Full opacity value for restoring after repaint

  // Auto-start feature
  AUTO_START_ENABLED: true, // Enabled - will auto-start when manual mode is turned off
  AUTO_START_PLAYERS: 3, // Default number of players needed if auto-start is enabled

  // Server defaults
  DEFAULT_PORT: 3000,

  // Game state constants
  GAME_STATES: {
    INACTIVE: 'inactive',
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed',
  },

  // Content type constants
  CONTENT_TYPES: {
    JAVASCRIPT: 'application/javascript',
  },

  // Environment constants
  ENVIRONMENT: {
    TYPEOF_UNDEFINED: 'undefined',
  },

  // CSS layout constant for stat-box width
  STAT_BOX_MIN_WIDTH: 150,

  // Socket Room Constants
  SOCKET_ROOMS: {
    ALL: 'all',
    PLAYERS: 'players',
    INSTRUCTOR: 'instructor',
    SCREENS: 'screens',
    PLAYER_PREFIX: 'player:',
  },

  // Game Role Constants
  GAME_ROLES: {
    PLAYER: 'player',
    INSTRUCTOR: 'instructor',
    SCREEN: 'screen',
  },

  // Error Message Constants
  ERROR_MESSAGES: {
    NOT_AUTHORIZED: 'Not authorized',
    PLAYER_NAME_REQUIRED: 'Player name is required',
    ERROR_JOINING_GAME: 'Error joining game',
    ERROR_CREATING_GAME: 'Error creating game',
    ERROR_STARTING_GAME: 'Error starting game',
    ERROR_FORCE_END_GAME: 'Failed to force end game',
    ERROR_PROCESSING_FORCE_END_GAME: 'Error processing force end game request',
    ERROR_SETTING_MANUAL_START: 'Error setting manual start mode',
    ERROR_PROCESSING_INVESTMENT: 'Error processing investment',
    NOT_IN_GAME: 'Not in a game',
    ERROR_CONNECTING_SCREEN: 'Error connecting screen',
    INVALID_INPUT: 'Invalid input',
    SERVER_ERROR_RECONNECT: 'Server error reconnecting to game',
    GAME_ALREADY_IN_PROGRESS: 'Game already in progress',
    PLAYER_NAME_TAKEN: 'Player name already taken',
    MAX_PLAYERS_REACHED: 'Maximum number of players reached',
    NO_PLAYERS_IN_GAME: 'No players in the game',
    PLAYER_NOT_FOUND: 'Player not found',
    GAME_NOT_RUNNING: 'Game is not running',
  },

  // Notification Messages
  NOTIFICATION_MESSAGES: {
    GAME_ENDING: 'Game is being ended by the instructor...',
  },

  // Debug Message Constants
  DEBUG_MESSAGES: {
    // Auto-start related
    AUTO_START_FAILED: 'Auto-start failed:',
    AUTO_START_FAILED_NO_IO: 'Auto-start failed: io object is missing',

    // Timer-related errors
    ERROR_CLEARING_TIMERS_START_ROUND:
      'Error clearing existing timers in startRound:',
    ERROR_TIMER_INTERVAL: 'Error in timer interval:',
    ERROR_ROUND_END_TIMEOUT: 'Error in round end timeout:',
    ERROR_SETTING_UP_TIMERS: 'Error setting up timers:',
    ERROR_CLEARING_TIMERS_END_ROUND: 'Error clearing timers in endRound:',
    ERROR_CLEARING_TIMERS: 'Error clearing timers:',
    ERROR_CLEARING_TIMERS_FORCE_END: 'Error clearing timers in forceEndGame:',

    // IO-related errors
    NO_IO_AVAILABLE_END_ROUND: 'No io object available when ending round!',
    CANNOT_START_NEXT_ROUND: 'Cannot start next round - no io object available!',

    // Socket handlers errors
    ERROR_IN_SCREEN_CONNECT: 'Error in screen_connect:',
    ERROR_IN_CREATE_GAME: 'Error in create_game:',
    ERROR_IN_JOIN_GAME: 'Error in join_game:',
    ERROR_IN_RECONNECT_GAME: 'Error in reconnect_game:',
    ERROR_IN_START_GAME: 'Error in start_game:',
    ERROR_IN_FORCE_END_GAME: 'Error in force_end_game:',
    ERROR_IN_SET_MANUAL_START: 'Error in set_manual_start:',
    PLAYER_JOIN_FAILED: 'Player join failed for',
    NO_PLAYER_NAME:
      'Cannot process investment: No player name associated with socket',
    INVESTMENT_SUBMISSION_FAILED: 'Investment submission failed for',
    ERROR_IN_SUBMIT_INVESTMENT: 'Error in submit_investment:',
    ERROR_ENDING_ROUND: 'Error ending round:',
    ERROR_SENDING_NOTIFICATIONS: 'Error sending notifications:',
    ERROR_IN_DISCONNECT: 'Error in disconnect handler:',

    // Server errors
    UNCAUGHT_EXCEPTION: 'Uncaught Exception:',
    UNHANDLED_REJECTION: 'Unhandled Rejection at:',
    EXPRESS_ERROR: 'Express error:',

    // Client-side errors
    INVALID_INVESTMENT_DATA: 'Invalid investment_received data:',
    SOCKET_ERROR: 'Socket error:',
  },

  // UI Text Constants
  UI_TEXT: {
    STATUS_ENABLED: 'Enabled',
    STATUS_DISABLED: 'Disabled',
    STATUS_ROUND_IN_PROGRESS: 'Round in progress',
    STATUS_GAME_OVER: 'Game over',
    STATUS_ALL_SUBMITTED_ENDING: 'All students submitted. Round ending...',
    STATUS_PLAYER_SUBMITTED: '✓ Submitted',
    STATUS_PLAYER_PENDING: 'Pending',
    STATUS_ROUND_COMPLETED: 'Round completed',
    STATUS_ROUND_COMPLETED_PREFIX: 'Round ',
    STATUS_ROUND_COMPLETED_SUFFIX: ' completed',
    STATUS_WAITING_FOR_PLAYERS: 'Waiting for Players',
    STATUS_GAME_STARTING: 'Game Starting',
    STATUS_WAITING_FOR_GAME: 'Waiting for Game',
    STATUS_GAME_STARTED: 'Game has started. Waiting for first round...',
    STATUS_ALREADY_SUBMITTED:
      'You have already submitted your investment for this round',
    STATUS_TIME_EXPIRED:
      'Time expired. Current investment value submitted automatically.',
    STATUS_ENDING: 'Ending...',
    STATUS_WAITING_FOR_GAME_START: 'Waiting for game to start...',
    STATUS_WAITING_FOR_NEXT_ROUND: 'Waiting for next round...',
    TITLE_AUTO_SUBMITTED: 'Auto-submitted (current slider value)',
    AUTO_SUBMIT_SUFFIX: ' (auto)',
    PLACEHOLDER_INVESTMENT_SUBMITTED: 'No investments submitted yet',
    CONFIRM_FORCE_END:
      'Are you sure you want to force end the game? This will end the current round and declare a winner immediately.',
    CONFIRM_START_GAME_PREFIX: 'Start the game with ',
    CONFIRM_START_GAME_SUFFIX: ' player(s)?',
    ALERT_NO_PLAYERS:
      'No players have joined yet. Wait for at least one player to join before starting the game.',
    ERROR_ENTER_NAME: 'Please enter your name',
    ERROR_ENTER_TEAM_NAME: 'Please enter a team name',
    ERROR_SELECT_STUDENTS: 'Please select at least one student',
    ERROR_ENTER_VALID_NUMBER: 'Please enter a valid number',
    STATUS_INVESTMENT_SUBMITTED:
      'Investment submitted. Waiting for other players...',
    STATUS_TIMES_UP_AUTO_SUBMIT:
      'Time\'s up! Your investment was auto-submitted.',
    STATUS_GAME_OVER_NO_INVESTMENTS:
      'Game is over. No more investments can be made.',
    ALL_SUBMITTED_NOTIFICATION:
      'All players have submitted investments. Round ending early...',
    ERROR_PREFIX: 'Error: ',
    TIMER_PLACEHOLDER: '-',
    ROUND_COMPLETED_FORMAT: 'Round {0} Completed',
    PLACEHOLDER_TEXT: '-',
    PLAYER_NAME_PLACEHOLDER: 'Enter your name',
    TEAM_NAME_PLACEHOLDER: 'Enter your team name',
    PLAYER_PLURAL_SUFFIX: 's',
    PLAYER_JOINED_SUFFIX: ' have joined',
    LOADING_STUDENT_LIST: 'Loading student list...'
  },

  // CSS Class Constants
  CSS: {
    HIDDEN: 'hidden',
    PLAYER_ITEM: 'player-item',
    PLAYER_SUBMITTED: 'player-submitted',
    PLAYER_AUTO_SUBMITTED: 'player-auto-submitted',
    AUTO_SUBMITTED_ROW: 'auto-submitted-row',
    ADMIN_NOTIFICATION: 'admin-notification',
    ADMIN_NOTIFICATION_PREFIX: 'admin-notification-',
    PLACEHOLDER_TEXT: 'placeholder-text',
    STATUS_MESSAGE: 'status-message',
    ALL_SUBMITTED_STATUS: 'all-submitted-status',
    PLAYER_NAME: 'player-name',
    PLAYER_STATUS: 'player-status',
    PLAYER_STATUS_PENDING: 'pending',
  },

  // Socket.IO Events
  SOCKET: {
    // Connection events
    EVENT_CONNECT: 'connect',
    EVENT_DISCONNECT: 'disconnect',
    EVENT_ERROR: 'error',

    // Game state events (server → client)
    EVENT_GAME_CREATED: 'game_created',
    EVENT_PLAYER_JOINED: 'player_joined',
    EVENT_GAME_STARTED: 'game_started',
    EVENT_ROUND_START: 'round_start',
    EVENT_INVESTMENT_RECEIVED: 'investment_received',
    EVENT_ALL_SUBMITTED: 'all_submitted',
    EVENT_ROUND_SUMMARY: 'round_summary',
    EVENT_ROUND_END: 'round_end',
    EVENT_GAME_OVER: 'game_over',
    EVENT_MANUAL_START_MODE: 'manual_start_mode',
    EVENT_ADMIN_NOTIFICATION: 'admin_notification',
    EVENT_TIMER_UPDATE: 'timer_update',
    EVENT_GAME_JOINED: 'game_joined',
    EVENT_STATE_SNAPSHOT: 'state_snapshot',
    EVENT_INSTRUCTOR_DISCONNECTED: 'instructor_disconnected',
    EVENT_PLAYER_DISCONNECTED: 'player_disconnected',

    // Team registration events
    EVENT_STUDENT_LIST: 'student_list',
    EVENT_TEAM_REGISTERED: 'team_registered',

    // Control events (client → server)
    EVENT_FORCE_END_GAME: 'force_end_game',
    EVENT_SET_MANUAL_START: 'set_manual_start',
    EVENT_START_GAME: 'start_game',
    EVENT_SUBMIT_INVESTMENT: 'submit_investment',
    EVENT_JOIN_GAME: 'join_game', // Deprecated: Join functionality replaced by team registration
    EVENT_SCREEN_CONNECT: 'screen_connect',
    EVENT_RECONNECT_GAME: 'reconnect_game',
    EVENT_CREATE_GAME: 'create_game',
    EVENT_JOIN_ACK: 'join_ack',
    EVENT_GET_STUDENT_LIST: 'get_student_list',
    EVENT_REGISTER_TEAM: 'register_team'
  },

  // Notification Types
  NOTIFICATION: {
    TYPE_INFO: 'info',
    TYPE_WARNING: 'warning',
    TYPE_ERROR: 'error',
    DEFAULT_TYPE: 'info',
  },

  // HTTP Routes
  ROUTES: {
    ROOT: '/',
    INSTRUCTOR: '/instructor',
    STUDENT: '/',
    SCREEN: '/screen',
    SHARED: '/shared',
    CONSTANTS: '/constants.js',
  },

  // Table columns
  INVESTMENTS_TABLE_COLUMN_COUNT: 2,
};

// Calculated constants (derived from the above)
const CALCULATED_CONSTANTS = {
  INITIAL_OUTPUT: Math.pow(
    GAME_CONSTANTS.INITIAL_CAPITAL,
    GAME_CONSTANTS.ALPHA,
  ).toFixed(GAME_CONSTANTS.DECIMAL_PRECISION),
};

const ALL_CONSTANTS = {
  ...GAME_CONSTANTS,
  ...CALCULATED_CONSTANTS,
};

// Export for server-side use
if (
  typeof module !== GAME_CONSTANTS.ENVIRONMENT.TYPEOF_UNDEFINED &&
  module.exports
) {
  module.exports = {
    ...ALL_CONSTANTS,
  };
}
